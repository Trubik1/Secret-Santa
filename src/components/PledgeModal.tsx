import React, { useState } from 'react'
import { Gift } from '../types'
import { X, Users, MessageCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { formatByn, formatRub } from '../utils/currency'

interface PledgeModalProps {
  isOpen: boolean
  gift: Gift | null
  onClose: () => void
  onConfirmPledge: (giftId: string, amount: number) => Promise<void>
  onOpenTelegramLink: (url: string) => void
  onHaptic: () => void
}

export const PledgeModal: React.FC<PledgeModalProps> = ({
  isOpen,
  gift,
  onClose,
  onConfirmPledge,
  onOpenTelegramLink,
  onHaptic,
}) => {
  const [amount, setAmount] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !gift) return null

  const targetAmount = gift.targetAmount > 0 ? gift.targetAmount : gift.price
  const currentTotal = gift.totalPledged || 0
  const remaining = Math.max(0, targetAmount - currentTotal)
  const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((currentTotal / targetAmount) * 100)) : 0

  const handleQuickAdd = (addVal: number) => {
    onHaptic()
    const cur = parseInt(amount, 10) || 0
    setAmount(String(cur + addVal))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(amount, 10)
    if (!num || num <= 0 || isSubmitting) return

    setIsSubmitting(true)
    onHaptic()
    try {
      await onConfirmPledge(gift.id, num)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-bg-light dark:bg-bg-dark rounded-t-32 sm:rounded-32 p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-border-soft dark:border-border-soft-dark"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-soft dark:border-border-soft-dark">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose">
              <Users size={18} />
            </span>
            <h2 className="text-base font-extrabold text-ink-light dark:text-ink-dark">
              Складчина на подарок
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-card dark:hover:bg-surface-card-dark text-ink-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Gift Summary */}
        <div className="mt-4 p-4 rounded-24 bg-surface-soft dark:bg-surface-soft-dark border border-border-soft dark:border-border-soft-dark flex items-center gap-3">
          {gift.imageUrl && (
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-ink-light dark:text-ink-dark truncate">
              {gift.title}
            </h3>
            <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
              <span className="text-sm font-extrabold text-accent-rose">
                Цель: {formatRub(targetAmount)}
              </span>
              <span className="text-xs font-bold text-ink-muted">
                (~{formatByn(targetAmount)})
              </span>
            </div>
          </div>
        </div>

        {/* Progress Display */}
        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-1 text-xs">
            <span className="font-bold text-ink-light dark:text-ink-dark">
              Собрано {currentTotal.toLocaleString('ru-RU')} ₽ (~{formatByn(currentTotal)})
            </span>
            <span className="font-extrabold text-accent-rose">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-border-soft dark:bg-border-soft-dark overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-rose to-accent-pink rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {remaining > 0 && (
            <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark mt-1">
              Осталось: <b>{remaining.toLocaleString('ru-RU')} ₽</b> (~{formatByn(remaining)})
            </p>
          )}
        </div>

        {/* Pledge Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">
                Сумма взноса (₽)
              </label>
              {parseInt(amount, 10) > 0 && (
                <span className="text-xs font-bold text-accent-rose">
                  ≈ {formatByn(parseInt(amount, 10))} бел. руб.
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              required
              placeholder={remaining > 0 ? `Например, ${Math.min(remaining, 2000)}` : '2 000'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-lg font-extrabold text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose"
            />

            {/* Quick amount pills */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {[500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-surface-card dark:bg-surface-card-dark text-ink-muted hover:text-accent-rose border border-border-soft dark:border-border-soft-dark active-press transition-colors"
                >
                  +{val.toLocaleString('ru-RU')} ₽ (~{formatByn(val)})
                </button>
              ))}
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onHaptic()
                    setAmount(String(remaining))
                  }}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-accent-rose/10 text-accent-rose border border-accent-rose/20 active-press transition-colors"
                >
                  Весь остаток ({remaining.toLocaleString('ru-RU')} ₽ · ~{formatByn(remaining)})
                </button>
              )}
            </div>
          </div>

          {/* Direct coordination disclaimer */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed text-[11px]">
              <b>Приложение не принимает онлайн-платежи.</b> Нажимая кнопку, вы подтверждаете участие, и ваш <b>@username</b> станет виден другим участникам сбора для прямого перевода средств.
            </p>
          </div>

          {/* Contributors List */}
          {gift.pledges && gift.pledges.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-2">
                Участники сбора ({gift.pledges.length})
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                {gift.pledges.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft/60 dark:border-border-soft-dark/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink-light dark:text-ink-dark">
                        {p.userName}
                      </span>
                      {p.userUsername && (
                        <button
                          type="button"
                          onClick={() => onOpenTelegramLink(`https://t.me/${p.userUsername}`)}
                          className="text-[11px] font-semibold text-accent-rose hover:underline flex items-center gap-1"
                        >
                          <MessageCircle size={12} />
                          @{p.userUsername}
                        </button>
                      )}
                    </div>
                    <span className="font-extrabold text-ink-light dark:text-ink-dark">
                      {p.amount.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !amount || parseInt(amount, 10) <= 0}
              className="w-full h-12 py-3 rounded-full bg-accent-rose text-white text-sm font-extrabold active-press shadow-lg shadow-accent-rose/25 hover:bg-accent-rose-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles size={16} />
                  Подтвердить участие ({amount ? `${parseInt(amount, 10).toLocaleString('ru-RU')} ₽` : '0 ₽'})
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
