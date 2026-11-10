import React from 'react'
import { UserProfile } from '../types'
import { Calendar, Share2 } from 'lucide-react'

interface HeroProfileProps {
  profile: UserProfile
  isOwner: boolean
  onOpenShare: () => void
  onHaptic?: () => void
}

export const HeroProfile: React.FC<HeroProfileProps> = ({
  profile,
  isOwner,
  onOpenShare,
  onHaptic,
}) => {
  // Calculate countdown days (if eventDate is set)
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
    return null
  }, [profile.eventDate])

  const [imgFailed, setImgFailed] = React.useState(false)
  const initial = (profile.firstName || 'А')[0].toUpperCase()

  return (
    <div className="w-full pt-3 pb-2 px-4">
      {/* Sleek, Modern Profile Banner */}
      <div className="relative overflow-hidden bg-surface-card dark:bg-[#17171a] rounded-3xl p-4 sm:p-5 border border-border-soft dark:border-[#34252f] shadow-card">
        {/* Subtle top ambient glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-accent-rose/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Real Telegram User Avatar or Initials Gradient */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-accent-rose/30 shadow-sm bg-surface-soft dark:bg-zinc-800 flex items-center justify-center">
                {profile.photoUrl && !imgFailed ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.firstName}
                    className="w-full h-full object-cover"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-accent-rose to-accent-pink text-white flex items-center justify-center font-black text-xl select-none">
                    {initial}
                  </div>
                )}
              </div>
              {isOwner && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-[#17171a] rounded-full p-0.5 shadow-sm">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                </div>
              )}
            </div>

            {/* Name, username & optional event */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <h1 className="text-base font-black tracking-tight text-ink-light dark:text-ink-dark truncate">
                  {profile.firstName} {profile.lastName || ''}
                </h1>
                {profile.username && (
                  <span className="text-[11px] font-semibold text-ink-muted dark:text-ink-muted-dark">
                    @{profile.username}
                  </span>
                )}
              </div>

              {/* Event title & countdown badge (only if set) */}
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                {profile.eventTitle ? (
                  <span className="text-xs font-bold text-accent-rose truncate max-w-[200px]">
                    {profile.eventTitle}
                  </span>
                ) : null}
                {countdownText && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-surface-soft dark:bg-[#241920] text-ink-light dark:text-ink-dark border border-border-soft/60 dark:border-[#34252f]">
                    <Calendar size={10} className="text-accent-rose" />
                    <span>{countdownText}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Clean Action Button: Share only */}
          <div className="flex items-center shrink-0 ml-2">
            <button
              onClick={() => {
                onHaptic?.()
                onOpenShare()
              }}
              className="p-2.5 rounded-full bg-surface-soft dark:bg-[#241920] text-ink-light dark:text-ink-dark hover:text-accent-rose transition-colors active-press shadow-sm border border-border-soft/60 dark:border-[#34252f]"
              title="Поделиться вишлистом"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
