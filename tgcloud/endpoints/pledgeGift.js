import { db, EndpointError } from 'sdk'
import { eq, and } from 'sdk/db'
import { gifts, giftPledges, users } from '../schema.js'
import { notifyCrowdfundPledge, notifyCrowdfundCompleted } from '../lib/notifications.js'

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

  if (gift.userId === caller.id) {
    throw new EndpointError('Вы не можете скидываться на собственный подарок', { code: 'CANNOT_PLEDGE_OWN' })
  }

  // Any friend can propose / initiate a group collection on any gift
  const targetPrice = gift.price > 0 ? gift.price : (gift.targetAmount || pledgeAmount)
  if (!gift.isCrowdfund) {
    await db.update(gifts).set({
      isCrowdfund: true,
      targetAmount: targetPrice,
    }).where(eq(gifts.id, giftId)).run()
    gift.isCrowdfund = true
    gift.targetAmount = targetPrice
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

  // If collected amount covers the target (100%), automatically mark gift as booked by group
  const isGoalReached = targetPrice > 0 && totalPledged >= targetPrice
  if (isGoalReached && !gift.isBooked) {
    await db.update(gifts).set({
      isBooked: true,
      bookedByUserId: caller.id,
      bookedAt: new Date().toISOString(),
    }).where(eq(gifts.id, giftId)).run()

    // Fetch wishlist owner name
    let ownerName = 'друга'
    try {
      const owner = await db.select().from(users).where(eq(users.id, gift.userId)).get()
      if (owner && owner.firstName) {
        ownerName = owner.firstName
      }
    } catch (_) {}

    // Send celebratory notification to all contributors: "Сбор завершён! Покупайте подарок 🎁"
    try {
      await notifyCrowdfundCompleted({
        giftTitle: gift.title,
        giftPrice: targetPrice,
        giftUrl: gift.url,
        ownerName,
        participants: updatedPledges,
      })
    } catch (notifErr) {
      console.warn('Completed notification error:', notifErr)
    }
  } else {
    // Send notifications to other co-contributors about the new pledge
    try {
      const otherPledgers = updatedPledges.filter(p => p.userId !== caller.id)
      await notifyCrowdfundPledge({
        giftTitle: gift.title,
        pledgerName: callerName,
        pledgerUsername: callerUsername,
        amount: pledgeAmount,
        targetAmount: targetPrice,
        currentTotal: totalPledged,
        existingPledgers: otherPledgers,
      })
    } catch (notifErr) {
      console.warn('Pledge notification error:', notifErr)
    }
  }

  return {
    success: true,
    totalPledged,
    isBooked: isGoalReached || gift.isBooked,
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
