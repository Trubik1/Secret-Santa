import { WishlistData, Gift, UserProfile, ParsedProduct, GiftPledge } from '../types'
import { INITIAL_MOCK_PROFILE, INITIAL_MOCK_GIFTS } from './mockData'

const MOCK_STORAGE_KEY_GIFTS = 'tg_wishlist_mock_gifts'
const MOCK_STORAGE_KEY_PROFILE = 'tg_wishlist_mock_profile'
const MOCK_STORAGE_KEY_IS_OWNER = 'tg_wishlist_mock_is_owner'

/**
 * Checks whether we are in a live Telegram WebApp environment with Serverless support.
 */
export function isTelegramServerlessAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const tg = window.Telegram?.WebApp
  return Boolean(tg?.initData && tg.initData.length > 0 && tg.Serverless?.call)
}

/**
 * Local mock state storage helpers.
 */
export function getMockProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY_PROFILE)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return { ...INITIAL_MOCK_PROFILE }
}

export function saveMockProfile(profile: UserProfile) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY_PROFILE, JSON.stringify(profile))
  } catch (_) {}
}

export function getMockGifts(): Gift[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY_GIFTS)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return [...INITIAL_MOCK_GIFTS]
}

export function saveMockGifts(gifts: Gift[]) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY_GIFTS, JSON.stringify(gifts))
  } catch (_) {}
}

export function getMockIsOwner(): boolean {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY_IS_OWNER)
    if (raw !== null) return raw === 'true'
  } catch (_) {}
  return true // default to owner in dev
}

export function setMockIsOwner(isOwner: boolean) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY_IS_OWNER, String(isOwner))
  } catch (_) {}
}

export function resetMockData() {
  try {
    localStorage.removeItem(MOCK_STORAGE_KEY_GIFTS)
    localStorage.removeItem(MOCK_STORAGE_KEY_PROFILE)
    localStorage.removeItem(MOCK_STORAGE_KEY_IS_OWNER)
  } catch (_) {}
}

/**
 * Universal Serverless API client.
 * Calls native Telegram Serverless in production, or handles locally in mock development.
 */
