import React from 'react'
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

export const HeroProfile: React.FC<HeroProfileProps> = ({
  profile,
  isOwner,
  stats,
  theme,
  onOpenShare,
  onOpenSettings,
  onHaptic,
}) => {
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

  const cardRadius = theme?.cardRadius || 'rounded-24'
  const cardBorder = theme?.borderClass || 'border border-border-soft dark:border-border-soft-dark'
  const headingFont = theme?.headingFont || 'font-extrabold'

  return (
    <div className="w-full pt-3 pb-2 px-4">
      {/* Sleek, Modern Profile Banner without any blocking stickers */}
      <div
        className={`relative overflow-hidden bg-surface-card dark:bg-surface-card-dark ${cardRadius} p-4 sm:p-5 transition-all duration-300 ${cardBorder} shadow-card`}
      >
        {/* Subtle top ambient glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-accent-rose/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-accent-rose/30 shadow-sm bg-surface-soft dark:bg-zinc-800 flex items-center justify-center">
                {profile.photoUrl && !imgFailed ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.firstName}
                    className="w-full h-full object-cover"
                    onError={() => setImgFailed(true)}
                  />
                ) : !imgFailed ? (
                  <img
                    src="/avatar.png"
                    alt={profile.firstName}
                    className="w-full h-full object-cover"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-accent-rose to-accent-pink text-white flex items-center justify-center font-bold text-lg">
                    {initial}
                  </div>
                )}
              </div>
              {isOwner && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-surface-card-dark rounded-full p-0.5 shadow-sm">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                </div>
              )}
            </div>

            {/* Name, username & event */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <h1 className={`text-base ${headingFont} tracking-tight text-ink-light dark:text-ink-dark truncate`}>
                  {profile.firstName} {profile.lastName || ''}
                </h1>
                {profile.username && (
                  <span className="text-[11px] font-semibold text-ink-muted dark:text-ink-muted-dark">
                    @{profile.username}
                  </span>
                )}
              </div>

              {/* Event title & countdown badge */}
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-accent-rose truncate max-w-[180px]">
                  {profile.eventTitle || 'Мой День Рождения 🎂'}
                </span>
                {countdownText ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-surface-soft dark:bg-surface-soft-dark text-ink-light dark:text-ink-dark border border-border-soft/60 dark:border-border-soft-dark/60">
                    <Calendar size={10} className="text-accent-rose" />
                    <span>{countdownText}</span>
                  </span>
                ) : isOwner ? (
                  <button
                    onClick={() => {
                      onHaptic?.()
                      onOpenSettings()
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-ink-muted hover:text-accent-rose transition-colors"
                  >
                    + Указать дату
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Clean Action Buttons: Share & Settings */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={() => {
                onHaptic?.()
                onOpenShare()
              }}
              className="p-2.5 rounded-full bg-surface-soft dark:bg-surface-soft-dark text-ink-light dark:text-ink-dark hover:text-accent-rose transition-colors active-press shadow-sm border border-border-soft/60 dark:border-border-soft-dark/60"
              title="Поделиться вишлистом"
            >
              <Share2 size={16} />
            </button>

            <button
              onClick={() => {
                onHaptic?.()
                onOpenSettings()
              }}
              className="p-2.5 rounded-full bg-surface-soft dark:bg-surface-soft-dark text-ink-light dark:text-ink-dark hover:text-accent-rose transition-colors active-press shadow-sm border border-border-soft/60 dark:border-border-soft-dark/60"
              title="Настройки (валюты, стили, событие)"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Muted stats row */}
        <div className="mt-3 pt-2.5 border-t border-border-soft/60 dark:border-border-soft-dark/60 flex items-center justify-between text-xs">
          {isOwner ? (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GiftIcon size={13} className="text-accent-rose" />
                <span className="font-semibold text-ink-light dark:text-ink-dark text-[11px]">
                  Подарков: <b>{stats.totalGifts}</b>
                  {stats.bookedGifts > 0 && (
                    <span className="text-accent-rose"> · Забронировано: {stats.bookedGifts}</span>
                  )}
                </span>
              </div>
              <span className="text-[10px] font-bold text-accent-rose flex items-center gap-1">
                <Sparkles size={11} />
                Сюрприз включён 🤫
              </span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between text-ink-muted text-[11px]">
              <span>Список желаний виновника торжества 🎁</span>
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
