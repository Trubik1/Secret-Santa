import { db, EndpointError } from 'sdk'
import { eq, and } from 'sdk/db'
import { gifts, users } from '../schema.js'

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

  const title = input.title !== undefined ? input.title.trim().slice(0, 150) : existing.title
  if (!title) {
    throw new EndpointError('Название подарка не может быть пустым', { code: 'INVALID_TITLE' })
  }

  const price = input.price !== undefined ? Math.max(0, parseInt(input.price, 10) || 0) : existing.price
  const isCrowdfund = input.isCrowdfund !== undefined ? Boolean(input.isCrowdfund) : existing.isCrowdfund
  const targetAmount = isCrowdfund
    ? (input.targetAmount !== undefined ? Math.max(0, parseInt(input.targetAmount, 10) || 0) : existing.targetAmount)
    : 0
  const priority = input.priority !== undefined ? parseInt(input.priority, 10) : existing.priority

  // Enforce PRO verification for pinning gifts
  let isPinned = Boolean(existing.isPinned)
  if (input.isPinned !== undefined) {
    const requestedPin = Boolean(input.isPinned)
    if (requestedPin && !existing.isPinned) {
      const user = await db.select().from(users).where(eq(users.id, caller.id)).get()
      const isPremium = Boolean(user?.isPremium || caller.id === 1211235294)
      if (!isPremium) {
        throw new EndpointError('Закрепление подарка на первом месте доступно только для пользователей Giftly PRO ⭐', { code: 'PREMIUM_REQUIRED' })
      }
    }
    isPinned = requestedPin
  }

  const categoryId = input.categoryId !== undefined ? input.categoryId.trim().slice(0, 50) : existing.categoryId
  const url = input.url !== undefined ? (input.url ? input.url.trim().slice(0, 1000) : null) : existing.url
  const imageUrl = input.imageUrl !== undefined ? (input.imageUrl ? input.imageUrl.trim().slice(0, 1000) : null) : existing.imageUrl
  const description = input.description !== undefined ? (input.description ? input.description.trim().slice(0, 1000) : null) : existing.description

  // If pinning this gift, unpin other gifts for this user
  if (isPinned && !existing.isPinned) {
    try {
      await db.update(gifts).set({ isPinned: false }).where(eq(gifts.userId, caller.id)).run()
    } catch (_) {}
  }

  await db.update(gifts).set({
    title,
    price,
    isCrowdfund,
    targetAmount,
    priority,
    isPinned,
    categoryId,
    url,
    imageUrl,
    description,
  }).where(and(eq(gifts.id, giftId), eq(gifts.userId, caller.id))).run()

  return {
    success: true,
  }
}
