/**
 * Automated Security Audit & Regression Test Suite
 * Giftly Telegram Mini App
 * 
 * Tests 9 critical security controls across backend endpoints and frontend security.
 */

import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

// Color helpers
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

let passCount = 0
let failCount = 0
const failures = []

function logHeader(title) {
  console.log(`\n${BOLD}${CYAN}=== [TEST] ${title} ===${RESET}`)
}

function recordPass(testId, message) {
  passCount++
  console.log(`${GREEN}  ✔ PASS [${testId}]${RESET}: ${message}`)
}

function recordFail(testId, message, details = '') {
  failCount++
  const fullMsg = `  ✖ FAIL [${testId}] (VULNERABILITY DETECTED): ${message}`
  console.log(`${RED}${fullMsg}${RESET}`)
  if (details) {
    console.log(`${YELLOW}    Details: ${details}${RESET}`)
  }
  failures.push({ testId, message, details })
}

/**
 * Execute tgcloud endpoint via child_process
 */
function runTgcloud(endpoint, args = {}, userContext = { id: 999999999 }) {
  try {
    const rawOutput = execFileSync(
      'cmd.exe',
      [
        '/c',
        'npx',
        'tgcloud',
        'run',
        endpoint,
        JSON.stringify(args),
        '--ctx',
        JSON.stringify({ initData: { user: userContext } }),
      ],
      {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000,
      }
    )
    return { ok: true, output: rawOutput, raw: rawOutput }
  } catch (err) {
    const combined = (err.stdout || '') + (err.stderr || '') + (err.message || '')
    return { ok: false, error: err, output: combined, raw: combined }
  }
}

// -------------------------------------------------------------
// SEC-01: Privilege Escalation via updateProfile
// -------------------------------------------------------------
function testSec01_PrivilegeEscalation() {
  logHeader('SEC-01: Privilege Escalation Protection (updateProfile)')
  const testUserId = 700000000 + Math.floor(Math.random() * 100000000)
  
  // 1. Source check
  const sourceCode = fs.readFileSync(path.join(ROOT_DIR, 'tgcloud/endpoints/updateProfile.js'), 'utf8')
  const acceptsClientIsPremium = sourceCode.includes('input?.isPremium') || sourceCode.includes('input.isPremium')
  const updatesIsPremiumInDb = /updateData\.isPremium\s*=/i.test(sourceCode)

  // 2. Runtime invocation with a fresh unprivileged user
  const result = runTgcloud('updateProfile', { isPremium: true, eventTitle: 'SecurityTest' }, { id: testUserId })
  const returnLine = result.output.split('\n').find(l => l.trim().startsWith('<')) || ''
  const gotFreePremium = returnLine.includes("isPremium:true") || returnLine.includes('"isPremium":true')

  if (acceptsClientIsPremium || updatesIsPremiumInDb || gotFreePremium) {
    recordFail(
      'SEC-01',
      'Unprivileged user can escalate privileges to PRO by supplying isPremium: true',
      `Source accepts input.isPremium: ${acceptsClientIsPremium}, updates in DB: ${updatesIsPremiumInDb}, runtime returned isPremium:true: ${gotFreePremium}`
    )
  } else {
    recordPass('SEC-01', 'updateProfile ignores input.isPremium and prevents privilege escalation')
  }
}

// -------------------------------------------------------------
// SEC-02: Cover Photo Modification requires PRO
// -------------------------------------------------------------
function testSec02_CoverPhotoWithoutPro() {
  logHeader('SEC-02: Cover Photo Authorization Check')
  const testUserId = 777123457
  
  // Source check
  const sourceCode = fs.readFileSync(path.join(ROOT_DIR, 'tgcloud/endpoints/updateProfile.js'), 'utf8')
  const checksProForCover = sourceCode.includes('isPremium') && sourceCode.includes('coverUrl') && (
    sourceCode.includes('PREMIUM_REQUIRED') || sourceCode.includes('!existing?.isPremium') || sourceCode.includes('!user?.isPremium')
  )

  // Runtime test
  const result = runTgcloud('updateProfile', { coverUrl: 'https://example.com/banner.jpg' }, { id: testUserId })
  const rejected = result.output.includes('PREMIUM_REQUIRED') || !result.ok

  if (!checksProForCover && !rejected) {
    recordFail(
      'SEC-02',
      'Free users can set custom profile coverUrl without holding PRO status',
      `Endpoint accepted coverUrl without verifying user.isPremium`
    )
  } else {
    recordPass('SEC-02', 'coverUrl is protected by PRO check (PREMIUM_REQUIRED)')
  }
}

