import { api, db } from 'sdk'
import { eq } from 'sdk/db'
import { users } from '../schema.js'

export default async function (message, ctx) {
  const chatId = message.chat?.id
  const fromUser = message.from
  const text = (message.text || '').trim()

  if (!chatId || !fromUser) return

  const botMe = await api.getMe()
  const botId = botMe.id
  const botUsername = botMe.username || 'giftly_me_bot'
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
          text: `Вишлист <b>${ownerName}</b> 🎁\n\n` +
                `Выбирай, что подарить, бронируй подарок в один клик или скидывайся вместе с компанией друзей.`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `✨ Открыть список ${ownerName}`,
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
    const shareLink = `https://t.me/${botUsername}?start=wish_${fromUser.id}`
    const rawName = (fromUser.first_name || '').trim()
    const displayName = (rawName && rawName !== '•' && rawName !== '.')
      ? rawName
      : (fromUser.username ? `@${fromUser.username}` : 'друг')

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
      text: `Привет, <b>${displayName}</b>!\n\n` +
            `Здесь твой персональный вишлист. Добавляй товары прямо по ссылкам с Wildberries или Ozon, а друзья смогут их бронировать или скидываться.\n\n` +
            `🔗 Твоя ссылка для друзей:\n<code>${shareLink}</code>`,
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
          ],
          [
            {
              text: '📤 Отправить друзьям',
              url: `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`Мой вишлист 🎁 ➔ ${shareLink}`)}`,
            }
          ]
        ]
      }
    })
    return
  }

  // Handle /help or any other text
  const shareLink = `https://t.me/${botUsername}?start=wish_${fromUser.id}`
  await api.sendMessage({
    chat_id: chatId,
    text: `Нажми кнопку ниже, чтобы открыть свой вишлист, добавить подарки или посмотреть списки друзей 👇`,
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
