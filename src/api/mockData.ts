import { UserProfile, Gift } from '../types'

export const INITIAL_MOCK_PROFILE: UserProfile = {
  id: 1211235294,
  firstName: 'Artem',
  lastName: '',
  username: 'Trubik1',
  photoUrl: 'https://t.me/i/userpic/320/j5iJje6qwdgpUJZv2MgjMaY8Su2juolSNU3dVOJUHkw.svg',
  eventTitle: '',
  eventDate: null,
  isPremium: true,
  coverUrl: '/covers/artem_banner.webp',
}

export const INITIAL_MOCK_GIFTS: Gift[] = [
  {
    id: 'gift-1',
    userId: 1211235294,
    title: 'Apple iPhone 16 Pro 256 ГБ Desert Titanium',
    price: 110400, // ≈ $1,200.00
    currency: 'USD',
    url: 'https://www.wildberries.ru',
    imageUrl: '/products/phone.jpg',
    categoryId: 'gadgets',
    priority: 3, // Мечта
    isCrowdfund: true,
    targetAmount: 110400,
    createdAt: new Date().toISOString(),
    isBooked: false,
    totalPledged: 46000, // ≈ $500.00
    pledgesCount: 3,
    pledges: [
      { id: 'p1', userName: 'Михаил', userUsername: 'misha_dev', amount: 23000 },
      { id: 'p2', userName: 'Алина', userUsername: 'alina_design', amount: 13800 },
      { id: 'p3', userName: 'Денис', userUsername: 'denis_k', amount: 9200 },
    ],
  },
  {
    id: 'gift-2',
    userId: 1211235294,
    title: 'Мягкая игрушка плюшевая Майнкрафт Пчелка',
    price: 1840, // ≈ $20.00
    currency: 'USD',
    url: 'https://www.wildberries.by/catalog/505673667/detail.aspx',
    imageUrl: 'https://basket-27.wbbasket.ru/vol5056/part505673/505673667/images/big/1.webp',
    categoryId: 'other',
    priority: 1, // Хочу
    isPinned: true,
    isCrowdfund: false,
    targetAmount: 0,
    createdAt: new Date().toISOString(),
    isBooked: false,
    totalPledged: 0,
    pledgesCount: 0,
    pledges: [],
  },
  {
    id: 'gift-3',
    userId: 1211235294,
    title: 'Лонгслив оверсайз с принтом y2k котик',
    price: 4140, // ≈ $45.00
    currency: 'USD',
    url: 'https://www.wildberries.by/catalog/718811729/detail.aspx',
    imageUrl: '/products/hoodie.jpg',
    categoryId: 'clothes',
    priority: 2, // Очень хочу
    isCrowdfund: false,
    targetAmount: 0,
    createdAt: new Date().toISOString(),
    isBooked: false,
    totalPledged: 0,
    pledgesCount: 0,
    pledges: [],
  },
  {
    id: 'gift-4',
    userId: 1211235294,
    title: 'Sakura Подставка декоративная для фигурки в ПК, 120 мм',
    price: 1380, // ≈ $15.00
    currency: 'USD',
    url: 'https://www.wildberries.by/catalog/610512071/detail.aspx',
    imageUrl: 'https://basket-30.wbbasket.ru/vol6105/part610512/610512071/images/big/1.webp',
    categoryId: 'gadgets',
    priority: 1, // Хочу
    isCrowdfund: false,
    targetAmount: 0,
    createdAt: new Date().toISOString(),
    isBooked: false,
    totalPledged: 0,
    pledgesCount: 0,
    pledges: [],
  },
  {
    id: 'gift-5',
    userId: 1211235294,
    title: 'Беспроводные наушники Sony WH-1000XM5',
    price: 33490, // ≈ $364.00
    currency: 'USD',
    url: 'https://www.ozon.ru',
    imageUrl: '/products/headphones.jpg',
    categoryId: 'gadgets',
    priority: 2, // Очень хочу
    isCrowdfund: false,
    targetAmount: 0,
    createdAt: new Date().toISOString(),
    isBooked: true,
    bookedByName: 'Алексей',
    bookedByUsername: 'alex_tg',
    totalPledged: 0,
    pledgesCount: 0,
    pledges: [],
  },
  {
    id: 'gift-6',
    userId: 1211235294,
    title: 'Смарт-часы Minimal Series 2',
    price: 24990, // ≈ $271.00
    currency: 'USD',
    url: 'https://www.ozon.ru',
    imageUrl: '/products/watch.jpg',
    categoryId: 'gadgets',
    priority: 2, // Очень хочу
    isCrowdfund: true,
    targetAmount: 24990,
    createdAt: new Date().toISOString(),
    isBooked: false,
    totalPledged: 12500,
    pledgesCount: 2,
    pledges: [
      { id: 'p6', userName: 'Михаил', userUsername: 'misha_dev', amount: 7500 },
      { id: 'p7', userName: 'Алина', userUsername: 'alina_design', amount: 5000 },
    ],
  },
]
