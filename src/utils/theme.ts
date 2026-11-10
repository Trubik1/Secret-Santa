export type DesignTheme = 'inter' | 'editorial' | 'space' | 'jakarta' | 'system'

export interface ThemeOption {
  id: DesignTheme
  name: string
  subtitle: string
  fontClass: string
  headingFont: string
  cardRadius: string
  borderClass: string
  previewBadge: string
  description: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'inter',
    name: '1. Минимализм Inter',
    subtitle: 'Apple & Telegram Glass',
    fontClass: 'font-inter',
    headingFont: 'font-inter font-extrabold',
    cardRadius: 'rounded-24',
    borderClass: 'border border-zinc-200/90 dark:border-zinc-800/90',
    previewBadge: 'Inter UI · 20px',
    description: 'Чистая швейцарская геометрия. Максимальная читаемость и строгость.',
  },
  {
    id: 'editorial',
    name: '2. Премиум Эдиториал',
    subtitle: 'Playfair & Luxury Editorial',
    fontClass: 'font-jakarta',
    headingFont: 'font-editorial font-bold tracking-tight',
    cardRadius: 'rounded-20',
    borderClass: 'border border-stone-300/80 dark:border-stone-800',
    previewBadge: 'Playfair · Vogue',
    description: 'Изящный журнальный стиль с контрастными заголовками и утончёнными рамками.',
  },
  {
    id: 'space',
    name: '3. Cyber Space Grotesk',
    subtitle: 'Modern Tech & Brutalism',
    fontClass: 'font-space',
    headingFont: 'font-space font-extrabold tracking-tight',
    cardRadius: 'rounded-16',
    borderClass: 'border-2 border-zinc-300 dark:border-zinc-700',
    previewBadge: 'Space · Tech',
    description: 'Острый технологичный стиль с моноширинными элементами и чёткими гранями.',
  },
  {
    id: 'jakarta',
    name: '4. Мягкий Скандинавский',
    subtitle: 'Plus Jakarta Soft Curves',
    fontClass: 'font-jakarta',
    headingFont: 'font-jakarta font-extrabold',
    cardRadius: 'rounded-32',
    borderClass: 'border border-rose-200/60 dark:border-rose-950/40',
    previewBadge: 'Jakarta · Soft',
    description: 'Уютный, воздушный дизайн с глубокими скруглениями и дружелюбной типографикой.',
  },
  {
    id: 'system',
    name: '5. Компактный Telegram Native',
    subtitle: 'iOS / Android Native Fast',
    fontClass: 'font-system',
    headingFont: 'font-system font-bold',
    cardRadius: 'rounded-16',
    borderClass: 'border border-black/10 dark:border-white/10',
    previewBadge: 'Native · Fast',
    description: 'Нативный шрифт вашей операционной системы (SF Pro / Roboto). Быстрый и компактный.',
  },
]
