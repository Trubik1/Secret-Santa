import React from 'react'
import { Gift } from '../types'
import { CurrencyMode, formatPrice } from '../utils/currency'
import { Users, Sparkles, CheckCircle2 } from 'lucide-react'

interface GroupCollectionCardProps {
  gift: Gift
  currencyMode: CurrencyMode
  onSelect: (gift: Gift) => void
  onPledge: (gift: Gift) => void
  onHaptic?: () => void
}

export const GroupCollectionCard: React.FC<GroupCollectionCardProps> = ({
  gift,
  currencyMode,
  onSelect,
  onPledge,
  onHaptic,
}) => {
  const targetPrice = gift.targetAmount > 0 ? gift.targetAmount : gift.price
  const pledged = gift.totalPledged || 0
  const progressPercent = targetPrice > 0 ? Math.min(100, Math.round((pledged / targetPrice) * 100)) : 0
  const isGoalReached = progressPercent >= 100 || gift.isBooked

  const pledges = gift.pledges || []

  return (
    <div
      onClick={() => {
        onHaptic?.()
        onSelect(gift)
      }}
      className="col-span-full group cursor-pointer rounded-3xl bg-gradient-to-b from-[#1d1d21] to-[#151517] border border-white/15 p-4 sm:p-5 shadow-2xl relative overflow-hidden select-none active:scale-[0.99] transition-all hover:border-white/30"
    >
      {/* Subtle ambient glow in background */}
      <div className={`absolute -right-10 -top-10 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
        isGoalReached ? 'bg-emerald-500/10' : 'bg-amber-500/10'
      }`} />

      {/* Top Badge & Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          {isGoalReached ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm">
              <CheckCircle2 size={13} />
              <span>Цель достигнута! 100%</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm animate-pulse">
              <Sparkles size={13} />
              <span>🔥 Идёт сбор с друзьями</span>
            </span>
          )}
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Совместный подарок
        </span>
      </div>

      {/* Main Content: Image & Info */}
      <div className="relative z-10 flex gap-3.5 items-center">
        {gift.imageUrl ? (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-white font-black text-2xl">
            🎁
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-white text-xs sm:text-sm font-bold line-clamp-2 leading-snug">
            {gift.title}
          </h3>

          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-white font-black text-sm sm:text-base tracking-tight">
              {formatPrice(targetPrice, currencyMode)}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">
              (общая стоимость)
            </span>
          </div>

          <div className="mt-1 text-[11px] font-bold text-zinc-300">
            Собрано: <span className="text-white font-black">{formatPrice(pledged, currencyMode)}</span>
            <span className="text-zinc-500 ml-1">({progressPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 mt-3.5">
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden ring-1 ring-white/5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isGoalReached ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-400 to-white'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Participants list with usernames */}
      {pledges.length > 0 && (
        <div className="relative z-10 mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Users size={12} />
              <span>Уже скинулись ({pledges.length}):</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {pledges.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[11px] text-zinc-200"
              >
                <span className="font-bold text-white">
                  {p.userUsername ? `@${p.userUsername}` : p.userName}
                </span>
                <span className="text-zinc-400 text-[10px] font-medium">
                  {formatPrice(p.amount, currencyMode)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Button */}
      <div className="relative z-10 mt-3.5 pt-2">
        {isGoalReached ? (
          <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 size={15} />
            <span>Вся сумма собрана! Готовимся дарить 🎉</span>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onHaptic?.()
              onPledge(gift)
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users size={15} />
            <span>Добавить свою долю в подарок 🤝</span>
          </button>
        )}
      </div>
    </div>
  )
}
