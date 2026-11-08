import { db, EndpointError } from 'sdk'
import { gifts } from '../schema.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  const title = input?.title?.trim()
  if (!title) {
    throw new EndpointError('Название подарка обязательно', { code: 'INVALID_TITLE' })
  }

  const price = Math.max(0, parseInt(input.price, 10) || 0)
  const isCrowdfund = Boolean(input.isCrowdfund)
  const targetAmount = isCrowdfund ? Math.max(0, parseInt(input.targetAmount || input.price, 10) || price) : 0
  const priority = [1, 2, 3].includes(parseInt(input.priority, 10)) ? parseInt(input.priority, 10) : 1
  const categoryId = input.categoryId?.trim() || 'other'
  const url = input.url?.trim() || null
  const imageUrl = input.imageUrl?.trim() || null

  const id = crypto.randomUUID()

  const newGift = {
    id,
    userId: caller.id,
    title,
    price,
    currency: 'RUB',
    url,
    imageUrl,
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
