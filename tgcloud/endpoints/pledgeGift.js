import { db, EndpointError } from 'sdk'
import { eq, and } from 'sdk/db'
import { gifts, giftPledges } from '../schema.js'
import { notifyCrowdfundPledge } from '../lib/notifications.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  const giftId = input?.giftId
  const pledgeAmount = parseInt(input?.amount, 10)

  if (!giftId) {
    throw new EndpointError('ID подарка не указан', { code: 'MISSING_ID' })
  }

  if (isNaN(pledgeAmount) || pledgeAmount <= 0) {
    throw new EndpointError('Сумма взноса должна быть больше нуля', { code: 'INVALID_AMOUNT' })
  }

  const gift = await db.select().from(gifts).where(eq(gifts.id, giftId)).get()
  if (!gift) {
    throw new EndpointError('Подарок не найден', { code: 'NOT_FOUND' })
  }

  if (!gift.isCrowdfund) {
    throw new EndpointError('Для этого подарка не включен совместный сбор', { code: 'NOT_CROWDFUND' })
  }

  if (gift.userId === caller.id) {
    throw new EndpointError('Вы не можете скидываться на собственный подарок', { code: 'CANNOT_PLEDGE_OWN' })
  }

  const callerName = [caller.first_name, caller.last_name].filter(Boolean).join(' ') || 'Друг'
  const callerUsername = caller.username || null

  // Fetch existing pledges for this gift
  const existingPledges = await db.select().from(giftPledges).where(eq(giftPledges.giftId, giftId)).all()
  const myExistingPledge = existingPledges.find(p => p.userId === caller.id)

  if (myExistingPledge) {
    // Update existing pledge amount
    await db.update(giftPledges).set({
      amount: pledgeAmount,
      userName: callerName,
      userUsername: callerUsername,
    }).where(eq(giftPledges.id, myExistingPledge.id)).run()
  } else {
    // Insert new pledge
    await db.insert(giftPledges).values({
      id: crypto.randomUUID(),
      giftId,
      userId: caller.id,
      userName: callerName,
      userUsername: callerUsername,
      amount: pledgeAmount,
    }).run()
  }

  // Reload all pledges to compute total
  const updatedPledges = await db.select().from(giftPledges).where(eq(giftPledges.giftId, giftId)).all()
  const totalPledged = updatedPledges.reduce((sum, p) => sum + (p.amount || 0), 0)

  // If collected amount covers the target, mark gift as booked
  if (gift.targetAmount > 0 && totalPledged >= gift.targetAmount && !gift.isBooked) {
    await db.update(gifts).set({
      isBooked: true,
      bookedByUserId: caller.id,
      bookedAt: new Date().toISOString(),
    }).where(eq(gifts.id, giftId)).run()
  }

  // Send notifications to co-contributors
  try {
    const otherPledgers = updatedPledges.filter(p => p.userId !== caller.id)
    await notifyCrowdfundPledge({
      giftTitle: gift.title,
      pledgerName: callerName,
      pledgerUsername: callerUsername,
      amount: pledgeAmount,
      targetAmount: gift.targetAmount || gift.price,
      currentTotal: totalPledged,
      existingPledgers: otherPledgers,
    })
  } catch (notifErr) {
    console.warn('Pledge notification error:', notifErr)
  }

  return {
    success: true,
    totalPledged,
    pledges: updatedPledges.map(p => ({
      id: p.id,
      userName: p.userName,
      userUsername: p.userUsername,
      amount: p.amount,
      createdAt: p.createdAt,
      isMe: p.userId === caller.id,
    })),
  }
}
