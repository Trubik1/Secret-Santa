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

  const existing = await db.select().from(users).where(eq(users.id, caller.id)).get()
  if (!existing) {
    await db.insert(users).values({
      id: caller.id,
      firstName: caller.first_name || 'Пользователь',
      lastName: caller.last_name || null,
      username: caller.username || null,
      eventTitle: eventTitle !== null ? eventTitle : '',
      eventDate: eventDate || null,
    }).run()
  } else {
    await db.update(users).set({
      eventTitle: eventTitle !== null ? eventTitle : '',
      eventDate: input?.eventDate !== undefined ? eventDate : existing.eventDate,
    }).where(eq(users.id, caller.id)).run()
  }

  return {
    success: true,
    eventTitle,
    eventDate,
  }
}
