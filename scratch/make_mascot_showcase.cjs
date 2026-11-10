const fs = require('fs');
const path = require('path');

const brain = 'C:\\Users\\artem\\.gemini\\antigravity\\brain\\4a4e23ea-fbc3-4d7a-9541-66157cad8cd9';
const m1 = fs.readFileSync(path.join(brain, 'mascot_v1_classic.jpg')).toString('base64');
const m2 = fs.readFileSync(path.join(brain, 'mascot_v2_closeup.jpg')).toString('base64');
const m3 = fs.readFileSync(path.join(brain, 'mascot_v3_neon_ring.jpg')).toString('base64');
const m4 = fs.readFileSync(path.join(brain, 'mascot_v4_oled_vibrant.jpg')).toString('base64');
const m5 = fs.readFileSync(path.join(brain, 'mascot_v5_eyes_focus.jpg')).toString('base64');

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>5 Вариантов Маскота для @giftly_me_bot</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 30px 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    h1 {
      font-size: 24px;
      font-weight: 900;
      color: #fff;
      text-align: center;
      margin-bottom: 6px;
    }
    .sub {
      font-size: 13px;
      color: #a1a1aa;
      text-align: center;
      margin-bottom: 25px;
      max-width: 600px;
      line-height: 1.4;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(196, 69, 123, 0.15);
      color: #e26197;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid rgba(196, 69, 123, 0.3);
      margin-bottom: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      max-width: 1100px;
      width: 100%;
    }
    .card {
      background: #17171a;
      border: 1px solid #34252f;
      border-radius: 28px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: #c4457b;
    }
    /* Telegram Round Avatar Circle */
    .img-wrap {
      width: 200px;
      height: 200px;
      border-radius: 9999px;
      overflow: hidden;
      border: 3px solid rgba(196, 69, 123, 0.6);
      box-shadow: 0 8px 28px rgba(196, 69, 123, 0.35);
      margin-bottom: 15px;
      background: #0d0d0f;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .card-num {
      font-size: 10px;
      font-weight: 900;
      color: #c4457b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .card-title {
      font-size: 15px;
      font-weight: 900;
      color: #fff;
      margin-bottom: 6px;
    }
    .card-desc {
      font-size: 11px;
      color: #a1a1aa;
      line-height: 1.4;
      margin-bottom: 14px;
      min-height: 32px;
    }
    .btn {
      background: #241920;
      border: 1px solid rgba(196, 69, 123, 0.5);
      color: #e26197;
      font-size: 11px;
      font-weight: 800;
      padding: 8px 18px;
      border-radius: 9999px;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn:hover {
      background: #c4457b;
      color: #fff;
    }
    .tg-banner {
      width: 100%;
      max-width: 1100px;
      background: #121215;
      border: 1px solid #27272a;
      border-radius: 20px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>

  <span class="badge">Серия Маскота (Arctic Fox Mascot)</span>
  <h1>5 Вариантов Маскота для @giftly_me_bot 🦊</h1>
  <p class="sub">
    Все варианты созданы на основе понравившегося пушистого песца с подарком. Посмотрите, как разные ракурсы и эффекты выглядят в круглом профиле Telegram:
  </p>

  <div class="tg-banner">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 16px;">🦊</span>
      <div>
        <div style="font-size: 13px; font-weight: 900; color: #fff;">@giftly_me_bot</div>
        <div style="font-size: 11px; color: #71717a;">Выбирайте идеальный ракурс и контраст для аватарки</div>
      </div>
    </div>
    <div style="font-size: 11px; font-weight: 800; color: #34d399; background: rgba(52,211,153,0.1); padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(52,211,153,0.2);">
      Выбор маскота ✓
    </div>
  </div>

  <div class="grid">

    <!-- Card 1: Classic Full -->
    <div class="card">
      <div class="img-wrap">
        <img src="data:image/jpeg;base64,${m1}" alt="Вариант 1">
      </div>
      <div class="card-num">Вариант 1</div>
      <div class="card-title">Классический во весь рост</div>
      <div class="card-desc">Оригинальный рендер: фигурка целиком сидит на студийном фоне и держит подарок обеими лапками.</div>
      <a href="data:image/jpeg;base64,${m1}" download="giftly_mascot_classic.jpg" class="btn">Скачать для бота</a>
    </div>

    <!-- Card 2: Close-up Face Focus -->
    <div class="card" style="border-color: rgba(196, 69, 123, 0.8); box-shadow: 0 0 25px rgba(196,69,123,0.25);">
      <div class="img-wrap" style="box-shadow: 0 0 25px rgba(196,69,123,0.5);">
        <img src="data:image/jpeg;base64,${m2}" alt="Вариант 2">
      </div>
      <div class="card-num" style="color: #ff7eb3;">Вариант 2 (Рекомендуемый для аватарок)</div>
      <div class="card-title">Крупный план (Close-Up Focus)</div>
      <div class="card-desc">Фокус на милой мордочке, огромных сияющих глазах и светящемся банте. Идеально различим в маленьких кружочках чатов Telegram!</div>
      <a href="data:image/jpeg;base64,${m2}" download="giftly_mascot_closeup.jpg" class="btn" style="background: #c4457b; color: #fff;">Скачать для бота</a>
    </div>

    <!-- Card 3: Neon Halo Ring -->
    <div class="card">
      <div class="img-wrap">
        <img src="data:image/jpeg;base64,${m3}" alt="Вариант 3">
      </div>
      <div class="card-num">Вариант 3</div>
      <div class="card-title">Неоновый нимб & Искорки</div>
      <div class="card-desc">Фирменное неоновое свечение по кругу в благородном цвете #c4457b и звёздные искры вокруг маскота.</div>
      <a href="data:image/jpeg;base64,${m3}" download="giftly_mascot_neon_ring.jpg" class="btn">Скачать для бота</a>
    </div>

    <!-- Card 4: OLED Vibrant Boost -->
    <div class="card">
      <div class="img-wrap">
        <img src="data:image/jpeg;base64,${m4}" alt="Вариант 4">
      </div>
      <div class="card-num">Вариант 4</div>
      <div class="card-title">OLED Глубокий Контраст</div>
      <div class="card-desc">Идеальный глубокий чёрный фон, сочный розовый контурный свет на шёрстке и более яркое тёплое сияние коробки.</div>
      <a href="data:image/jpeg;base64,${m4}" download="giftly_mascot_oled_vibrant.jpg" class="btn">Скачать для бота</a>
    </div>

    <!-- Card 5: Expressive Eyes Zoom -->
    <div class="card">
      <div class="img-wrap">
        <img src="data:image/jpeg;base64,${m5}" alt="Вариант 5">
      </div>
      <div class="card-num">Вариант 5</div>
      <div class="card-title">Супер-зум на эмоцию</div>
      <div class="card-desc">Максимальный акцент на доброжелательный взгляд, улыбку и пушистые щёчки. Самый милый портретный ракурс.</div>
      <a href="data:image/jpeg;base64,${m5}" download="giftly_mascot_eyes_focus.jpg" class="btn">Скачать для бота</a>
    </div>

  </div>

</body>
</html>
`;

fs.writeFileSync(path.join(brain, 'mascot_showcase.html'), html);
console.log('Successfully written mascot_showcase.html!');
