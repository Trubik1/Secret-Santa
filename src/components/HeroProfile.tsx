import React from 'react'
import { UserProfile } from '../types'
import { Plus, Share2, Calendar, Palette } from 'lucide-react'
import { TelegramStarIcon } from './PremiumModal'

interface HeroProfileProps {
  profile: UserProfile
  isOwner: boolean
  totalGifts?: number
  onOpenShare: () => void
  onOpenAdd?: () => void
  onOpenCustomization?: () => void
  onOpenPremiumModal?: (reason: 'limit' | 'cover' | 'general') => void
  onHaptic?: () => void
}

export const HeroProfile: React.FC<HeroProfileProps> = ({
  profile,
  isOwner,
  totalGifts = 0,
  onOpenShare,
  onOpenAdd,
  onOpenCustomization,
  onOpenPremiumModal,
  onHaptic,
}) => {
  const [imgFailed, setImgFailed] = React.useState(false)
  const initial = (profile.firstName || 'А')[0].toUpperCase()

  // Countdown if eventDate is set
  const countdownText = React.useMemo(() => {
    if (!profile.eventDate) return null
    const target = new Date(profile.eventDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)

    const diffMs = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Сегодня! 🎉'
    if (diffDays === 1) return 'Остался 1 день'
    if (diffDays > 1 && diffDays < 5) return `Осталось ${diffDays} дня`
    if (diffDays >= 5) return `Осталось ${diffDays} дней`
    return null
  }, [profile.eventDate])

  const handleAddClick = () => {
    onHaptic?.()
    // Free limit: 5 gifts maximum
    if (!profile.isPremium && totalGifts >= 5) {
      onOpenPremiumModal?.('limit')
      return
    }
    onOpenAdd?.()
  }

  return (
    <div className="w-full pt-2 pb-1 select-none">
      {/* Giftly Minimalist Hero Banner with Optional Custom Cover */}
      <div className="relative overflow-hidden bg-[#161618] rounded-3xl p-4 sm:p-5 border border-white/10 shadow-2xl min-h-[140px] flex flex-col justify-between">
        {/* Custom Cover Photo Background */}
        {profile.coverUrl ? (
          <>
            <img
              src={profile.coverUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            {/* Rich gradient overlay so text is 100% readable and contrasty */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-[#161618]/70 to-black/30 pointer-events-none" />
          </>
        ) : (
          /* Subtle default dark gradient overlay */
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-white/[0.03] pointer-events-none" />
        )}

        {/* Top Row: Bot Name + Avatar & Actions */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isOwner ? (
                <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                  Giftly • @giftly_me_bot
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <span>👀</span>
                  <span>Вишлист друга</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate flex items-center gap-1.5">
                <span>{isOwner ? (profile.firstName || 'Мой вишлист') : `Вишлист: ${profile.firstName || 'друга'}`} {isOwner ? (profile.lastName || '') : ''}</span>
                {profile.isPremium && (
                  <TelegramStarIcon size={18} className="inline-block shrink-0 -mt-0.5" />
                )}
              </h1>

              {countdownText && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-zinc-300 border border-white/10 shrink-0">
                  <Calendar size={10} />
                  <span>{countdownText}</span>
                </span>
              )}
            </div>

            {!isOwner && (
              <p className="text-[11px] text-zinc-400 mt-1 font-medium">
                Бронируйте подарки сюрпризом или скидывайтесь с друзьями 🤝
              </p>
            )}
          </div>

          {/* User Avatar & Customization Card + Share Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onHaptic?.()
                onOpenShare()
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors active:scale-95 border border-white/10 cursor-pointer"
              title="Поделиться вишлистом"
            >
              <Share2 size={15} />
            </button>

            {/* Avatar / Customization Button */}
            {isOwner ? (
              <button
                type="button"
                onClick={() => {
                  onHaptic?.()
                  onOpenCustomization?.()
                }}
                className="relative group p-0.5 rounded-full transition-transform active:scale-95 cursor-pointer focus:outline-none"
                title="Оформление и кастомизация вишлиста"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/25 group-hover:ring-amber-400/60 bg-zinc-800 flex items-center justify-center shrink-0 transition-all shadow-md">
                  {profile.photoUrl && !imgFailed ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.firstName}
                      className="w-full h-full object-cover"
                      onError={() => setImgFailed(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-700 text-white flex items-center justify-center font-black text-sm select-none">
                      {initial}
                    </div>
                  )}
                </div>

                {/* Subtle palette badge on avatar */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#161618] border border-white/20 flex items-center justify-center text-amber-300 shadow-sm">
                  <Palette size={9} />
                </div>
              </button>
            ) : (
              <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/20 bg-zinc-800 flex items-center justify-center shrink-0">
                {profile.photoUrl && !imgFailed ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.firstName}
                    className="w-full h-full object-cover"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-700 text-white flex items-center justify-center font-black text-sm select-none">
                    {initial}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Clean prominent "+ Добавить желание" button */}
        {isOwner && onOpenAdd && (
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            <button
              onClick={handleAddClick}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md cursor-pointer"
            >
              <Plus size={15} strokeWidth={3} />
              <span>Добавить желание</span>
            </button>

            {!profile.isPremium && totalGifts >= 4 && (
              <span className="text-[10px] font-bold text-zinc-400 px-2 shrink-0">
                {totalGifts}/5 желаний
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
