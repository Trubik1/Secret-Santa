import { db, EndpointError } from 'sdk'
import { users, gifts, giftEventsLog, giftPledges } from '../schema.js'

// Strictly allowed Telegram User IDs for Admin Dashboard
const ADMIN_USER_IDS = [1211235294]

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  // Security check: only authorized creator/admin can view stats
  if (!ADMIN_USER_IDS.includes(caller.id)) {
    throw new EndpointError('Доступ запрещён: требуются права администратора', { code: 'FORBIDDEN' })
  }

  // 1. Users metrics
  const allUsers = await db.select().from(users).all()
  const totalUsers = allUsers.length
  const premiumUsersCount = allUsers.filter(u => u.isPremium).length

  // Recent 10 users
  const recentUsers = [...allUsers]
    .sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()))
    .slice(0, 10)
    .map(u => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.firstName || 'Пользователь',
      username: u.username || null,
      isPremium: Boolean(u.isPremium),
      createdAt: u.createdAt || null,
    }))

  // 2. Gifts metrics
  const allGifts = await db.select().from(gifts).all()
  const totalGifts = allGifts.length
  const bookedGifts = allGifts.filter(g => g.isBooked).length
  const crowdfundGifts = allGifts.filter(g => g.isCrowdfund).length
  const totalGiftsValue = allGifts.reduce((sum, g) => sum + (g.price || 0), 0)

  const avgGiftsPerUser = totalUsers > 0 ? parseFloat((totalGifts / totalUsers).toFixed(1)) : 0
  const avgWishlistPrice = totalUsers > 0 ? Math.round(totalGiftsValue / totalUsers) : 0
  const avgGiftPrice = totalGifts > 0 ? Math.round(totalGiftsValue / totalGifts) : 0

  // 3. Completed & Deleted Events metrics (last 30 days)
  let allEvents = []
  try {
    allEvents = await db.select().from(giftEventsLog).all()
  } catch (err) {
    console.warn('Could not read giftEventsLog:', err)
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recentEvents = allEvents.filter(e => {
    if (!e.createdAt) return true
    const t = new Date(e.createdAt).getTime()
    return isNaN(t) || t >= thirtyDaysAgo
  })

  const completedLastMonth = recentEvents.filter(e => e.eventType === 'completed')
  const completedCount = completedLastMonth.length
  const completedTotalValue = completedLastMonth.reduce((sum, e) => sum + (e.giftPrice || 0), 0)

  // Breakdown by reasons
  const reasonBreakdown = {
    gifted: recentEvents.filter(e => e.reason === 'gifted').length,
    boughtSelf: recentEvents.filter(e => e.reason === 'bought_self').length,
    changedMind: recentEvents.filter(e => e.reason === 'changed_mind').length,
    justDelete: recentEvents.filter(e => e.reason === 'just_delete').length,
  }

  // 4. Crowdfund pledges total
  let allPledges = []
  try {
    allPledges = await db.select().from(giftPledges).all()
  } catch (_) {}
  const totalPledgedSum = allPledges.reduce((sum, p) => sum + (p.amount || 0), 0)

  return {
    success: true,
    users: {
      total: totalUsers,
      premium: premiumUsersCount,
      recent: recentUsers,
    },
    gifts: {
      total: totalGifts,
      booked: bookedGifts,
      crowdfund: crowdfundGifts,
      avgPerUser: avgGiftsPerUser,
      avgWishlistPrice,
      avgGiftPrice,
      totalValue: totalGiftsValue,
    },
    completedLastMonth: {
      count: completedCount,
      totalValue: completedTotalValue,
      reasons: reasonBreakdown,
    },
    pledges: {
      totalCount: allPledges.length,
      totalAmount: totalPledgedSum,
    },
    generatedAt: new Date().toISOString(),
  }
}
