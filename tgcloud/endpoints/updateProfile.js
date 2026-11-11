import { db, EndpointError } from 'sdk'
import { eq } from 'sdk/db'
import { users } from '../schema.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  const eventTitle = input?.eventTitle !== undefined ? (input.eventTitle ? input.eventTitle.trim() : '') : null
  const eventDate = input?.eventDate !== undefined ? (input.eventDate ? input.eventDate.trim() : null) : null
  const coverUrl = input?.coverUrl !== undefined ? input.coverUrl : null
  const isPremium = input?.isPremium !== undefined ? Boolean(input.isPremium) : null

  const existing = await db.select().from(users).where(eq(users.id, caller.id)).get()
  if (!existing) {
    await db.insert(users).values({
      id: caller.id,
      firstName: caller.first_name || 'Пользователь',
      lastName: caller.last_name || null,
      username: caller.username || null,
      eventTitle: eventTitle !== null ? eventTitle : '',
      eventDate: eventDate || null,
      coverUrl: coverUrl || null,
      isPremium: isPremium !== null ? isPremium : false,
    }).run()
  } else {
    const updateData = {}
    if (eventTitle !== null) updateData.eventTitle = eventTitle
    if (input?.eventDate !== undefined) updateData.eventDate = eventDate
    if (input?.coverUrl !== undefined) updateData.coverUrl = coverUrl
    if (isPremium !== null) updateData.isPremium = isPremium

    await db.update(users).set(updateData).where(eq(users.id, caller.id)).run()
  }

  return {
    success: true,
    eventTitle,
    eventDate,
    coverUrl,
    isPremium,
  }
}
