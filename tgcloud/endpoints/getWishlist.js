import { db, EndpointError } from 'sdk'
import { eq, inArray } from 'sdk/db'
import { users, gifts, giftPledges } from '../schema.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  const requestedOwnerId = input?.ownerId ? parseInt(input.ownerId, 10) : caller.id
  const isOwner = (caller.id === requestedOwnerId)

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
        eventTitle: 'Мой День Рождения 🎂',
        eventDate: null,
      }
      await db.insert(users).values(newUser).run()
      profile = newUser
    } else {
      throw new EndpointError('Вишлист не найден', { code: 'NOT_FOUND' })
    }
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
        categoryId: g.categoryId,
        priority: g.priority,
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

      return {
        id: g.id,
        userId: g.userId,
        title: g.title,
        price: g.price,
        currency: g.currency,
        url: g.url,
        imageUrl: g.imageUrl,
        categoryId: g.categoryId,
        priority: g.priority,
        isCrowdfund: Boolean(g.isCrowdfund),
        targetAmount: g.targetAmount,
        createdAt: g.createdAt,
        isBooked: Boolean(g.isBooked),
        isBookedByMe,
        totalPledged,
        pledgesCount: giftPledgesList.length,
        myPledgedAmount: myPledge ? myPledge.amount : 0,
        pledges: giftPledgesList.map(p => ({
          id: p.id,
          userName: p.userName,
          userUsername: p.userUsername,
          amount: p.amount,
          createdAt: p.createdAt,
          isMe: p.userId === caller.id,
        })),
      }
    }
  })

  return {
    profile: {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      photoUrl: profile.photoUrl,
      eventTitle: profile.eventTitle || 'Мой День Рождения 🎂',
      eventDate: profile.eventDate,
    },
    isOwner,
    viewer: {
      id: caller.id,
      firstName: caller.first_name,
      username: caller.username,
    },
    stats: {
      totalGifts: rawGifts.length,
      bookedGifts: bookedCount, // General counter shown to owner
    },
    gifts: processedGifts,
  }
}
