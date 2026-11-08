import { db, EndpointError } from 'sdk'
import { eq, and } from 'sdk/db'
import { gifts, giftPledges } from '../schema.js'

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

  // Delete child records first (since FKs are disabled in SQLite)
  await db.delete(giftPledges).where(eq(giftPledges.giftId, giftId)).run()
  // Delete the gift itself
  await db.delete(gifts).where(and(eq(gifts.id, giftId), eq(gifts.userId, caller.id))).run()

  return {
    success: true,
  }
}
