import { chromium } from 'playwright'
import { preview } from 'vite'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const OUTPUT_DIR = 'C:\\Users\\artem\\Desktop\\Giftly_Media'
const TEMP_VIDEO_DIR = path.join(ROOT_DIR, 'temp_video')
const FFMPEG_PATH = 'C:/Users/artem/.gemini/antigravity/bin/ffmpeg.exe'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}
if (!fs.existsSync(TEMP_VIDEO_DIR)) {
  fs.mkdirSync(TEMP_VIDEO_DIR, { recursive: true })
}

async function run() {
  console.log('1. Starting local Vite preview server...')
  const previewServer = await preview({ preview: { port: 4180 } })
  const port = previewServer.httpServer.address().port
  const baseUrl = `http://localhost:${port}`
  console.log(`   Vite preview running at ${baseUrl}`)

  console.log('2. Launching Playwright with Chrome...')
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 412, height: 880 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: TEMP_VIDEO_DIR,
      size: { width: 412, height: 880 },
    },
  })

  // Pre-seed localStorage and mock Telegram WebApp
  await context.addInitScript(() => {
    try {
      localStorage.clear()
      localStorage.setItem('wishlist_curr', 'usd')
      localStorage.setItem('wishlist_color_scheme', 'dark')
      document.documentElement.classList.add('dark')
    } catch (_) {}

    window.Telegram = {
      WebApp: {
        initData: 'query_id=test&user=%7B%22id%22%3A1211235294%2C%22first_name%22%3A%22Artem%22%2C%22username%22%3A%22Trubik1%22%7D',
        initDataUnsafe: {
          user: {
            id: 1211235294,
            first_name: 'Artem',
            last_name: '',
            username: 'Trubik1',
            is_premium: true,
          },
        },
        ready: () => {},
        expand: () => {},
        requestFullscreen: () => {},
        exitFullscreen: () => {},
        isFullscreen: false,
        HapticFeedback: {
          impactOccurred: () => {},
          notificationOccurred: () => {},
          selectionChanged: () => {},
        },
        openLink: (url) => console.log('Mock openLink:', url),
        openTelegramLink: (url) => console.log('Mock openTelegramLink:', url),
        Serverless: null,
      },
    }
  })

  const page = await context.newPage()
  console.log('3. Navigating to Giftly WebApp...')
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)

  // -------------------------------------------------------------
  // Screenshot 1: Main Wishlist Screen
  // -------------------------------------------------------------
  console.log('4. Capturing 01_Главный_экран_вишлиста.png...')
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '01_Главный_экран_вишлиста.png'),
    fullPage: false,
  })

  // Smooth scroll down to show gifts grid
  console.log('   Scrolling wishlist feed...')
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }))
  await page.waitForTimeout(1200)

  // Smooth scroll back up
  await page.evaluate(() => window.scrollBy({ top: -380, behavior: 'smooth' }))
  await page.waitForTimeout(1000)

  // -------------------------------------------------------------
  // Screenshot 2: Gift Detail Modal
  // -------------------------------------------------------------
  console.log('5. Opening gift details & capturing 02_Карточка_подарка_детали.png...')
  const iphoneCard = page.locator('h3:has-text("iPhone")').first()
  await iphoneCard.waitFor({ state: 'visible', timeout: 5000 })
  await iphoneCard.click()
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '02_Карточка_подарка_детали.png'),
    fullPage: false,
  })
  await page.waitForTimeout(1000)

  // Close gift detail
  await page.keyboard.press('Escape')
  await page.mouse.click(20, 20)
  await page.waitForTimeout(800)

  // -------------------------------------------------------------
  // Screenshot 3: Add Gift Modal
  // -------------------------------------------------------------
  console.log('6. Opening Add Gift Modal & capturing 03_Создание_желания_модалка.png...')
  const addBtn = page.locator('button:has-text("Добавить желание")')
  await addBtn.click()
  await page.waitForTimeout(900)
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '03_Создание_желания_модалка.png'),
    fullPage: false,
  })

  // -------------------------------------------------------------
  // Screenshot 4: Pink-Deer-76 Loader Animation
  // -------------------------------------------------------------
  console.log('7. Triggering Pink-Deer-76 loader animation & capturing 04_Анимация_загрузки_товара.png...')
  const urlInput = page.locator('form input[placeholder*="wildberries"]')
  await urlInput.fill('https://catalog.onliner.by/mobile/apple/iphone17256bk')
  await page.waitForTimeout(500)

  // Click the search button strictly inside the modal form
  const searchBtn = page.locator('.fixed button[type="button"]:has-text("Найти")')
  await searchBtn.click()

  // Wait 400ms for loader to be spinning mid-flight and capture
  await page.waitForTimeout(400)
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '04_Анимация_загрузки_товара.png'),
    fullPage: false,
  })
  // Wait for parsing + minimum delay to complete gracefully
  await page.waitForTimeout(1800)
  // Let loader spin gracefully on video for 2 seconds
  await page.waitForTimeout(2200)

  // Check if title or price was already auto-parsed
  console.log('   Checking parsed fields (Title, Price, Dream Priority)...')
  const titleInput = page.locator('form input[placeholder*="Наушники"]')
  const currentTitle = await titleInput.inputValue().catch(() => '')
  if (!currentTitle) {
    await titleInput.fill('Apple iPhone 17 Pro 256GB Desert Titanium')
  }

  const descInput = page.locator('form textarea')
  if (await descInput.isVisible()) {
    await descInput.fill('Цвет Desert Titanium, память 256 ГБ. Очень жду на праздник! ✨')
  }

  // Select "Мечта ✨" priority
  const dreamBtn = page.locator('.fixed button:has-text("Мечта")')
  if (await dreamBtn.isVisible()) {
    await dreamBtn.click()
  }
  await page.waitForTimeout(1000)

  // Submit and save new gift
  console.log('   Saving wish and triggering confetti celebration...')
  const submitBtn = page.locator('.fixed button[type="submit"]')
  await submitBtn.click()
  // Confetti explosion duration
  await page.waitForTimeout(2500)

  // -------------------------------------------------------------
  // Screenshot 5: Share Modal
  // -------------------------------------------------------------
  console.log('8. Opening Share Modal & capturing 05_Поделиться_вишлистом.png...')
  const shareBtn = page.locator('button[title*="Поделиться"]')
  if (await shareBtn.isVisible()) {
    await shareBtn.click()
    await page.waitForTimeout(900)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05_Поделиться_вишлистом.png'),
      fullPage: false,
    })
    await page.waitForTimeout(1500)

    const closeShare = page.locator('.fixed button:has(svg.lucide-x)').first()
    if (await closeShare.isVisible()) {
      await closeShare.click()
    }
    await page.waitForTimeout(700)
  }

  // -------------------------------------------------------------
  // Screenshot 6: Profile & Wishlist Customization
  // -------------------------------------------------------------
  console.log('9. Opening Customization Modal & capturing 06_Оформление_и_кастомизация.png...')
  const customizeBtn = page.locator('button[title*="Оформление"]')
  if (await customizeBtn.isVisible()) {
    await customizeBtn.click()
    await page.waitForTimeout(900)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '06_Оформление_и_кастомизация.png'),
      fullPage: false,
    })
    await page.waitForTimeout(1500)

    const closeCustom = page.locator('.fixed button:has(svg.lucide-x)').first()
    if (await closeCustom.isVisible()) {
      await closeCustom.click()
    }
    await page.waitForTimeout(700)
  }

  console.log('10. Closing browser and finalizing video recording...')
  const videoObj = page.video()
  await page.close()
  await context.close()
  await browser.close()
  previewServer.httpServer.close()

  if (videoObj) {
    const rawVideoPath = await videoObj.path()
    console.log(`    Raw WebM video captured: ${rawVideoPath}`)

    const targetMp4 = path.join(OUTPUT_DIR, 'демонстрация_создания_желания.mp4')
    const targetGif = path.join(OUTPUT_DIR, 'демонстрация_создания_желания.gif')

    console.log('11. Transcoding video with FFmpeg to MP4 (H.264 60fps)...')
    execFileSync(FFMPEG_PATH, [
      '-y',
      '-i', rawVideoPath,
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      targetMp4,
    ], { stdio: 'inherit' })
    console.log(`    ✔ Saved MP4: ${targetMp4}`)

    console.log('12. Generating animated GIF preview...')
    execFileSync(FFMPEG_PATH, [
      '-y',
      '-i', targetMp4,
      '-vf', 'fps=15,scale=360:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
      targetGif,
    ], { stdio: 'inherit' })
    console.log(`    ✔ Saved GIF: ${targetGif}`)

    // Cleanup raw webm
    try {
      fs.unlinkSync(rawVideoPath)
      fs.rmdirSync(TEMP_VIDEO_DIR, { recursive: true })
    } catch (_) {}
  }

  console.log('\n🎉 ALL MEDIA GENERATED SUCCESSFULLY IN:', OUTPUT_DIR)
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
