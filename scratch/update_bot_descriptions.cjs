const https = require('https');

const TOKEN = '9186420547:AAFEJvbva7f8ZVDUTv3GOu3NHOy0IInE8Og';

function callApi(method, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = https.request(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function update() {
  console.log('1. Setting Name...');
  await callApi('setMyName', { name: 'Wishlist 🎁' });

  console.log('2. Setting Short Description (Bio in bot profile)...');
  await callApi('setMyShortDescription', {
    short_description: 'Твой список желаний. Добавляй подарки с Wildberries & Ozon и делись с друзьями 🎁'
  });

  console.log('3. Setting Full Description (Pre-start screen)...');
  await callApi('setMyDescription', {
    description: `Твой вишлист прямо в Telegram.

• Добавляй товары по ссылкам с WB и Ozon
• Отправляй ссылку друзьям — без неловких намеков
• Друзья бронируют подарки в один клик
• Скидывайтесь компанией на большую мечту
• Удобный Тайный Санта для компании и чата`
  });

  console.log('4. Setting Commands...');
  await callApi('setMyCommands', {
    commands: [
      { command: 'start', description: 'Открыть вишлист 🎁' },
      { command: 'santa', description: 'Тайный Санта 🎅' }
    ]
  });

  console.log('Updated all bot descriptions successfully!');
}

update().catch(console.error);
