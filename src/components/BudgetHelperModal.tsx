import React, { useState } from 'react'
import { Gift } from '../types'
import { X, Sparkles, ArrowRight } from 'lucide-react'
import { CurrencyMode, formatPrice, getCurrencySymbol } from '../utils/currency'

interface BudgetHelperModalProps {
  isOpen: boolean
  gifts: Gift[]
  isOwner: boolean
  currencyMode: CurrencyMode
  onClose: () => void
  onSelectGift: (gift: Gift) => void
  onHaptic: () => void
}

export const BudgetHelperModal: React.FC<BudgetHelperModalProps> = ({
  isOpen,
  gifts,
  isOwner,
  currencyMode,
  onClose,
  onSelectGift,
  onHaptic,
}) => {
  const [budgetLimitInRub, setBudgetLimitInRub] = useState<number>(5000)

  if (!isOpen) return null

  const currSymbol = getCurrencySymbol(currencyMode)

  // Available free gifts matching the budget criteria
  const availableGifts = gifts.filter((g) => {
    if (isOwner) return true
    if (g.isBooked && !g.isBookedByMe) return false
    return g.price <= budgetLimitInRub || budgetLimitInRub >= 30000
  })

  // Pick best recommended gift
  const recommendedGift =
    availableGifts.length > 0
      ? [...availableGifts].sort((a, b) => (b.priority || 1) - (a.priority || 1))[0]
      : null

  const handlePick = (gift: Gift) => {
    onHaptic()
    onSelectGift(gift)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-surface-card dark:bg-[#17171a] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-border-soft dark:border-[#34252f] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#34252f]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose">
              <Sparkles size={18} />
            </span>
            <h2 className="text-base font-black text-ink-light dark:text-white">
              Подбор по бюджету
            </h2>
          </div>
          <button
            onClick={() => {
              onHaptic()
              onClose()
            }}
            className="p-1.5 rounded-full text-ink-muted hover:text-ink-light dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Budget selector */}
        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-2">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Ваш бюджет ({currSymbol})
            </label>
            <span className="text-sm font-black text-[#c4457b]">
              {budgetLimitInRub >= 30000 ? 'Любой бюджет' : `до ${formatPrice(budgetLimitInRub, currencyMode)}`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[2000, 5000, 10000, 30000].map((val) => {
              const isSelected = budgetLimitInRub === val
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    onHaptic()
                    setBudgetLimitInRub(val)
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all active-press border ${
                    isSelected
                      ? 'bg-[#c4457b] text-white border-[#c4457b] shadow-sm font-black'
                      : 'bg-surface-soft dark:bg-zinc-800 text-ink-muted border-border-soft dark:border-zinc-700'
                  }`}
                >
                  {val >= 30000 ? 'Любой' : formatPrice(val, currencyMode)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Recommended Gift Highlight */}
        {recommendedGift && (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-[#241920] to-[#17171a] border-2 border-[#c4457b]/40">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#d98aab] mb-2">
              <Sparkles size={14} />
              <span>Лучшая рекомендация:</span>
            </div>
            <div className="flex gap-3 items-center">
              {recommendedGift.imageUrl ? (
                <img
                  src={recommendedGift.imageUrl}
                  alt={recommendedGift.title}
                  className="w-16 h-16 rounded-xl object-cover ring-1 ring-[#c4457b]/40 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
                  🎁
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{recommendedGift.title}</h4>
                <div className="text-sm font-black text-[#c4457b] mt-0.5">
                  {formatPrice(recommendedGift.price, currencyMode)}
                </div>
              </div>
            </div>
            <button
              onClick={() => handlePick(recommendedGift)}
              className="mt-3 w-full py-2.5 rounded-xl bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-bold flex items-center justify-center gap-1.5 active-press transition-all"
            >
              <span>Выбрать этот подарок</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* List of matching gifts */}
        <div className="mt-4">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-ink-muted mb-2">
            Подходящие желания ({availableGifts.length})
          </h4>
          {availableGifts.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableGifts.map((g) => (
                <div
                  key={g.id}
                  onClick={() => handlePick(g)}
                  className="p-2.5 rounded-xl bg-surface-soft dark:bg-zinc-800/60 border border-border-soft dark:border-zinc-700/60 hover:border-[#c4457b] cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {g.imageUrl ? (
                      <img src={g.imageUrl} alt={g.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-xs shrink-0">
                        🎁
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-ink-light dark:text-white truncate">
                        {g.title}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {g.priority === 3 ? 'Мечта ✨' : 'Желание'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-[#c4457b] shrink-0 ml-2">
                    {formatPrice(g.price, currencyMode)} ›
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-muted text-center py-4">
              В этом диапазоне цен пока нет свободных подарков.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
