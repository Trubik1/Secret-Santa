const https = require('https');
const fs = require('fs');
const path = require('path');

const token = '9186420547:AAFEJvbva7f8ZVDUTv3GOu3NHOy0IInE8Og';
const chatId = '1211235294';
const brain = 'C:\\Users\\artem\\.gemini\\antigravity\\brain\\4a4e23ea-fbc3-4d7a-9541-66157cad8cd9';

function sendPhoto(filePath, caption) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).slice(2);
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const pre = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="photo"; filename="${fileName}"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n`
    );

    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    const totalLength = pre.length + fileData.length + post.length;

    const req = https.request(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': totalLength
      }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(b));
        } catch (_) {
          resolve(b);
        }
      });
    });

    req.on('error', reject);
    req.write(pre);
    req.write(fileData);
    req.write(post);
    req.end();
  });
}

async function run() {
  console.log('Sending Mascot v4 (OLED Vibrant)...');
  const r4 = await sendPhoto(path.join(brain, 'mascot_v4_oled_vibrant.jpg'), '🦊 Вариант 4 (OLED Контраст) — сохрани фото и отправь в @BotFather через команду /setuserpic');
  console.log('Result 4:', r4.ok);

  console.log('Sending Mascot v2 (Closeup)...');
  const r2 = await sendPhoto(path.join(brain, 'mascot_v2_closeup.jpg'), '🦊 Вариант 2 (Крупный план мордочки)');
  console.log('Result 2:', r2.ok);

  console.log('Sending Mascot v1 (Classic)...');
  const r1 = await sendPhoto(path.join(brain, 'mascot_v1_classic.jpg'), '🦊 Вариант 1 (Во весь рост)');
  console.log('Result 1:', r1.ok);
}

run().catch(console.error);
