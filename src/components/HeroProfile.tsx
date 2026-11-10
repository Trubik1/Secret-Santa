import React, { useState } from 'react'
import { UserProfile, WishlistStats } from '../types'
import { Calendar, Gift as GiftIcon, Sparkles, Share2, Settings } from 'lucide-react'
import { ThemeOption } from '../utils/theme'

interface HeroProfileProps {
  profile: UserProfile
  isOwner: boolean
  stats: WishlistStats
  theme?: ThemeOption
  onOpenShare: () => void
  onOpenSettings: () => void
  onHaptic?: () => void
}

const MASCOT_MESSAGES = [
  'Цены в ₽, Br и других валютах 🌎',
  'Не забудь загадать желание! ✨',
  'Праздник близко! 🎉',
  'Подарки — это радость 💖',
  'Ты супер! 🚀',
]

export const HeroProfile: React.FC<HeroProfileProps> = ({
  profile,
  isOwner,
  stats,
  theme,
  onOpenShare,
  onOpenSettings,
  onHaptic,
}) => {
  const [mascotBubble, setMascotBubble] = useState<string | null>(null)
  const [mascotIndex, setMascotIndex] = useState(0)

  const handleMascotClick = () => {
    onHaptic?.()
    const nextMsg = MASCOT_MESSAGES[mascotIndex % MASCOT_MESSAGES.length]
    setMascotIndex((prev) => prev + 1)
    setMascotBubble(nextMsg)
    setTimeout(() => {
      setMascotBubble(null)
    }, 2800)
  }

  // Calculate countdown days
  const countdownText = React.useMemo(() => {
    if (!profile.eventDate) return null
    const target = new Date(profile.eventDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)

    const diffMs = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Праздник сегодня! 🎉'
    if (diffDays === 1) return 'Остался 1 день 🔥'
    if (diffDays > 1 && diffDays < 5) return `Осталось ${diffDays} дня`
    if (diffDays >= 5) return `Осталось ${diffDays} дней`
    return 'Событие прошло'
  }, [profile.eventDate])

  const [imgFailed, setImgFailed] = React.useState(false)
  const initial = (profile.firstName || 'А')[0].toUpperCase()

  const cardRadius = theme?.cardRadius || 'rounded-32'
  const cardBorder = theme?.borderClass || 'border border-border-soft dark:border-border-soft-dark'
  const headingFont = theme?.headingFont || 'font-extrabold'

  return (
    <div className="w-full pt-4 pb-4 px-4">
      {/* Bento Profile Card */}
      <div className={`relative overflow-hidden bg-surface-soft dark:bg-surface-soft-dark ${cardRadius} p-5 transition-all duration-300 ${cardBorder} shadow-subtle`}>
        
        {/* Decorative subtle ambient circle */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-accent-pink/15 blur-2xl pointer-events-none" />

        {/* Unibb 3D Bunny Mascot Sticker with Interactive Tap & Bubble */}
        <div
          onClick={handleMascotClick}
          className="absolute -bottom-1 right-2 select-none z-20 cursor-pointer group"
          title="Нажми на зайку!"
        >
          {mascotBubble && (
            <div className="absolute -top-8 right-0 bg-white dark:bg-zinc-800 text-ink-light dark:text-ink-dark text-[11px] font-bold py-1 px-2.5 rounded-full shadow-lg border border-border-soft dark:border-border-soft-dark whitespace-nowrap animate-bounce">
              {mascotBubble}
            </div>
          )}
          <img
            src="/stickers/bunny-hero.webp"
            alt="Unibb Mascot"
            className="w-18 h-18 sm:w-20 sm:h-20 object-contain drop-shadow-md group-hover:scale-110 active:scale-95 transition-transform"
          />
        </div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div className="relative">
              {profile.photoUrl && !imgFailed ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.firstName}
                  className="w-14 h-14 rounded-full object-cover ring-3 ring-white dark:ring-surface-card-dark shadow-md"
                  onError={() => setImgFailed(true)}
                />
              ) : !imgFailed ? (
                <img
                  src="/avatar.png"
                  alt={profile.firstName}
                  className="w-14 h-14 rounded-full object-cover ring-3 ring-white dark:ring-surface-card-dark shadow-md bg-white dark:bg-surface-card-dark"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-accent-rose to-accent-pink text-white flex items-center justify-center font-bold text-xl shadow-md ring-3 ring-white dark:ring-surface-card-dark">
                  {initial}
                </div>
              )}
              {isOwner && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-surface-card-dark rounded-full p-0.5 shadow-sm">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-surface-card-dark" />
                </div>
              )}
            </div>

            {/* Name & Username */}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className={`text-lg ${headingFont} tracking-tight text-ink-light dark:text-ink-dark`}>
                  {profile.firstName} {profile.lastName || ''}
                </h1>
              </div>
              {profile.username && (
                <p className="text-xs font-semibold text-accent-rose dark:text-accent-rose-dark">
                  @{profile.username}
                </p>
              )}
            </div>
          </div>

          {/* Clean Action Buttons: Share & Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenShare}
              className="p-2.5 rounded-full bg-white/90 dark:bg-surface-card-dark/90 text-ink-muted dark:text-ink-muted-dark hover:text-accent-rose transition-colors active-press shadow-sm border border-border-soft/50 dark:border-border-soft-dark/50"
              title="Поделиться вишлистом"
            >
              <Share2 size={16} />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-full bg-white/90 dark:bg-surface-card-dark/90 text-ink-muted dark:text-ink-muted-dark hover:text-accent-rose transition-colors active-press shadow-sm border border-border-soft/50 dark:border-border-soft-dark/50"
              title="Настройки (валюты, шрифты, стили)"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Event Title & Countdown */}
        <div className="mt-4 relative z-10">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className={`text-sm font-bold text-ink-light dark:text-ink-dark flex items-center gap-1.5`}>
              <span>{profile.eventTitle || 'Мой День Рождения 🎂'}</span>
            </h2>

            {/* Countdown pill */}
            {countdownText ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-surface-card-dark text-accent-rose dark:text-accent-rose-dark shadow-sm border border-border-soft/60 dark:border-border-soft-dark/60">
                <Calendar size={12} />
                {countdownText}
              </span>
            ) : isOwner ? (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/70 dark:bg-surface-card-dark/70 text-ink-muted hover:text-accent-rose transition-colors"
              >
                <Calendar size={12} />
                + Добавить дату
              </button>
            ) : null}
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-3.5 pt-3 border-t border-border-soft/80 dark:border-border-soft-dark/80 flex items-center justify-between text-xs">
          {isOwner ? (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-accent-rose/10 text-accent-rose dark:text-accent-rose-dark">
                  <GiftIcon size={13} />
                </span>
                <span className="font-semibold text-ink-light dark:text-ink-dark text-[11px]">
                  Подарков: <b>{stats.totalGifts}</b> · Забронировано: <b>{stats.bookedGifts}</b>
                </span>
              </div>
              <span className="text-[10px] font-bold text-accent-rose dark:text-accent-rose-dark flex items-center gap-1">
                <Sparkles size={11} />
                Сюрприз включён 🤫
              </span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between text-ink-muted dark:text-ink-muted-dark text-[11px]">
              <span>Выбирай подарок для друга 🎁</span>
              <span className="font-bold text-ink-light dark:text-ink-dark">
                {stats.totalGifts} {stats.totalGifts === 1 ? 'желание' : stats.totalGifts > 1 && stats.totalGifts < 5 ? 'желания' : 'желаний'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
