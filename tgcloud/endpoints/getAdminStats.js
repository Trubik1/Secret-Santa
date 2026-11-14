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

  // 1. Users metrics & all gifts
  const allUsers = await db.select().from(users).all()
  const totalUsers = allUsers.length
  const premiumUsersCount = allUsers.filter(u => u.isPremium).length

  // 2. Gifts metrics
  const allGifts = await db.select().from(gifts).all()
  const totalGifts = allGifts.length
  const bookedGifts = allGifts.filter(g => g.isBooked).length
  const crowdfundGifts = allGifts.filter(g => g.isCrowdfund).length
  const totalGiftsValue = allGifts.reduce((sum, g) => sum + (g.price || 0), 0)

  const avgGiftsPerUser = totalUsers > 0 ? parseFloat((totalGifts / totalUsers).toFixed(1)) : 0
  const avgWishlistPrice = totalUsers > 0 ? Math.round(totalGiftsValue / totalUsers) : 0
  const avgGiftPrice = totalGifts > 0 ? Math.round(totalGiftsValue / totalGifts) : 0

  // Map all users with gifts count
  const allMappedUsers = [...allUsers]
    .sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()))
    .map(u => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.firstName || 'Пользователь',
      username: u.username || null,
      isPremium: Boolean(u.isPremium),
      createdAt: u.createdAt || null,
      giftsCount: allGifts.filter(g => g.userId === u.id).length,
    }))

  const recentUsers = allMappedUsers.slice(0, 10)

  // 3. Completed & Deleted Events metrics
  let allEvents = []
  try {
    allEvents = await db.select().from(giftEventsLog).all()
  } catch (err) {
    console.warn('Could not read giftEventsLog:', err)
  }

  function calculateTimeframeStats(events, cutoffTime) {
    const filtered = cutoffTime
      ? events.filter(e => {
          if (!e.createdAt) return true
          const t = new Date(e.createdAt).getTime()
          return isNaN(t) || t >= cutoffTime
        })
      : events

    const completed = filtered.filter(e => e.eventType === 'completed')
    const count = completed.length
    const totalValue = completed.reduce((sum, e) => sum + (e.giftPrice || 0), 0)

    const reasons = {
      gifted: filtered.filter(e => e.reason === 'gifted').length,
      boughtSelf: filtered.filter(e => e.reason === 'bought_self').length,
      changedMind: filtered.filter(e => e.reason === 'changed_mind').length,
      justDelete: filtered.filter(e => e.reason === 'just_delete').length,
    }

    return { count, totalValue, reasons }
  }

  const now = Date.now()
  const days7Stats = calculateTimeframeStats(allEvents, now - 7 * 24 * 60 * 60 * 1000)
  const days30Stats = calculateTimeframeStats(allEvents, now - 30 * 24 * 60 * 60 * 1000)
  const allTimeStats = calculateTimeframeStats(allEvents, null)

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
      all: allMappedUsers,
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
    timeframes: {
      days7: days7Stats,
      days30: days30Stats,
      allTime: allTimeStats,
    },
    completedLastMonth: days30Stats,
    pledges: {
      totalCount: allPledges.length,
      totalAmount: totalPledgedSum,
    },
    generatedAt: new Date().toISOString(),
  }
}
