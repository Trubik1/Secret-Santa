import { db, EndpointError } from 'sdk'
import { eq, and } from 'sdk/db'
import { gifts, giftPledges, giftEventsLog } from '../schema.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  const giftId = input?.id
  if (!giftId) {
    throw new EndpointError('ID подарка не указан', { code: 'MISSING_ID' })
  }

  const existing = await db.select().from(gifts).where(eq(gifts.id, giftId)).get()
  if (!existing) {
    throw new EndpointError('Подарок не найден', { code: 'NOT_FOUND' })
  }

  if (existing.userId !== caller.id) {
    throw new EndpointError('Вы не можете удалить чужой подарок', { code: 'FORBIDDEN' })
  }

  // Record gift event for analytics & completed goals tracking
  const reason = input?.reason || 'just_delete'
  const eventType = (reason === 'gifted' || reason === 'bought_self') ? 'completed' : 'deleted'

  try {
    await db.insert(giftEventsLog).values({
      id: crypto.randomUUID(),
      giftId: existing.id,
      userId: caller.id,
      eventType,
      reason,
      giftTitle: existing.title,
      giftPrice: existing.price || 0,
    }).run()
  } catch (err) {
    console.warn('Failed to log gift event:', err)
  }

  // Delete child records first (since FKs are disabled in SQLite)
  await db.delete(giftPledges).where(eq(giftPledges.giftId, giftId)).run()
  // Delete the gift itself
  await db.delete(gifts).where(and(eq(gifts.id, giftId), eq(gifts.userId, caller.id))).run()

  return {
    success: true,
    reason,
    eventType,
  }
}
