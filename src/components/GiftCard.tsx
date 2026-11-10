import React from 'react'
import { Gift } from '../types'
import { CurrencyMode, formatPrice } from '../utils/currency'
import { Gift as GiftIcon, Users, Lock, Check } from 'lucide-react'

interface GiftCardProps {
  gift: Gift
  isOwner: boolean
  currencyMode: CurrencyMode
  onSelect: (gift: Gift) => void
  onHaptic?: () => void
}

export const GiftCard: React.FC<GiftCardProps> = ({
  gift,
  isOwner,
  currencyMode,
  onSelect,
  onHaptic,
}) => {
  const priceText = formatPrice(gift.price, currencyMode)

  const priorityMeta = React.useMemo(() => {
    switch (gift.priority) {
      case 3:
        return {
          label: 'Мечта ✨',
          style: 'bg-[#241920] text-[#d98aab] border-[#c4457b]/30',
        }
      case 2:
        return {
          label: 'Очень хочу 🔥',
          style: 'bg-amber-950/40 text-amber-400 border-amber-600/30',
        }
      default:
        return {
          label: 'Хочу 👍',
          style: 'bg-emerald-950/40 text-emerald-400 border-emerald-600/30',
        }
    }
  }, [gift.priority])

  // Crowdfunding progress for friends
  const pledged = gift.totalPledged || 0
  const progressPercent = gift.price > 0 && pledged > 0 ? Math.min(100, Math.round((pledged / gift.price) * 100)) : 0

  return (
    <div
      onClick={() => {
        onHaptic?.()
        onSelect(gift)
      }}
      className="group cursor-pointer rounded-2xl bg-surface-card dark:bg-[#17171a] border border-border-soft dark:border-[#34252f] hover:border-[#c4457b]/60 transition-all duration-200 overflow-hidden flex flex-col active:scale-[0.97] shadow-sm select-none"
    >
      {/* 100% Clean Image - NO badges on top of the photo */}
      <div className="relative w-full aspect-[4/5] bg-surface-soft dark:bg-zinc-900 overflow-hidden">
        {gift.imageUrl ? (
          <img
            src={gift.imageUrl}
            alt={gift.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#c4457b]/40">
            <GiftIcon size={40} strokeWidth={1.5} />
          </div>
        )}

        {/* For friends only: subtle booking pill at the bottom if taken */}
        {!isOwner && gift.isBooked && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-end p-2">
            <span className="w-full py-1 px-2 rounded-xl bg-black/80 border border-white/20 text-white text-[10px] font-bold text-center truncate flex items-center justify-center gap-1 shadow-lg">
              {gift.isBookedByMe ? (
                <>
                  <Check size={11} className="text-emerald-400" />
                  <span>Вы дарите</span>
                </>
              ) : (
                <>
                  <Lock size={11} className="text-amber-400" />
                  <span>Забронировано</span>
                </>
              )}
            </span>
          </div>
        )}

        {/* For friends only: chip-in badge if crowdfunding in progress */}
        {!isOwner && !gift.isBooked && pledged > 0 && (
          <div className="absolute bottom-2 left-2 right-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#c4457b] text-white text-[9px] font-black flex items-center gap-1 w-fit shadow-md">
              <Users size={10} />
              <span>Сбор {progressPercent}%</span>
            </span>
          </div>
        )}
      </div>

      {/* Info: Title, and Price + Priority row */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <h3 className="text-xs font-bold text-ink-light dark:text-zinc-100 line-clamp-2 leading-snug">
          {gift.title}
        </h3>

        {/* PRICE AND PRIORITY NEXT TO EACH OTHER */}
        <div className="mt-2.5 flex items-center justify-between gap-1.5 flex-wrap">
          <div className="text-xs sm:text-sm font-black text-[#c4457b]">
            {priceText}
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${priorityMeta.style}`}
          >
            {priorityMeta.label}
          </span>
        </div>
      </div>
    </div>
  )
}
