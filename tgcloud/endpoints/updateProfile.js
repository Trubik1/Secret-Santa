import { db, EndpointError } from 'sdk'
import { eq } from 'sdk/db'
import { users } from '../schema.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  // Input boundaries & sanitization
  const rawEventTitle = input?.eventTitle !== undefined ? (input.eventTitle ? input.eventTitle.trim() : '') : null
  const eventTitle = rawEventTitle !== null ? rawEventTitle.slice(0, 100) : null
  const eventDate = input?.eventDate !== undefined ? (input.eventDate ? input.eventDate.trim().slice(0, 50) : null) : null
  const coverUrl = input?.coverUrl !== undefined ? input.coverUrl : null

  if (coverUrl && typeof coverUrl === 'string' && coverUrl.length > 800000) {
    throw new EndpointError('Размер изображения обложки превышает допустимый лимит (800 КБ)', { code: 'PAYLOAD_TOO_LARGE' })
  }

  const existing = await db.select().from(users).where(eq(users.id, caller.id)).get()
  const isUserPremium = Boolean(existing?.isPremium || caller.id === 1211235294)

  // Enforce PRO requirement for custom banner cover
  if (coverUrl && !isUserPremium) {
    throw new EndpointError('Персональная обложка вишлиста доступна только для пользователей Giftly PRO ⭐', { code: 'PREMIUM_REQUIRED' })
  }

  if (!existing) {
    await db.insert(users).values({
      id: caller.id,
      firstName: (caller.first_name || 'Пользователь').slice(0, 100),
      lastName: caller.last_name ? caller.last_name.slice(0, 100) : null,
      username: caller.username ? caller.username.slice(0, 100) : null,
      eventTitle: eventTitle !== null ? eventTitle : '',
      eventDate: eventDate || null,
      coverUrl: coverUrl || null,
      isPremium: caller.id === 1211235294,
    }).run()
  } else {
    const updateData = {}
    if (eventTitle !== null) updateData.eventTitle = eventTitle
    if (input?.eventDate !== undefined) updateData.eventDate = eventDate
    if (input?.coverUrl !== undefined) updateData.coverUrl = coverUrl

    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, caller.id)).run()
    }
  }

  return {
    success: true,
    eventTitle,
    eventDate,
    coverUrl,
    isPremium: isUserPremium,
  }
}