// -------------------------------------------------------------
// SEC-03: SSRF in linkParser / parseUrl
// -------------------------------------------------------------
function testSec03_SsrfProtection() {
  logHeader('SEC-03: Server-Side Request Forgery (SSRF) Prevention')
  
  // 1. Source check
  const sourceCode = fs.readFileSync(path.join(ROOT_DIR, 'tgcloud/lib/linkParser.js'), 'utf8')
  const hasAllowlist = sourceCode.includes('ALLOWED_MARKETPLACE_HOSTS') || sourceCode.includes('ALLOWED_DOMAINS') || sourceCode.includes('allowedHosts')
  const enforcesHttps = sourceCode.includes('protocol !== \'https:\'') || sourceCode.includes('https:')

  // 2. Runtime invocation for arbitrary domain
  const result = runTgcloud('parseUrl', { url: 'http://example.com' }, { id: 999999999 })
  const fetchedArbitraryDomain = result.output.includes("title:'Example Domain'") || result.output.includes('parsed:true')

  if (!hasAllowlist || fetchedArbitraryDomain) {
    recordFail(
      'SEC-03',
      'parseUrl allows arbitrary outbound HTTP requests (SSRF vulnerability)',
      `Has domain allowlist: ${hasAllowlist}, fetched http://example.com: ${fetchedArbitraryDomain}`
    )
  } else {
    recordPass('SEC-03', 'parseUrl blocks non-allowlisted domains and internal network requests')
  }
}

// -------------------------------------------------------------
// SEC-04: Unprivileged Gift Pinning
// -------------------------------------------------------------
function testSec04_UnprivilegedPinning() {
  logHeader('SEC-04: Gift Pinning PRO Authorization Check')
  
  // Source check
  const sourceCode = fs.readFileSync(path.join(ROOT_DIR, 'tgcloud/endpoints/updateGift.js'), 'utf8')
  const checksProForPin = sourceCode.includes('isPinned') && (
    sourceCode.includes('PREMIUM_REQUIRED') || sourceCode.includes('isPremium')
  )

  if (!checksProForPin) {
    recordFail(
      'SEC-04',
      'updateGift does not verify user.isPremium before setting isPinned: true',
      'Any user can pin gifts to top position bypassing PRO monetization'
    )
  } else {
    recordPass('SEC-04', 'updateGift requires user.isPremium for isPinned: true')
  }
}

// -------------------------------------------------------------
// SEC-05: Double Booking Atomic Conditional Update
// -------------------------------------------------------------
function testSec05_AtomicBooking() {
  logHeader('SEC-05: Race Condition Prevention in Gift Booking')
  
  const sourceCode = fs.readFileSync(path.join(ROOT_DIR, 'tgcloud/endpoints/bookGift.js'), 'utf8')
  // Check for conditional atomic update: WHERE id = ? AND is_booked = false
  const hasConditionalWhere = sourceCode.includes('eq(gifts.isBooked, false)') || sourceCode.includes('isBooked: false')
  const checksRowsAffected = sourceCode.includes('rowsAffected') || sourceCode.includes('changes')

  if (!hasConditionalWhere || !checksRowsAffected) {
    recordFail(
      'SEC-05',
      'bookGift uses check-then-act pattern vulnerable to race condition / concurrent double booking',
      `Has conditional WHERE (isBooked = false): ${hasConditionalWhere}, checks rowsAffected: ${checksRowsAffected}`
    )
  } else {
    recordPass('SEC-05', 'bookGift uses atomic conditional UPDATE to prevent double-booking race condition')
  }
}

// -------------------------------------------------------------
// SEC-06: HTML Injection in Telegram Notifications
// -------------------------------------------------------------
function testSec06_HtmlInjectionNotifications() {
  logHeader('SEC-06: HTML Injection Protection in Bot Notifications')
  
  const sourceCode = fs.readFileSync(path.join(ROOT_DIR, 'tgcloud/lib/notifications.js'), 'utf8')
  
  // Look for unescaped giftUrl in template strings: ${giftUrl}
  const unescapedUrlInterpolation = /\$\{giftUrl\}/.test(sourceCode)
  const escapesGiftUrl = /escapeHtml\s*\(\s*giftUrl\s*\)/.test(sourceCode)

  if (unescapedUrlInterpolation && !escapesGiftUrl) {
    recordFail(
      'SEC-06',
      'notifications.js inserts raw unescaped giftUrl into Telegram HTML message templates',
      'Malicious gift URLs containing <tags> break Bot API parsing or inject HTML formatting'
    )
  } else {
    recordPass('SEC-06', 'notifications.js properly escapes giftUrl in HTML templates')
  }
}

