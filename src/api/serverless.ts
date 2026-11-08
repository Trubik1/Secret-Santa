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

  const isOwner = getMockIsOwner()
  const profile = getMockProfile()
  let giftsList = getMockGifts()

  switch (endpoint) {
    case 'getWishlist': {
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
        return g
      })

      const response: WishlistData = {
        profile,
        isOwner,
        viewer: {
          id: isOwner ? profile.id : 99999,
          firstName: isOwner ? profile.firstName : 'Друг',
          username: isOwner ? profile.username : 'friend_guest',
        },
        stats: {
          totalGifts: giftsList.length,
          bookedGifts: bookedCount,
        },
        gifts: returnedGifts,
      }
      return response as unknown as T
    }

    case 'addGift': {
      const id = 'gift-' + Date.now()
      const newGift: Gift = {
        id,
        userId: profile.id,
        title: input.title || 'Новый подарок',
        price: parseInt(input.price, 10) || 0,
        currency: 'RUB',
        url: input.url || null,
        imageUrl: input.imageUrl || null,
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
      const index = giftsList.findIndex((g) => g.id === input.id)
      if (index === -1) throw new Error('Подарок не найден')

      giftsList[index] = {
        ...giftsList[index],
        title: input.title !== undefined ? input.title : giftsList[index].title,
        price: input.price !== undefined ? parseInt(input.price, 10) : giftsList[index].price,
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
      giftsList = giftsList.filter((g) => g.id !== input.id)
      saveMockGifts(giftsList)
      return { success: true } as unknown as T
    }

    case 'bookGift': {
      const gift = giftsList.find((g) => g.id === input.id)
      if (!gift) throw new Error('Подарок не найден')

      if (input.action === 'unbook') {
        gift.isBooked = false
        gift.isBookedByMe = false
      } else {
        if (gift.isBooked && !gift.isBookedByMe) {
          throw new Error('Подарок уже забронирован другим гостем')
        }
        gift.isBooked = true
        gift.isBookedByMe = true
      }
      saveMockGifts(giftsList)
      return { success: true, isBooked: gift.isBooked, isBookedByMe: gift.isBookedByMe } as unknown as T
    }

    case 'pledgeGift': {
      const gift = giftsList.find((g) => g.id === input.giftId)
      if (!gift) throw new Error('Подарок не найден')

      const amount = parseInt(input.amount, 10) || 0
      if (amount <= 0) throw new Error('Некорректная сумма')

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

      if (gift.targetAmount > 0 && gift.totalPledged >= gift.targetAmount) {
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
          title: 'Товар с Wildberries (автоопределение)',
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
          price: 5490,
          url,
          parsed: true,
        }
      } else if (url.includes('ozon')) {
        mockResult = {
          title: 'Товар с Ozon (автоопределение)',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
          price: 12900,
          url,
          parsed: true,
        }
      }

      return mockResult as unknown as T
    }

    default:
      throw new Error(`Unknown endpoint: ${endpoint}`)
  }
}
