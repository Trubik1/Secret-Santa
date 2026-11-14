import { table, integer, text, boolean, index, sql } from 'sdk/db'

// Telegram Users & Wishlist owners
export const users = table('users', {
  id: integer('id').primaryKey(), // Telegram user_id
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  username: text('username'),
  photoUrl: text('photo_url'),
  eventTitle: text('event_title').default(''),
  eventDate: text('event_date'), // YYYY-MM-DD
  isPremium: boolean('is_premium').default(false),
  coverUrl: text('cover_url'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

// Categories / Tags
export const categories = table('categories', {
  id: text('id').primaryKey(), // 'all', 'gadgets', 'clothes', 'home', 'books', 'other'
  title: text('title').notNull(),
  icon: text('icon').notNull(),
})

// Gifts in wishlist
export const gifts = table('gifts', {
  id: text('id').primaryKey(), // UUID string
  userId: integer('user_id').notNull(), // Owner user_id
  title: text('title').notNull(),
  price: integer('price').default(0), // Price in RUB
  currency: text('currency').default('RUB'),
  url: text('url'), // Online store link
  imageUrl: text('image_url'), // Image URL
  description: text('description'), // Creator notes & wishes
  categoryId: text('category_id').default('other'),
  priority: integer('priority').default(1), // 1 (хочу), 2 (очень хочу), 3 (мечта)
  isPinned: boolean('is_pinned').default(false), // 1 = pinned to #1 place (PRO)
  isCrowdfund: boolean('is_crowdfund').default(false), // 1 = enabled crowdfunding
  targetAmount: integer('target_amount').default(0), // Target sum in RUB
  isBooked: boolean('is_booked').default(false), // 1 = booked by someone
  bookedByUserId: integer('booked_by_user_id'), // Telegram ID of who booked
  bookedAt: text('booked_at'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userGiftsIdx: index('idx_gifts_user_id').on(t.userId),
  categoryIdx: index('idx_gifts_category_id').on(t.categoryId),
}))

// Pledges for crowdfunding
export const giftPledges = table('gift_pledges', {
  id: text('id').primaryKey(), // UUID
  giftId: text('gift_id').notNull(), // Target gift ID
  userId: integer('user_id').notNull(), // Contributor Telegram ID
  userName: text('user_name').notNull(),
  userUsername: text('user_username'), // Telegram @username
  amount: integer('amount').notNull(), // Contributed amount in RUB
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (t) => ({
  giftPledgesIdx: index('idx_pledges_gift_id').on(t.giftId),
  userPledgesIdx: index('idx_pledges_user_id').on(t.userId),
}))

// Gift events log (for completion tracking, deletion reasons, and admin analytics)
export const giftEventsLog = table('gift_events_log', {
  id: text('id').primaryKey(), // UUID
  giftId: text('gift_id'),
  userId: integer('user_id').notNull(),
  eventType: text('event_type').notNull(), // 'completed', 'deleted'
  reason: text('reason').notNull(), // 'gifted', 'bought_self', 'changed_mind', 'just_delete'
  giftTitle: text('gift_title'),
  giftPrice: integer('gift_price').default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userEventsIdx: index('idx_events_user_id').on(t.userId),
  eventDateIdx: index('idx_events_created_at').on(t.createdAt),
}))
