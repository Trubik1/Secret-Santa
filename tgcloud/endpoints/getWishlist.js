import { db, EndpointError } from 'sdk'
import { eq, inArray } from 'sdk/db'
import { users, gifts, giftPledges } from '../schema.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  const requestedOwnerId = input?.ownerId ? parseInt(input.ownerId, 10) : caller.id
  const isOwner = Boolean(String(caller.id) === String(requestedOwnerId))

  // 1. Get or create target user profile
  let profile = await db.select().from(users).where(eq(users.id, requestedOwnerId)).get()
  if (!profile) {
    if (isOwner) {
      // First time owner visits
      const newUser = {
        id: caller.id,
        firstName: caller.first_name || 'Пользователь',
        lastName: caller.last_name || null,
        username: caller.username || null,
        photoUrl: caller.photo_url || null,
        eventTitle: '',
        eventDate: null,
      }
      await db.insert(users).values(newUser).run()
      profile = newUser
    } else {
      throw new EndpointError('Вишлист не найден', { code: 'NOT_FOUND' })
    }
  } else if (isOwner && caller.photo_url && profile.photoUrl !== caller.photo_url) {
    // Keep user's real Telegram avatar synchronized
    await db.update(users).set({ photoUrl: caller.photo_url }).where(eq(users.id, caller.id)).run()
    profile.photoUrl = caller.photo_url
  }

  // Auto-grant PRO strictly to creator Artem / Trubik1 by immutable Telegram ID (1211235294)
  const isTargetTrubik = profile.id === 1211235294

  if (isTargetTrubik && !profile.isPremium) {
    try {
      await db.update(users).set({ isPremium: true }).where(eq(users.id, profile.id)).run()
      profile.isPremium = true
    } catch (_) {}
  }

  const isCallerTrubik = caller.id === 1211235294

  if (isCallerTrubik) {
    try {
      await db.update(users).set({ isPremium: true }).where(eq(users.id, caller.id)).run()
      if (isOwner) profile.isPremium = true
    } catch (_) {}
  }

  // 2. Fetch all gifts for this owner
  const rawGifts = await db.select().from(gifts).where(eq(gifts.userId, requestedOwnerId)).all()

  // 3. Fetch pledges for crowdfund gifts
  const crowdfundGiftIds = rawGifts.filter(g => g.isCrowdfund).map(g => g.id)
  let allPledges = []
  if (crowdfundGiftIds.length > 0) {
    allPledges = await db.select().from(giftPledges).where(inArray(giftPledges.giftId, crowdfundGiftIds)).all()
  }

  // Group pledges by giftId
  const pledgesByGiftId = {}
  for (const pledge of allPledges) {
    if (!pledgesByGiftId[pledge.giftId]) {
      pledgesByGiftId[pledge.giftId] = []
    }
    pledgesByGiftId[pledge.giftId].push(pledge)
  }

  // 4. Calculate stats and apply Surprise Mode
  let bookedCount = 0
  for (const g of rawGifts) {
    if (g.isBooked) {
      bookedCount++
    }
  }

  // Fetch booker profiles for guests
  let bookerUsersMap = {}
  if (!isOwner) {
    const bookerUserIds = [...new Set(rawGifts.filter(g => g.isBooked && g.bookedByUserId).map(g => g.bookedByUserId))]
    if (bookerUserIds.length > 0) {
      try {
        const bookers = await db.select().from(users).where(inArray(users.id, bookerUserIds)).all()
        for (const b of bookers) {
          bookerUsersMap[b.id] = {
            name: [b.firstName, b.lastName].filter(Boolean).join(' ') || b.firstName || 'Друг',
            username: b.username || null,
          }
        }
      } catch (err) {
        console.warn('Failed to load bookers:', err)
      }
    }
  }

  const processedGifts = rawGifts.map(g => {
    const giftPledgesList = pledgesByGiftId[g.id] || []
    const totalPledged = giftPledgesList.reduce((sum, p) => sum + (p.amount || 0), 0)

    if (isOwner) {
      // SURPRISE MODE FOR OWNER:
      // The owner does NOT see which gift is booked or who booked it.
      return {
        id: g.id,
        userId: g.userId,
        title: g.title,
        price: g.price,
        currency: g.currency,
        url: g.url,
        imageUrl: g.imageUrl,
        description: g.description || null,
        categoryId: g.categoryId,
        priority: g.priority,
        isPinned: Boolean(g.isPinned),
        isCrowdfund: Boolean(g.isCrowdfund),
        targetAmount: g.targetAmount,
        createdAt: g.createdAt,
        // Hidden from owner to preserve surprise:
        isBooked: false,
        totalPledged: 0,
        pledgesCount: 0,
        pledges: [],
      }
    } else {
      // GUEST VIEW:
      // Guests see actual status so they don't gift duplicates
      const isBookedByMe = (g.bookedByUserId === caller.id)
      const myPledge = giftPledgesList.find(p => p.userId === caller.id)
      const booker = g.bookedByUserId ? bookerUsersMap[g.bookedByUserId] : null

      return {
        id: g.id,
        userId: g.userId,
        title: g.title,
        price: g.price,
        currency: g.currency,
        url: g.url,
        imageUrl: g.imageUrl,
        description: g.description || null,
        categoryId: g.categoryId,
        priority: g.priority,
        isPinned: Boolean(g.isPinned),
        isCrowdfund: Boolean(g.isCrowdfund),
        targetAmount: g.targetAmount,
        createdAt: g.createdAt,
        isBooked: Boolean(g.isBooked),
        isBookedByMe,
        bookedByName: booker?.name || null,
        bookedByUsername: booker?.username || null,
        totalPledged,
        pledgesCount: giftPledgesList.length,
        myPledgedAmount: myPledge ? myPledge.amount : 0,
        pledges: giftPledgesList.map(p => ({
          id: p.id,
          userId: p.userId,
          userName: p.userName,
          userUsername: p.userUsername,
          amount: p.amount,
          createdAt: p.createdAt,
          isMe: p.userId === caller.id,
        })),
      }
    }
  })

  const rawTitle = profile.eventTitle || ''
  const cleanEventTitle = (rawTitle === 'Мой День Рождения' || rawTitle === 'Мой День Рождения 🎂') ? '' : rawTitle

  return {
    profile: {
      id: profile.id,
      firstName: profile.firstName || 'Друг',
      lastName: profile.lastName || '',
      username: profile.username || null,
      photoUrl: profile.photoUrl || null,
      eventTitle: cleanEventTitle,
      eventDate: profile.eventDate,
      isPremium: Boolean(profile.isPremium),
      coverUrl: profile.coverUrl || null,
    },
    isOwner: Boolean(isOwner),
    viewer: {
      id: caller.id,
      firstName: caller.first_name,
      username: caller.username,
    },
    stats: {
      totalGifts: rawGifts.length,
      bookedGifts: isOwner ? 0 : bookedCount, // Complete secrecy for owner
    },
    gifts: processedGifts,
  }
}