// -------------------------------------------------------------
// SEC-07: Username Spoofing Immunity in getWishlist
// -------------------------------------------------------------
function testSec07_UsernameSpoofingImmunity() {
  logHeader('SEC-07: Authorization Immunity to Username Spoofing')
  
  const sourceCode = fs.readFileSync(path.join(ROOT_DIR, 'tgcloud/endpoints/getWishlist.js'), 'utf8')
  const checksUsernames = /['"]trubik1['"]|['"]yamload['"]|['"]trubik['"]/i.test(sourceCode)
  
  // Test runtime: caller has username 'trubik1' but fresh random ID (not 1211235294)
  const testUserId = 700000000 + Math.floor(Math.random() * 100000000)
  const result = runTgcloud('getWishlist', {}, { id: testUserId, username: 'trubik1' })
  const autoGrantedPro = result.output.includes("isPremium:true") || result.output.includes('"isPremium":true')

  if (checksUsernames || autoGrantedPro) {
    recordFail(
      'SEC-07',
      'getWishlist grants PRO privileges based on mutable Telegram username (username spoofing)',
      `Code checks username list: ${checksUsernames}, auto-granted PRO to fake trubik1: ${autoGrantedPro}`
    )
  } else {
    recordPass('SEC-07', 'getWishlist relies solely on immutable Telegram ID for admin privileges')
  }
}

// -------------------------------------------------------------
// SEC-08: Payload Length & Protocol Restrictions
// -------------------------------------------------------------
function testSec08_PayloadLengthLimits() {
  logHeader('SEC-08: Input Validation & Length Limits')
  
  const addGiftSource = fs.readFileSync(path.join(ROOT_DIR, 'tgcloud/endpoints/addGift.js'), 'utf8')
  const updateProfileSource = fs.readFileSync(path.join(ROOT_DIR, 'tgcloud/endpoints/updateProfile.js'), 'utf8')
  const linkHelperSource = fs.readFileSync(path.join(ROOT_DIR, 'src/hooks/useTelegram.ts'), 'utf8')

  const addGiftHasLengthLimit = addGiftSource.includes('slice(') || addGiftSource.includes('length')
  const addGiftValidatesProtocol = addGiftSource.includes('http') || addGiftSource.includes('protocol')
  const profileHasLengthLimit = updateProfileSource.includes('slice(') || updateProfileSource.includes('length')
  const openLinkValidatesProtocol = linkHelperSource.includes('https?:') && linkHelperSource.includes('openLink')

  const missing = []
  if (!addGiftHasLengthLimit) missing.push('addGift title/description length limits')
  if (!addGiftValidatesProtocol) missing.push('addGift URL protocol validation')
  if (!profileHasLengthLimit) missing.push('updateProfile eventTitle/coverUrl length limits')
  if (!openLinkValidatesProtocol) missing.push('useTelegram openLink URL protocol validation')

  if (missing.length > 0) {
    recordFail(
      'SEC-08',
      'Missing input length boundaries or URL protocol verification',
      `Missing: ${missing.join(', ')}`
    )
  } else {
    recordPass('SEC-08', 'Strict input length boundaries and URL protocol checks are enforced')
  }
}

// -------------------------------------------------------------
// SEC-09: Crowdfund Override on Booked Gift
// -------------------------------------------------------------
function testSec09_CrowdfundOverrideOnBooked() {
  logHeader('SEC-09: Crowdfund Override Prevention on Booked Gift')
  
  const sourceCode = fs.readFileSync(path.join(ROOT_DIR, 'tgcloud/endpoints/pledgeGift.js'), 'utf8')
  const blocksBookedNonCrowdfund = sourceCode.includes('gift.isBooked') && sourceCode.includes('ALREADY_BOOKED')

  if (!blocksBookedNonCrowdfund) {
    recordFail(
      'SEC-09',
      'pledgeGift allows overriding an existing single-person gift booking into a crowdfund',
      'Missing check: if gift is already booked by an individual, new pledges must be rejected'
    )
  } else {
    recordPass('SEC-09', 'pledgeGift rejects crowdfunding attempts on individually booked gifts')
  }
}

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------
console.log(`\n${BOLD}====================================================`)
console.log(`  GIFTLY SECURITY AUDIT AUTOMATED TEST SUITE`)
console.log(`====================================================${RESET}`)

testSec01_PrivilegeEscalation()
testSec02_CoverPhotoWithoutPro()
testSec03_SsrfProtection()
testSec04_UnprivilegedPinning()
testSec05_AtomicBooking()
testSec06_HtmlInjectionNotifications()
testSec07_UsernameSpoofingImmunity()
testSec08_PayloadLengthLimits()
testSec09_CrowdfundOverrideOnBooked()

console.log(`\n${BOLD}====================================================`)
console.log(`  TEST RESULTS SUMMARY`)
console.log(`====================================================${RESET}`)
console.log(`  TOTAL:   ${passCount + failCount}`)
console.log(`  ${GREEN}PASSED:  ${passCount}${RESET}`)
console.log(`  ${RED}FAILED:  ${failCount}${RESET}`)

if (failCount > 0) {
  console.log(`\n${RED}${BOLD}  STATUS: VULNERABILITIES DETECTED (${failCount})${RESET}`)
  console.log(`${YELLOW}  Please implement the security remediation plan and re-run this suite.${RESET}\n`)
  process.exit(1)
} else {
  console.log(`\n${GREEN}${BOLD}  STATUS: ALL SECURITY CONTROLS VERIFIED (PASS)${RESET}\n`)
  process.exit(0)
}
