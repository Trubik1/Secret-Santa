import React from 'react'
import { UserProfile, WishlistStats } from '../types'
import { Calendar, Edit3, Gift as GiftIcon, Sparkles } from 'lucide-react'

interface HeroProfileProps {
  profile: UserProfile
  isOwner: boolean
  stats: WishlistStats
  onEditProfile: () => void
}

export const HeroProfile: React.FC<HeroProfileProps> = ({
  profile,
  isOwner,
  stats,
  onEditProfile,
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

  return (
    <div className="w-full pt-4 pb-6 px-4">
      {/* Bento Profile Card */}
      <div className="relative overflow-hidden bg-surface-soft dark:bg-surface-soft-dark rounded-32 p-6 transition-all duration-300 border border-border-soft dark:border-border-soft-dark shadow-subtle">
        
        {/* Decorative subtle ambient circle */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-accent-pink/15 blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {profile.photoUrl && !imgFailed ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.firstName}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-white dark:ring-surface-card-dark shadow-md"
                  onError={() => setImgFailed(true)}
                />
              ) : !imgFailed ? (
                <img
                  src="/avatar.png"
                  alt={profile.firstName}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-white dark:ring-surface-card-dark shadow-md bg-white dark:bg-surface-card-dark"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent-rose to-accent-pink text-white flex items-center justify-center font-bold text-2xl shadow-md ring-4 ring-white dark:ring-surface-card-dark">
                  {initial}
                </div>
              )}
              {isOwner && (
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-surface-card-dark rounded-full p-1 shadow-sm">
                  <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-surface-card-dark" />
                </div>
              )}
            </div>

            {/* Name & Username */}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-extrabold tracking-tight text-ink-light dark:text-ink-dark">
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

          {/* Edit Button for Owner */}
          {isOwner && (
            <button
              onClick={onEditProfile}
              className="p-2.5 rounded-full bg-white/80 dark:bg-surface-card-dark/80 text-ink-muted dark:text-ink-muted-dark hover:text-accent-rose transition-colors active-press shadow-sm"
              title="Редактировать событие"
            >
              <Edit3 size={18} />
            </button>
          )}
        </div>

        {/* Event Title & Countdown */}
        <div className="mt-5 relative z-10">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-ink-light dark:text-ink-dark flex items-center gap-2">
              <span>{profile.eventTitle || 'Мой День Рождения 🎂'}</span>
            </h2>

            {/* Countdown pill */}
            {countdownText ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-surface-card-dark text-accent-rose dark:text-accent-rose-dark shadow-sm border border-border-soft/60 dark:border-border-soft-dark/60">
                <Calendar size={13} />
                {countdownText}
              </span>
            ) : isOwner ? (
              <button
                onClick={onEditProfile}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/70 dark:bg-surface-card-dark/70 text-ink-muted hover:text-accent-rose transition-colors"
              >
                <Calendar size={13} />
                + Добавить дату
              </button>
            ) : null}
          </div>
        </div>

        {/* Surprise Mode stats bar */}
        <div className="mt-4 pt-3.5 border-t border-border-soft/80 dark:border-border-soft-dark/80 flex items-center justify-between text-xs">
          {isOwner ? (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-accent-rose/10 text-accent-rose dark:text-accent-rose-dark">
                  <GiftIcon size={14} />
                </span>
                <span className="font-semibold text-ink-light dark:text-ink-dark">
                  Подарков: <b>{stats.totalGifts}</b> · Забронировано: <b>{stats.bookedGifts}</b>
                </span>
              </div>
              <span className="text-[11px] font-medium text-accent-rose dark:text-accent-rose-dark flex items-center gap-1">
                <Sparkles size={12} />
                Сюрприз сохранен
              </span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between text-ink-muted dark:text-ink-muted-dark">
              <span>Выбирай подарок или скидывайся вместе с друзьями!</span>
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
