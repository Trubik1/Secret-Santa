import React from 'react'
import { Gift } from '../types'
import { CurrencyMode, formatPrice } from '../utils/currency'
import { Gift as GiftIcon, Check, Lock, Pin } from 'lucide-react'

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

  // Priority badge meta: placed strictly in the price row
  const priorityMeta = React.useMemo(() => {
    switch (gift.priority) {
      case 3:
        return { label: 'Мечта', style: 'bg-white/10 text-white border-white/20' }
      case 2:
        return { label: 'Очень хочу', style: 'bg-zinc-800 text-zinc-300 border-white/10' }
      default:
        return { label: 'Хочу', style: 'bg-zinc-800/80 text-zinc-400 border-white/5' }
    }
  }, [gift.priority])

  return (
    <div
      onClick={() => {
        onHaptic?.()
        onSelect(gift)
      }}
      className="group cursor-pointer rounded-2xl bg-[#161618] border border-white/5 overflow-hidden flex flex-col hover:border-zinc-700/60 transition-all select-none active:scale-[0.98] shadow-md"
    >
      {/* Large 1:1 Clean Image - No floating badges */}
      <div className="relative w-full aspect-square bg-zinc-900 overflow-hidden">
        {/* Pinned Dream #1 Badge */}
        {gift.isPinned && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[9px] font-black flex items-center gap-1 shadow-md border border-amber-300/40">
            <Pin size={10} className="fill-black rotate-45" />
            <span>PIN</span>
          </div>
        )}

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
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <GiftIcon size={32} />
          </div>
        )}

        {/* Booked overlay */}
        {!isOwner && gift.isBooked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-3">
            <span className="py-1 px-2.5 rounded-xl bg-zinc-800 text-zinc-200 border border-white/10 text-[11px] font-bold flex items-center gap-1 shadow-lg">
              {gift.isBookedByMe ? (
                <>
                  <Check size={12} className="text-white" />
                  <span>Вы дарите</span>
                </>
              ) : (
                <>
                  <Lock size={12} className="text-zinc-400" />
                  <span>Забронировано</span>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Info: Title, Price + Priority Badge (Strictly on one line without wrapping) */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-white text-xs font-semibold line-clamp-2 leading-snug">
            {gift.title}
          </h3>

          {/* Price & Priority Row: strictly single line, never wraps, clean fit */}
          <div className="mt-2 flex items-center justify-between gap-1 flex-nowrap min-w-0">
            <span className="text-white font-extrabold text-xs sm:text-[13px] whitespace-nowrap shrink-0 tracking-tight">
              {priceText}
            </span>

            {/* Priority badge right next to price - strictly single line, compact fit */}
            <span
              className={`shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded text-[8px] sm:text-[8.5px] font-bold border uppercase tracking-tight leading-none ${priorityMeta.style}`}
            >
              {priorityMeta.label}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-2.5">
          {gift.isBooked ? (
            <div className="w-full py-1.5 rounded-xl bg-zinc-800/80 text-zinc-400 text-[11px] font-bold text-center border border-white/5">
              ✓ Занято
            </div>
          ) : isOwner ? (
            <div className="w-full py-1.5 rounded-xl bg-white/10 text-zinc-300 text-[11px] font-bold text-center border border-white/5 group-hover:bg-white/20 transition-colors">
              Подробнее
            </div>
          ) : (
            <div className="w-full py-1.5 rounded-xl bg-white text-black text-[11px] font-black text-center shadow-sm group-hover:bg-zinc-200 transition-colors">
              Подарить ➔
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
