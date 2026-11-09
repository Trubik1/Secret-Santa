import { api, db } from 'sdk'
import { eq } from 'sdk/db'
import { users } from '../schema.js'

export default async function (message, ctx) {
  const chatId = message.chat?.id
  const fromUser = message.from
  const text = message.text || ''

  if (!chatId || !fromUser) return

  const botMe = await api.getMe()
  const botId = botMe.id
  const botUsername = botMe.username
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
        eventTitle: 'Мой День Рождения 🎂',
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
    console.error('Failed to sync user on /start:', err)
  }

  // Handle /start commands
  if (text.startsWith('/start')) {
    const parts = text.split(' ')
    const startParam = parts[1] || ''

    if (startParam.startsWith('wish_')) {
      const targetUserId = parseInt(startParam.replace('wish_', ''), 10)
      if (targetUserId) {
        let ownerName = 'друга'
        try {
          const owner = await db.select().from(users).where(eq(users.id, targetUserId)).get()
          if (owner) {
            ownerName = owner.firstName
          }
        } catch (_) {}

        await api.sendMessage({
          chat_id: chatId,
          text: `🎁 <b>Вишлист ${ownerName}</b>\n\n` +
                `Открой приложение, чтобы посмотреть список подарков, забронировать понравившийся или скинуться вместе с друзьями!`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `✨ Открыть вишлист ${ownerName}`,
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

    // Default /start for owner
    const shareLink = `https://t.me/${botUsername}?start=wish_${fromUser.id}`
    const rawName = (fromUser.first_name || '').trim()
    const displayName = (rawName && rawName !== '•' && rawName !== '.')
      ? rawName
      : (fromUser.username ? `@${fromUser.username}` : 'Друг')

    // Ensure persistent menu button is set for this chat
    try {
      await api.setChatMenuButton({
        chat_id: chatId,
        menu_button: {
          type: 'web_app',
          text: 'Вишлист 🎁',
          web_app: {
            url: appBaseUrl,
          },
        },
      })
    } catch (_) {}

    await api.sendMessage({
      chat_id: chatId,
      text: `👋 Привет, <b>${displayName}</b>!\n\n` +
            `Добро пожаловать в <b>Wishlist</b> — твой персональный список желаний с режимом сюрприза и возможностью скидываться на подарки!\n\n` +
            `🔗 <b>Твоя персональная ссылка для друзей:</b>\n<code>${shareLink}</code>\n\n` +
            `Нажми кнопку ниже, чтобы открыть вишлист и добавить первые подарки:`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎁 Мой вишлист',
              web_app: {
                url: appBaseUrl,
              },
            }
          ],
          [
            {
              text: '📤 Поделиться ссылкой',
              url: `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent('Привет! Вот мой список желаний на грядущий праздник 🎂')}`,
            }
          ]
        ]
      }
    })
    return
  }

  // Fallback info for other messages
  await api.sendMessage({
    chat_id: chatId,
    text: `Чтобы открыть свои желания или настроить праздник, нажми кнопку ниже:`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '✨ Открыть Wishlist',
            web_app: {
              url: appBaseUrl,
            },
          }
        ]
      ]
    }
  })
}
