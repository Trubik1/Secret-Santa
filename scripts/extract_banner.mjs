import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const res = execFileSync(
  'cmd.exe',
  [
    '/c',
    'npx.cmd',
    'tgcloud',
    'run',
    'getWishlist',
    JSON.stringify({ ownerId: 1211235294 }),
    '--ctx',
    JSON.stringify({ initData: { user: { id: 1211235294, first_name: 'Artem', username: 'trubik1' } } }),
  ],
  { encoding: 'utf8', cwd: ROOT_DIR }
)

const match = res.match(/coverUrl:'(data:image\/[^']+)'/)
if (match) {
  const coverUrl = match[1]
  fs.mkdirSync(path.join(ROOT_DIR, 'public/covers'), { recursive: true })
  fs.writeFileSync(path.join(ROOT_DIR, 'public/covers/artem_banner.txt'), coverUrl)
  const base64Data = coverUrl.split(',')[1]
  if (base64Data) {
    fs.writeFileSync(path.join(ROOT_DIR, 'public/covers/artem_banner.webp'), Buffer.from(base64Data, 'base64'))
    console.log('Saved public/covers/artem_banner.webp successfully!')
  }
} else {
  console.error('Could not match coverUrl in output')
}
