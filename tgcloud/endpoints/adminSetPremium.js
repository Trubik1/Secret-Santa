import { db, EndpointError } from 'sdk'
import { eq } from 'sdk/db'
import { users } from '../schema.js'

// Strictly allowed Telegram User IDs for Admin actions
const ADMIN_USER_IDS = [1211235294]

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  // Security check: only authorized creator/admin can grant or revoke PRO
  if (!ADMIN_USER_IDS.includes(caller.id)) {
    throw new EndpointError('Доступ запрещён: требуются права администратора', { code: 'FORBIDDEN' })
  }

  const targetUserId = Number(input?.targetUserId)
  if (!targetUserId || isNaN(targetUserId)) {
    throw new EndpointError('Не указан корректный ID пользователя (targetUserId)', { code: 'BAD_REQUEST' })
  }

  const isPremium = Boolean(input?.isPremium)

  // Find target user in database
  const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).get()
  if (!targetUser) {
    // If user record doesn't exist yet, insert minimal record with isPremium
    await db.insert(users).values({
      id: targetUserId,
      firstName: input?.firstName ? String(input.firstName).slice(0, 100) : 'Пользователь',
      username: input?.username ? String(input.username).slice(0, 100) : null,
      isPremium,
    }).run()
  } else {
    await db.update(users).set({ isPremium }).where(eq(users.id, targetUserId)).run()
  }

  return {
    success: true,
    targetUserId,
    isPremium,
    updatedAt: new Date().toISOString(),
  }
}
