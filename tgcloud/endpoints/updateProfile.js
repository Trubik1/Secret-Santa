import { db, EndpointError } from 'sdk'
import { eq } from 'sdk/db'
import { users } from '../schema.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  const eventTitle = input?.eventTitle !== undefined ? input.eventTitle.trim() : null
  const eventDate = input?.eventDate !== undefined ? input.eventDate.trim() : null

  const existing = await db.select().from(users).where(eq(users.id, caller.id)).get()
  if (!existing) {
    await db.insert(users).values({
      id: caller.id,
      firstName: caller.first_name || 'Пользователь',
      lastName: caller.last_name || null,
      username: caller.username || null,
      eventTitle: eventTitle || 'Мой День Рождения 🎂',
      eventDate: eventDate || null,
    }).run()
  } else {
    await db.update(users).set({
      eventTitle: eventTitle !== null ? eventTitle : existing.eventTitle,
      eventDate: eventDate !== null ? eventDate : existing.eventDate,
    }).where(eq(users.id, caller.id)).run()
  }

  return {
    success: true,
    eventTitle,
    eventDate,
  }
}
