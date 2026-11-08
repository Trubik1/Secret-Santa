import { table, integer, text, boolean, index, sql } from 'sdk/db'

// Telegram Users & Wishlist owners
export const users = table('users', {
  id: integer('id').primaryKey(), // Telegram user_id
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  username: text('username'),
  photoUrl: text('photo_url'),
  eventTitle: text('event_title').default('Мой День Рождения'),
  eventDate: text('event_date'), // YYYY-MM-DD
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
  categoryId: text('category_id').default('other'),
  priority: integer('priority').default(1), // 1 (хочу), 2 (очень хочу), 3 (мечта)
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
