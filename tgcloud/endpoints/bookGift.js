import { db, EndpointError } from 'sdk'
import { eq } from 'sdk/db'
import { gifts, users } from '../schema.js'
import { notifyGiftBooked } from '../lib/notifications.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  const giftId = input?.id
  const action = input?.action || 'book' // 'book' or 'unbook'

  if (!giftId) {
    throw new EndpointError('ID подарка не указан', { code: 'MISSING_ID' })
  }

  const gift = await db.select().from(gifts).where(eq(gifts.id, giftId)).get()
  if (!gift) {
    throw new EndpointError('Подарок не найден', { code: 'NOT_FOUND' })
  }

  if (gift.userId === caller.id) {
    throw new EndpointError('Вы не можете забронировать подарок из собственного вишлиста', { code: 'CANNOT_BOOK_OWN' })
  }

  const owner = await db.select().from(users).where(eq(users.id, gift.userId)).get()

  if (action === 'unbook') {
    if (!gift.isBooked) {
      return { success: true, isBooked: false }
    }
    if (gift.bookedByUserId !== caller.id) {
      throw new EndpointError('Вы не можете отменить чужую бронь', { code: 'FORBIDDEN' })
    }

    await db.update(gifts).set({
      isBooked: false,
      bookedByUserId: null,
      bookedAt: null,
    }).where(eq(gifts.id, giftId)).run()

    return {
      success: true,
      isBooked: false,
    }
  }

  // Action is 'book'
  if (gift.isBooked) {
    if (gift.bookedByUserId === caller.id) {
      return { success: true, isBooked: true, isBookedByMe: true }
    }
    throw new EndpointError('Этот подарок уже забронирован другим гостем', { code: 'ALREADY_BOOKED' })
  }

  const now = new Date().toISOString()
  await db.update(gifts).set({
    isBooked: true,
    bookedByUserId: caller.id,
    bookedAt: now,
  }).where(eq(gifts.id, giftId)).run()

  // Send asynchronous bot notifications
  try {
    await notifyGiftBooked({
      ownerId: gift.userId,
      bookerId: caller.id,
      giftTitle: gift.title,
      giftPrice: gift.price,
      giftUrl: gift.url,
      eventDate: owner?.eventDate || null,
    })
  } catch (notifErr) {
    console.warn('Booking notification error:', notifErr)
  }

  return {
    success: true,
    isBooked: true,
    isBookedByMe: true,
  }
}
