import { db, EndpointError } from 'sdk'
import { eq } from 'sdk/db'
import { gifts, users } from '../schema.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  // Check free limit of 5 gifts
  const user = await db.select().from(users).where(eq(users.id, caller.id)).get()
  const isPremium = Boolean(user?.isPremium)
  if (!isPremium) {
    const existingGifts = await db.select().from(gifts).where(eq(gifts.userId, caller.id)).all()
    if (existingGifts.length >= 5) {
      throw new EndpointError('Достигнут бесплатный лимит в 5 желаний. Подключите Giftly Premium ⭐ для безлимита!', { code: 'PREMIUM_REQUIRED' })
    }
  }

  const rawTitle = input?.title?.trim()
  if (!rawTitle) {
    throw new EndpointError('Название подарка обязательно', { code: 'INVALID_TITLE' })
  }
  const title = rawTitle.slice(0, 150)

  const price = Math.max(0, parseInt(input.price, 10) || 0)
  const isCrowdfund = Boolean(input.isCrowdfund)
  const targetAmount = isCrowdfund ? Math.max(0, parseInt(input.targetAmount || input.price, 10) || price) : 0
  const priority = [1, 2, 3].includes(parseInt(input.priority, 10)) ? parseInt(input.priority, 10) : 1
  const categoryId = (input.categoryId?.trim() || 'other').slice(0, 50)

  // URL protocol verification (only http/https allowed)
  const rawUrl = input.url?.trim() || null
  let url = null
  if (rawUrl) {
    const trimmedUrl = rawUrl.slice(0, 1000)
    if (/^https?:\/\//i.test(trimmedUrl)) {
      url = trimmedUrl
    }
  }

  const rawImageUrl = input.imageUrl?.trim() || null
  let imageUrl = null
  if (rawImageUrl) {
    const trimmedImg = rawImageUrl.slice(0, 1000)
    if (/^https?:\/\//i.test(trimmedImg) || trimmedImg.startsWith('data:image/')) {
      imageUrl = trimmedImg
    }
  }

  const description = input.description ? input.description.trim().slice(0, 1000) : null

  const id = crypto.randomUUID()

  const newGift = {
    id,
    userId: caller.id,
    title,
    price,
    currency: 'RUB',
    url,
    imageUrl,
    description,
    categoryId,
    priority,
    isCrowdfund,
    targetAmount,
    isBooked: false,
    bookedByUserId: null,
    bookedAt: null,
  }

  await db.insert(gifts).values(newGift).run()

  return {
    gift: newGift,
  }
}
