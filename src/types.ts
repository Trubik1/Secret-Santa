export type Priority = 1 | 2 | 3 // 1: хочу, 2: очень хочу, 3: мечта

export type CategoryId = 'all' | 'gadgets' | 'clothes' | 'home' | 'books' | 'other'

export interface Category {
  id: CategoryId
  title: string
  icon: string
}

export interface UserProfile {
  id: number
  firstName: string
  lastName?: string | null
  username?: string | null
  photoUrl?: string | null
  eventTitle: string
  eventDate?: string | null // YYYY-MM-DD
}

export interface GiftPledge {
  id: string
  userName: string
  userUsername?: string | null
  amount: number
  createdAt?: string
  isMe?: boolean
}

export interface Gift {
  id: string
  userId: number
  title: string
  price: number
  currency: string
  url?: string | null
  imageUrl?: string | null
  categoryId: string
  priority: Priority
  isCrowdfund: boolean
  targetAmount: number
  createdAt?: string
  // Viewer-specific fields:
  isBooked: boolean
  isBookedByMe?: boolean
  bookedByName?: string | null
  bookedByUsername?: string | null
  totalPledged?: number
  pledgesCount?: number
  myPledgedAmount?: number
  pledges?: GiftPledge[]
}

export interface WishlistStats {
  totalGifts: number
  bookedGifts: number
}

export interface WishlistData {
  profile: UserProfile
  isOwner: boolean
  viewer: {
    id: number
    firstName: string
    username?: string | null
  }
  stats: WishlistStats
  gifts: Gift[]
}

export interface ParsedProduct {
  title: string
  imageUrl: string
  price: number
  categoryId?: string
  url: string
  parsed: boolean
}
