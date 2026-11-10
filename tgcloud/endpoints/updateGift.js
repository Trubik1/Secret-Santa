import { db, EndpointError } from 'sdk'
import { eq, and } from 'sdk/db'
import { gifts } from '../schema.js'

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
    throw new EndpointError('Вы не можете редактировать чужой подарок', { code: 'FORBIDDEN' })
  }

  const title = input.title !== undefined ? input.title.trim() : existing.title
  if (!title) {
    throw new EndpointError('Название подарка не может быть пустым', { code: 'INVALID_TITLE' })
  }

  const price = input.price !== undefined ? Math.max(0, parseInt(input.price, 10) || 0) : existing.price
  const isCrowdfund = input.isCrowdfund !== undefined ? Boolean(input.isCrowdfund) : existing.isCrowdfund
  const targetAmount = isCrowdfund
    ? (input.targetAmount !== undefined ? Math.max(0, parseInt(input.targetAmount, 10) || 0) : existing.targetAmount)
    : 0
  const priority = input.priority !== undefined ? parseInt(input.priority, 10) : existing.priority
  const categoryId = input.categoryId !== undefined ? input.categoryId.trim() : existing.categoryId
  const url = input.url !== undefined ? input.url.trim() : existing.url
  const imageUrl = input.imageUrl !== undefined ? input.imageUrl.trim() : existing.imageUrl
  const description = input.description !== undefined ? (input.description?.trim() || null) : existing.description

  await db.update(gifts).set({
    title,
    price,
    isCrowdfund,
    targetAmount,
    priority,
    categoryId,
    url,
    imageUrl,
    description,
  }).where(and(eq(gifts.id, giftId), eq(gifts.userId, caller.id))).run()

  return {
    success: true,
  }
}
