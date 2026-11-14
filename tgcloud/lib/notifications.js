import { api, BotApiError } from 'sdk'

/**
 * Sends a message safely without failing the calling endpoint if the user hasn't started the bot or blocked it.
 */
export async function sendSafeMessage(chatId, text, extra = {}) {
  if (!chatId) return null
  try {
    return await api.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...extra,
    })
  } catch (err) {
    if (err instanceof BotApiError) {
      console.warn(`[Notification] Failed to send message to ${chatId}: code=${err.code} desc=${err.description}`)
    } else {
      console.warn(`[Notification] Unexpected error sending message to ${chatId}:`, err)
    }
    return null
  }
}

/**
 * Notify owner and guest about a booked gift.
 */
export async function notifyGiftBooked({ ownerId, bookerId, giftTitle, giftPrice, giftUrl, eventDate }) {
  // 1. Notify owner (keeps secret what gift was booked!)
  if (ownerId && ownerId !== bookerId) {
    await sendSafeMessage(
      ownerId,
      '🎉 <b>Ура!</b> Кто-то из друзей только что забронировал подарок из твоего вишлиста! 🎁\n\n' +
      '<i>Какой именно — останется тайной до твоего праздника!</i>'
    )
  }

  // 2. Notify guest with details and reminder
  if (bookerId) {
    const priceStr = giftPrice > 0 ? ` за <b>${giftPrice.toLocaleString('ru-RU')} ₽</b>` : ''
    const linkStr = giftUrl ? `\n🔗 <b>Ссылка на покупку:</b> ${giftUrl}` : ''
    const dateStr = eventDate ? `\n📅 <b>Дата праздника:</b> ${eventDate}` : ''

    await sendSafeMessage(
      bookerId,
      `🎁 <b>Ты забронировал подарок!</b>\n\n` +
      `<b>${escapeHtml(giftTitle)}</b>${priceStr}` +
      linkStr +
      dateStr +
      `\n\n<i>Другие гости больше не смогут его выбрать. Спасибо, что радуешь виновника торжества!</i>`
    )
  }
}

/**
 * Notify all crowdfunding participants about a new pledge.
 */
export async function notifyCrowdfundPledge({ giftTitle, pledgerName, pledgerUsername, amount, targetAmount, currentTotal, existingPledgers = [] }) {
  const usernameTag = pledgerUsername ? `@${pledgerUsername}` : `<b>${escapeHtml(pledgerName)}</b>`
  const progressText = targetAmount > 0
    ? `\n📊 Прогресс: <b>${currentTotal.toLocaleString('ru-RU')} / ${targetAmount.toLocaleString('ru-RU')} ₽</b>`
    : ''

  const messageText =
    `🤝 ${usernameTag} присоединился к сбору на <b>${escapeHtml(giftTitle)}</b> с долей <b>${amount.toLocaleString('ru-RU')} ₽</b>!${progressText}\n\n` +
    `💡 <i>Вы можете списаться в Telegram для координации перевода средств без посредников.</i>`

  // Send to existing pledgers (avoid duplicates)
  const contactedUsers = new Set()
  for (const p of existingPledgers) {
    if (p.userId && !contactedUsers.has(p.userId)) {
      contactedUsers.add(p.userId)
      await sendSafeMessage(p.userId, messageText)
    }
  }
}

/**
 * Notify all crowdfunding participants when the goal (100%) is achieved.
 */
export async function notifyCrowdfundCompleted({ giftTitle, giftPrice: _giftPrice, giftUrl, ownerName, participants = [] }) {
  const linkStr = giftUrl ? `\n🔗 <b>Ссылка на покупку:</b> ${giftUrl}` : ''
  const targetUserStr = ownerName ? ` для <b>${escapeHtml(ownerName)}</b>` : ''

  const messageText =
    `🎉 <b>Сбор успешно завершён!</b>\n\n` +
    `Сумма на подарок <b>«${escapeHtml(giftTitle)}»</b>${targetUserStr} собрана на 100%!\n\n` +
    `🚀 <b>Пора заказывать подарок!</b>${linkStr}`

  const extra = giftUrl ? {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🛍 Купить в магазине', url: giftUrl }
        ]
      ]
    }
  } : {}

  const contacted = new Set()
  for (const p of participants) {
    if (p.userId && !contacted.has(p.userId)) {
      contacted.add(p.userId)
      await sendSafeMessage(p.userId, messageText, extra)
    }
  }
}

function escapeHtml(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