export async function serverlessCall<T = any>(endpoint: string, input: any = {}): Promise<T> {
  // 1. Live Telegram Serverless
  if (isTelegramServerlessAvailable()) {
    return new Promise((resolve, reject) => {
      window.Telegram!.WebApp.Serverless.call(endpoint, input, (err: any, result: T) => {
        if (err) {
          const message = err.message || err.description || 'Ошибка запроса к серверу'
          reject(new Error(message))
        } else {
          resolve(result)
        }
      })
    })
  }

  // 2. Hybrid Browser Mock Layer (Simulates server latency & SQLite logic)
  await new Promise((r) => setTimeout(r, 200)) // 200ms realistic UI feel

  const profile = getMockProfile()
  let giftsList = getMockGifts()

  // Support ownerId in mock layer
  const requestedOwnerId = input?.ownerId ? parseInt(input.ownerId, 10) : profile.id
  const isViewingOther = Boolean(input?.ownerId && String(requestedOwnerId) !== String(profile.id))
  const isOwner = isViewingOther ? false : getMockIsOwner()

  switch (endpoint) {
    case 'getWishlist': {
      const targetProfile: UserProfile = isViewingOther
        ? {
            id: requestedOwnerId,
            firstName: 'Друг #' + String(requestedOwnerId).slice(-4),
            lastName: '',
            username: 'friend_' + String(requestedOwnerId).slice(-4),
            photoUrl: null,
            eventTitle: 'Вишлист друга 🎁',
            eventDate: null,
            isPremium: false,
            coverUrl: null,
          }
        : profile

      const bookedCount = giftsList.filter((g) => g.isBooked).length

      // Apply Surprise Mode if viewed by owner
      const returnedGifts = giftsList.map((g) => {
        if (isOwner) {
          // In surprise mode, owner does NOT see which specific gifts are booked
          return {
            ...g,
            isBooked: false,
            isBookedByMe: false,
            totalPledged: 0,
            pledges: [],
          }
        }
        return {
          ...g,
          // If viewing friend, ensure isBooked / isBookedByMe flags exist
          isBookedByMe: g.isBooked && (g as any).isBookedByMe === true,
        }
      })

      const response: WishlistData = {
        profile: targetProfile,
        isOwner,
        viewer: {
          id: profile.id,
          firstName: profile.firstName,
          username: profile.username,
        },
        stats: {
          totalGifts: giftsList.length,
          bookedGifts: isOwner ? 0 : bookedCount,
        },
        gifts: returnedGifts,
      }
      return response as unknown as T
    }

    case 'addGift': {
      if (!isOwner) {
        throw new Error('Вы не можете добавлять подарки в чужой вишлист')
      }
      if (!profile.isPremium && giftsList.length >= 5) {
        throw new Error('Достигнут бесплатный лимит в 5 желаний. Подключите Giftly Premium ⭐ для безлимита!')
      }
      const id = 'gift-' + Date.now()
      const newGift: Gift = {
        id,
        userId: profile.id,
        title: input.title || 'Новый подарок',
        price: parseInt(input.price, 10) || 0,
        currency: 'RUB',
        url: input.url || null,
        imageUrl: input.imageUrl || null,
        description: input.description || null,
        categoryId: input.categoryId || 'other',
        priority: input.priority || 1,
        isCrowdfund: Boolean(input.isCrowdfund),
        targetAmount: Boolean(input.isCrowdfund) ? parseInt(input.targetAmount || input.price, 10) || 0 : 0,
        createdAt: new Date().toISOString(),
        isBooked: false,
        totalPledged: 0,
        pledgesCount: 0,
        pledges: [],
      }
      giftsList = [newGift, ...giftsList]
      saveMockGifts(giftsList)
      return { gift: newGift } as unknown as T
    }

    case 'updateGift': {
      if (!isOwner) {
        throw new Error('Вы не можете редактировать подарки в чужом вишлисте')
      }
      const index = giftsList.findIndex((g) => g.id === input.id)
      if (index === -1) throw new Error('Подарок не найден')

      giftsList[index] = {
        ...giftsList[index],
        title: input.title !== undefined ? input.title : giftsList[index].title,
        price: input.price !== undefined ? parseInt(input.price, 10) : giftsList[index].price,
        description: input.description !== undefined ? input.description : giftsList[index].description,
        url: input.url !== undefined ? input.url : giftsList[index].url,
        imageUrl: input.imageUrl !== undefined ? input.imageUrl : giftsList[index].imageUrl,
        categoryId: input.categoryId !== undefined ? input.categoryId : giftsList[index].categoryId,
        priority: input.priority !== undefined ? input.priority : giftsList[index].priority,
        isCrowdfund: input.isCrowdfund !== undefined ? Boolean(input.isCrowdfund) : giftsList[index].isCrowdfund,
        targetAmount: input.targetAmount !== undefined ? parseInt(input.targetAmount, 10) : giftsList[index].targetAmount,
      }
      saveMockGifts(giftsList)
      return { success: true } as unknown as T
    }

    case 'deleteGift': {
      if (!isOwner) {
        throw new Error('Вы не можете удалять подарки из чужого вишлиста')
      }
      const giftToDelete = giftsList.find((g) => g.id === input.id)
      giftsList = giftsList.filter((g) => g.id !== input.id)
      saveMockGifts(giftsList)

      // Record in local mock events
      try {
        const events = JSON.parse(localStorage.getItem('wishlist_mock_events') || '[]')
        events.push({
          id: Date.now(),
          giftId: input.id,
          title: giftToDelete?.title || 'Подарок',
          price: giftToDelete?.price || 0,
          reason: input.reason || 'just_delete',
          isCompleted: input.reason === 'gifted' || input.reason === 'bought_self',
          createdAt: new Date().toISOString(),
        })
        localStorage.setItem('wishlist_mock_events', JSON.stringify(events))
      } catch (_) {}

      return { success: true } as unknown as T
    }

    case 'bookGift': {
      const gift = giftsList.find((g) => g.id === input.id)
      if (!gift) throw new Error('Подарок не найден')

      if (input.action === 'unbook') {
        gift.isBooked = false
        gift.isBookedByMe = false
        gift.bookedByName = null
        gift.bookedByUsername = null
      } else {
        if (gift.isBooked && !gift.isBookedByMe) {
          throw new Error('Подарок уже забронирован другим гостем')
        }
        gift.isBooked = true
        gift.isBookedByMe = true
        gift.bookedByName = 'Вы'
        gift.bookedByUsername = 'my_user'
      }
      saveMockGifts(giftsList)
      return { success: true, isBooked: gift.isBooked, isBookedByMe: gift.isBookedByMe } as unknown as T
    }

    case 'pledgeGift': {
      const gift = giftsList.find((g) => g.id === input.giftId)
      if (!gift) throw new Error('Подарок не найден')

      const amount = parseInt(input.amount, 10) || 0
      if (amount <= 0) throw new Error('Некорректная сумма')

      gift.isCrowdfund = true
      gift.targetAmount = gift.price || amount

      const pledges = gift.pledges || []
      const existing = pledges.find((p) => p.isMe)

      if (existing) {
        existing.amount = amount
      } else {
        const newPledge: GiftPledge = {
          id: 'p-' + Date.now(),
          userName: 'Вы (Гость)',
          userUsername: 'friend_guest',
          amount,
          createdAt: new Date().toISOString(),
          isMe: true,
        }
        pledges.push(newPledge)
      }

      gift.pledges = pledges
      gift.pledgesCount = pledges.length
      gift.totalPledged = pledges.reduce((sum, p) => sum + p.amount, 0)
      gift.myPledgedAmount = amount

      const target = gift.targetAmount > 0 ? gift.targetAmount : gift.price
      if (target > 0 && gift.totalPledged >= target) {
        gift.isBooked = true
      }

      saveMockGifts(giftsList)
      return { success: true, totalPledged: gift.totalPledged, pledges: gift.pledges } as unknown as T
    }

    case 'updateProfile': {
      const updated = {
        ...profile,
        eventTitle: input.eventTitle !== undefined ? input.eventTitle : profile.eventTitle,
        eventDate: input.eventDate !== undefined ? input.eventDate : profile.eventDate,
        coverUrl: input.coverUrl !== undefined ? input.coverUrl : profile.coverUrl,
        isPremium: input.isPremium !== undefined ? Boolean(input.isPremium) : profile.isPremium,
      }
      saveMockProfile(updated)
      return { success: true } as unknown as T
    }

    case 'parseUrl': {
      const url = (input.url || '').trim()
      let mockResult: ParsedProduct = {
        title: 'Умная колонка Яндекс Станция Миди',
        imageUrl: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&auto=format&fit=crop&q=80',
        price: 14990,
        url,
        parsed: true,
      }

      if (url.includes('wildberries') || url.includes('wb.ru')) {
        mockResult = {
          title: 'Наушники Sony WH-1000XM5',
          imageUrl: '/products/headphones.jpg',
          price: 33490,
          url,
          parsed: true,
        }
      } else if (url.includes('ozon')) {
        mockResult = {
          title: 'Смарт-часы Minimal Series 2',
          imageUrl: '/products/watch.jpg',
          price: 24990,
          url,
          parsed: true,
        }
      }

      return mockResult as unknown as T
    }

    case 'createStarInvoice': {
      // In dev/mock mode, return a dummy invoice or simulated response
      return { ok: true, invoiceLink: `https://t.me/$mock_star_${Date.now()}` } as unknown as T
    }

    case 'getAdminStats': {
      const mockEvents = JSON.parse(localStorage.getItem('wishlist_mock_events') || '[]')
      const totalGiftsCount = giftsList.length
      const totalGiftsValue = giftsList.reduce((sum, g) => sum + (g.price || 0), 0)
      const avgPrice = totalGiftsCount > 0 ? Math.round(totalGiftsValue / totalGiftsCount) : 0

      const giftedCount = mockEvents.filter((e: any) => e.reason === 'gifted').length
      const boughtSelfCount = mockEvents.filter((e: any) => e.reason === 'bought_self').length
      const changedMindCount = mockEvents.filter((e: any) => e.reason === 'changed_mind').length
      const justDeleteCount = mockEvents.filter((e: any) => e.reason === 'just_delete').length
      const completedEvents = mockEvents.filter((e: any) => e.isCompleted)
      const completedValue = completedEvents.reduce((sum: number, e: any) => sum + (e.price || 0), 0)

      const userList = [
        {
          id: profile.id,
          name: profile.firstName,
          username: profile.username || 'trubik1',
          isPremium: Boolean(profile.isPremium),
          createdAt: '2026-11-10T19:02:04Z',
          giftsCount: giftsList.length,
        },
        {
          id: 168843437,
          name: 'Анна Шварц',
          username: 'Shwarc_Anna',
          isPremium: false,
          createdAt: '2026-11-11T05:27:27Z',
          giftsCount: 0,
        },
        {
          id: 8989626146,
          name: 'Соня',
          username: 'Loopsai',
          isPremium: false,
          createdAt: '2026-11-12T05:41:26Z',
          giftsCount: 0,
        },
      ]

      const timeframeBase = {
        count: completedEvents.length,
        totalValue: completedValue,
        reasons: {
          gifted: giftedCount,
          boughtSelf: boughtSelfCount,
          changedMind: changedMindCount,
          justDelete: justDeleteCount,
        },
      }

      return {
        success: true,
        users: {
          total: userList.length,
          premium: userList.filter((u) => u.isPremium).length,
          recent: userList,
          all: userList,
        },
        gifts: {
          total: totalGiftsCount,
          booked: giftsList.filter((g) => g.isBooked).length,
          crowdfund: giftsList.filter((g) => g.isCrowdfund).length,
          avgPerUser: totalGiftsCount,
          avgWishlistPrice: totalGiftsValue,
          avgGiftPrice: avgPrice,
          totalValue: totalGiftsValue,
        },
        timeframes: {
          days7: timeframeBase,
          days30: timeframeBase,
          allTime: timeframeBase,
        },
        completedLastMonth: timeframeBase,
        pledges: {
          totalCount: 0,
          totalAmount: 0,
        },
        generatedAt: new Date().toISOString(),
      } as unknown as T
    }

    default:
      throw new Error(`Unknown endpoint: ${endpoint}`)
  }
}

