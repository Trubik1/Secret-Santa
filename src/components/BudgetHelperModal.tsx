import React, { useState } from 'react'
import { Gift } from '../types'
import { X, Sparkles, Gift as GiftIcon, Users, Check, ArrowRight } from 'lucide-react'
import { formatDualPrice, formatByn } from '../utils/currency'

interface BudgetHelperModalProps {
  isOpen: boolean
  gifts: Gift[]
  isOwner: boolean
  onClose: () => void
  onSelectGift: (gift: Gift) => void
  onHaptic: () => void
}

export const BudgetHelperModal: React.FC<BudgetHelperModalProps> = ({
  isOpen,
  gifts,
  isOwner,
  onClose,
  onSelectGift,
  onHaptic,
}) => {
  const [budgetLimit, setBudgetLimit] = useState<number>(5000)
  const [prefType, setPrefType] = useState<'all' | 'solo' | 'crowdfund'>('all')

  if (!isOpen) return null

  // Available free gifts matching the budget criteria
  const availableGifts = gifts.filter((g) => {
    if (isOwner) return true
    if (g.isBooked && !g.isBookedByMe) return false

    if (prefType === 'solo' && g.isCrowdfund) return false
    if (prefType === 'crowdfund' && !g.isCrowdfund) return false

    if (g.isCrowdfund) {
      // For crowdfunding, remaining target amount should be open
      const remaining = (g.targetAmount || g.price) - (g.totalPledged || 0)
      return remaining > 0
    }

    return g.price <= budgetLimit || budgetLimit >= 30000
  })

  // Pick best recommended gift
  const recommendedGift = availableGifts.length > 0
    ? availableGifts.sort((a, b) => b.priority - a.priority)[0]
    : null

  const handlePick = (gift: Gift) => {
    onHaptic()
    onSelectGift(gift)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-bg-light dark:bg-bg-dark rounded-t-32 sm:rounded-32 p-6 shadow-2xl border border-border-soft dark:border-border-soft-dark max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-border-soft-dark">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-ink-light dark:text-ink-dark">
                Помощник с выбором
              </h2>
              <p className="text-[11px] text-ink-muted">
                Подберем идеальный подарок под ваш бюджет
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-card dark:hover:bg-surface-card-dark text-ink-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mascot badge */}
        <div className="mt-4 p-3.5 rounded-24 bg-surface-soft dark:bg-surface-soft-dark border border-border-soft dark:border-border-soft-dark flex items-center gap-3">
          <img
            src="/stickers/bunny-heart.webp"
            alt="Bunny Helper"
            className="w-14 h-14 object-contain shrink-0 drop-shadow-sm"
          />
          <div>
            <p className="text-xs font-extrabold text-ink-light dark:text-ink-dark">
              Не знаете, что подарить?
            </p>
            <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark leading-snug mt-0.5">
              Укажите желаемую сумму, и мы покажем самые заветные желания виновника торжества!
            </p>
          </div>
        </div>

        {/* Budget selector */}
        <div className="mt-5">
          <div className="flex justify-between items-baseline mb-2">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Ваш бюджет
            </label>
            <div className="text-right">
              <span className="text-sm font-extrabold text-accent-rose">
                {budgetLimit >= 30000 ? 'Любой бюджет' : `до ${budgetLimit.toLocaleString('ru-RU')} ₽`}
              </span>
              {budgetLimit < 30000 && (
                <span className="text-xs font-bold text-ink-muted block">
                  (~{formatByn(budgetLimit)})
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[2000, 5000, 10000, 30000].map((val) => {
              const isSelected = budgetLimit === val
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    onHaptic()
                    setBudgetLimit(val)
                  }}
                  className={`py-2 px-1 rounded-2xl text-xs font-bold transition-all active-press border ${
                    isSelected
                      ? 'bg-accent-rose text-white border-accent-rose shadow-sm'
                      : 'bg-surface-card dark:bg-surface-card-dark text-ink-muted border-border-soft dark:border-border-soft-dark'
                  }`}
                >
                  {val >= 30000 ? 'Любой' : `${val / 1000}k ₽`}
                  {val < 30000 && (
                    <span className="block text-[9px] opacity-75 font-normal">
                      ~{formatByn(val)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Preference type */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
            Формат подарка
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'all' as const, label: 'Все варианты', icon: <GiftIcon size={12} /> },
              { id: 'solo' as const, label: 'Подарю сам 🎁', icon: <Check size={12} /> },
              { id: 'crowdfund' as const, label: 'Скинуться 🤝', icon: <Users size={12} /> },
            ].map((p) => {
              const isSelected = prefType === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onHaptic()
                    setPrefType(p.id)
                  }}
                  className={`py-2 px-1.5 rounded-2xl text-[11px] font-bold transition-all active-press flex items-center justify-center gap-1 border ${
                    isSelected
                      ? 'bg-accent-rose text-white border-accent-rose shadow-sm'
                      : 'bg-surface-card dark:bg-surface-card-dark text-ink-muted border-border-soft dark:border-border-soft-dark'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Matching count & Best recommendation */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-ink-muted">
              Подходящих подарков: <b>{availableGifts.length}</b>
            </span>
          </div>

          {recommendedGift ? (
            <div
              onClick={() => handlePick(recommendedGift)}
              className="p-3.5 rounded-24 bg-surface-card dark:bg-surface-card-dark border-2 border-accent-rose/40 hover:border-accent-rose cursor-pointer transition-all active-press shadow-md flex items-center gap-3"
            >
              {recommendedGift.imageUrl ? (
                <img
                  src={recommendedGift.imageUrl}
                  alt={recommendedGift.title}
                  className="w-14 h-14 rounded-2xl object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-accent-rose/10 text-accent-rose flex items-center justify-center shrink-0">
                  <GiftIcon size={22} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-accent-rose uppercase tracking-wider block">
                  Топ рекомендация ⭐
                </span>
                <h4 className="text-xs font-bold text-ink-light dark:text-ink-dark truncate">
                  {recommendedGift.title}
                </h4>
                <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
                  <span className="text-xs font-extrabold text-accent-rose">
                    {formatDualPrice(recommendedGift.price).primary}
                  </span>
                  <span className="text-[10px] font-bold text-ink-muted">
                    {formatDualPrice(recommendedGift.price).secondary}
                  </span>
                  {recommendedGift.isCrowdfund ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      · Складчина
                    </span>
                  ) : null}
                </div>
              </div>
              <span className="p-2 rounded-full bg-accent-rose text-white shrink-0">
                <ArrowRight size={14} />
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-24 bg-surface-card dark:bg-surface-card-dark text-center text-xs text-ink-muted border border-border-soft dark:border-border-soft-dark">
              Нет подарков под заданный бюджет. Попробуйте увеличить сумму!
            </div>
          )}
        </div>

        {/* Other matches preview */}
        {availableGifts.length > 1 && (
          <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
            {availableGifts.slice(1, 4).map((g) => (
              <div
                key={g.id}
                onClick={() => handlePick(g)}
                className="p-2.5 rounded-2xl bg-surface-soft dark:bg-surface-soft-dark hover:bg-border-soft/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <span className="font-semibold text-ink-light dark:text-ink-dark truncate max-w-[200px]">
                  {g.title}
                </span>
                <span className="font-extrabold text-accent-rose shrink-0">
                  {formatDualPrice(g.price).fullText}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
