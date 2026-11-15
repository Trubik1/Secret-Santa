import { api, db } from 'sdk'
import { eq } from 'sdk/db'
import { users } from '../schema.js'

export default async function (message, ctx) {
  const chatId = message.chat?.id
  const fromUser = message.from
  const text = (message.text || '').trim()

  if (!chatId || !fromUser) return

  const botId = 9186420547
  const botUsername = 'giftly_me_bot'
  const appBaseUrl = `https://app${botId}.tgcloud.ai/`

  // Register or update user in DB
  try {
    const existing = await db.select().from(users).where(eq(users.id, fromUser.id)).get()
    if (!existing) {
      await db.insert(users).values({
        id: fromUser.id,
        firstName: fromUser.first_name || 'Друг',
        lastName: fromUser.last_name || null,
        username: fromUser.username || null,
        photoUrl: null,
        eventTitle: '',
        eventDate: null,
      }).run()
    } else {
      await db.update(users).set({
        firstName: fromUser.first_name || existing.firstName,
        lastName: fromUser.last_name || existing.lastName,
        username: fromUser.username || existing.username,
      }).where(eq(users.id, fromUser.id)).run()
    }
  } catch (err) {
    console.error('Failed to sync user on message:', err)
  }

  // Handle successful Telegram Stars payment
  if (message.successful_payment) {
    const sp = message.successful_payment
    let payload = {}
    try {
      payload = JSON.parse(sp.invoice_payload)
    } catch (_) {}

    const stars = sp.total_amount

    // Grant Giftly Premium
    if (payload.type === 'premium' || payload.type === 'premium_upgrade') {
      try {
        await db.update(users).set({ isPremium: true }).where(eq(users.id, fromUser.id)).run()
      } catch (err) {
        console.error('Failed to grant premium:', err)
      }

      await api.sendMessage({
        chat_id: chatId,
        text: `⭐️ <b>Поздравляем с активацией Giftly Premium!</b>\n\n` +
              `Тебе теперь доступны:\n` +
              `• <b>Безлимитное добавление желаний</b>\n` +
              `• <b>Кастомная обложка профиля</b> (загрузка своего фото)\n` +
              `• Премиум-бейдж ⭐️\n\n` +
              `Открой свой вишлист и настрой персональный стиль!`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎁 Открыть вишлист',
                web_app: { url: appBaseUrl }
              }
            ]
          ]
        }
      })
      return
    }

    await api.sendMessage({
      chat_id: chatId,
      text: `⭐️ <b>Оплата Telegram Stars успешно получена!</b>\n\n` +
            `Спасибо за взнос <b>${stars} ⭐</b>!`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎁 Открыть вишлист',
              web_app: { url: appBaseUrl }
            }
          ]
        ]
      }
    })
    return
  }

  // Handle /start commands
  if (text.startsWith('/start')) {
    const parts = text.split(' ')
    const startParam = parts[1] || ''

    // 1. Friend opened wishlist via link: /start wish_123
    if (startParam.startsWith('wish_')) {
      const targetUserId = parseInt(startParam.replace('wish_', ''), 10)
      if (targetUserId) {
        let ownerName = 'друга'
        try {
          const owner = await db.select().from(users).where(eq(users.id, targetUserId)).get()
          if (owner && owner.firstName) {
            ownerName = owner.firstName
          }
        } catch (_) {}

        await api.sendMessage({
          chat_id: chatId,
          text: `🎁 Вишлист <b>${ownerName}</b> ✨\n\nВыбирай, что подарить, бронируй подарок в один клик или скидывайся вместе с друзьями!`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🎁 Открыть вишлист',
                  web_app: {
                    url: `${appBaseUrl}?start_param=wish_${targetUserId}`,
                  },
                }
              ]
            ]
          }
        })
        return
      }
    }

    // 2. Owner opened bot: /start
    // Set persistent bottom-left chat menu button
    try {
      await api.setChatMenuButton({
        chat_id: chatId,
        menu_button: {
          type: 'web_app',
          text: '🎁 Вишлист',
          web_app: {
            url: appBaseUrl,
          },
        },
      })
    } catch (_) {}

    await api.sendMessage({
      chat_id: chatId,
      text: `<b>Привет!</b> 🎁 Добро пожаловать в <b>Giftly</b> — твой персональный вишлист.\n\n` +
            `Здесь ты можешь:\n` +
            `• Сохранять подарки по ссылкам с <b>Wildberries</b>, <b>Ozon</b>, <b>Onlíner</b>, <b>AliExpress</b> и других магазинов\n` +
            `• Делиться списком с друзьями, чтобы получать только желанные подарки\n` +
            `• Бронировать подарки друзей в один клик и скидываться вместе\n\n` +
            `Нажми кнопку ниже, чтобы открыть вишлист ✨`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎁 Открыть вишлист',
              web_app: {
                url: appBaseUrl,
              },
            }
          ]
        ]
      }
    })
    return
  }

  // Handle /help or any other text
  await api.sendMessage({
    chat_id: chatId,
    text: `<b>Giftly</b> — сервис персональных списков желаний 🎁\n\n` +
          `Нажми кнопку ниже, чтобы открыть вишлист:`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎁 Открыть вишлист',
            web_app: {
              url: appBaseUrl,
            },
          }
        ]
      ]
    }
  })
}