/**
 * Initiates native Telegram Stars payment through Bot API createInvoiceLink + openInvoice
 */
export async function payWithTelegramStars(params: {
  giftId?: string
  amount: number
  title?: string
  description?: string
  onSuccess?: () => void
  onCancel?: () => void
  onError?: (err: any) => void
}): Promise<void> {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null

  try {
    const res = await serverlessCall<{ ok: boolean; invoiceLink: string }>('createStarInvoice', {
      giftId: params.giftId,
      amount: params.amount,
      title: params.title || 'Сбор на подарок 🎁',
      description: params.description || `Взнос ${params.amount} ⭐ Telegram Stars в вишлист`,
    })

    if (!res?.invoiceLink) {
      throw new Error('Не удалось создать инвойс Telegram Stars')
    }

    if (tg?.openInvoice) {
      tg.openInvoice(res.invoiceLink, (status: string) => {
        if (status === 'paid') {
          params.onSuccess?.()
        } else if (status === 'cancelled') {
          params.onCancel?.()
        } else if (status === 'failed') {
          params.onError?.(new Error('Оплата в Telegram Stars не удалась'))
        }
      })
    } else {
      // Browser fallback (outside Telegram or in dev)
      const confirmed = window.confirm(
        `⭐️ Telegram Stars Payment\nСумма: ${params.amount} ⭐\nНазначение: ${params.title || 'Взнос в вишлист'}\n\nПодтвердить оплату звёздами?`
      )
      if (confirmed) {
        params.onSuccess?.()
      } else {
        params.onCancel?.()
      }
    }
  } catch (err: any) {
    params.onError?.(err)
  }
}
