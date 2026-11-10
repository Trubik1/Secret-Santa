import React, { useState } from 'react'
import { Gift } from '../types'
import { X, Users, MessageCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import {
  CurrencyMode,
  formatPrice,
  getCurrencySymbol,
  convertRubTo,
  convertToRub,
} from '../utils/currency'

interface PledgeModalProps {
  isOpen: boolean
  gift: Gift | null
  currencyMode: CurrencyMode
  onClose: () => void
  onConfirmPledge: (giftId: string, amountInRub: number) => Promise<void>
  onOpenTelegramLink: (url: string) => void
  onHaptic: () => void
}

export const PledgeModal: React.FC<PledgeModalProps> = ({
  isOpen,
  gift,
  currencyMode,
  onClose,
  onConfirmPledge,
  onOpenTelegramLink,
  onHaptic,
}) => {
  const [amount, setAmount] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !gift) return null

  const currSymbol = getCurrencySymbol(currencyMode)
  const targetAmountInRub = gift.targetAmount > 0 ? gift.targetAmount : gift.price
  const currentTotalInRub = gift.totalPledged || 0
  const remainingInRub = Math.max(0, targetAmountInRub - currentTotalInRub)
  const progressPercent = targetAmountInRub > 0 ? Math.min(100, Math.round((currentTotalInRub / targetAmountInRub) * 100)) : 0

  const remainingInCurr = Math.round(convertRubTo(remainingInRub, currencyMode))

  const handleQuickAdd = (addVal: number) => {
    onHaptic()
    const cur = parseFloat(amount) || 0
    setAmount(String(cur + addVal))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0 || isSubmitting) return

    setIsSubmitting(true)
    onHaptic()
    try {
      const numInRub = convertToRub(num, currencyMode)
      await onConfirmPledge(gift.id, numInRub)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-surface-card dark:bg-[#17171a] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-border-soft dark:border-[#34252f] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#34252f]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose">
              <Users size={18} />
            </span>
            <h2 className="text-base font-black text-ink-light dark:text-white">
              Складчина на подарок
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

        {/* Gift Summary */}
        <div className="mt-3.5 p-3 rounded-2xl bg-surface-soft dark:bg-[#241920]/60 border border-border-soft dark:border-[#34252f] flex items-center gap-3">
          {gift.imageUrl && (
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-ink-light dark:text-white truncate">
              {gift.title}
            </h3>
            <div className="mt-1 text-sm font-black text-[#c4457b]">
              Цель: {formatPrice(targetAmountInRub, currencyMode)}
            </div>
          </div>
        </div>

        {/* Progress Display */}
        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-1.5 text-xs">
            <span className="font-bold text-ink-light dark:text-zinc-200">
              Собрано {formatPrice(currentTotalInRub, currencyMode)}
            </span>
            <span className="font-black text-[#c4457b]">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c4457b] to-[#d98aab] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {remainingInRub > 0 && (
            <p className="text-[11px] text-ink-muted mt-1.5 font-medium">
              Осталось собрать: <b className="text-ink-light dark:text-white">{formatPrice(remainingInRub, currencyMode)}</b>
            </p>
          )}
        </div>

        {/* Pledge Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-muted mb-1.5">
              Сумма вашего взноса ({currSymbol})
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder={remainingInCurr > 0 ? `Например, ${remainingInCurr}` : '10'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-soft dark:bg-zinc-800/80 border border-border-soft dark:border-zinc-700 text-sm font-black text-ink-light dark:text-white focus:outline-none focus:border-[#c4457b]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-ink-muted">
                {currSymbol}
              </span>
            </div>

            {/* Quick amount pills adapted to currency */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {[10, 25, 50].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleQuickAdd(step)}
                  className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-soft dark:bg-zinc-800 text-ink-muted hover:text-ink-light dark:hover:text-white border border-border-soft dark:border-zinc-700 active-press transition-colors"
                >
                  +{step} {currSymbol}
                </button>
              ))}
              {remainingInCurr > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onHaptic()
                    setAmount(String(remainingInCurr))
                  }}
                  className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#c4457b]/10 text-[#c4457b] border border-[#c4457b]/30 active-press transition-colors"
                >
                  Весь остаток ({remainingInCurr} {currSymbol})
                </button>
              )}
            </div>
          </div>

          {/* Direct coordination disclaimer */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-500" />
            <p className="leading-relaxed text-[11px]">
              <b>Приложение не принимает онлайн-платежи.</b> Нажимая кнопку, вы подтверждаете участие, и ваш <b>@username</b> станет виден другим участникам сбора для прямого перевода средств.
            </p>
          </div>

          {/* Contributors List */}
          {gift.pledges && gift.pledges.length > 0 && (
            <div className="pt-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-ink-muted mb-2">
                Участники сбора ({gift.pledges.length})
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {gift.pledges.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-surface-soft dark:bg-zinc-800/60 border border-border-soft dark:border-zinc-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink-light dark:text-white">
                        {p.userName}
                      </span>
                      {p.userUsername && (
                        <button
                          type="button"
                          onClick={() => onOpenTelegramLink(`https://t.me/${p.userUsername}`)}
                          className="text-[11px] font-semibold text-[#c4457b] hover:underline flex items-center gap-1"
                        >
                          <MessageCircle size={12} />
                          @{p.userUsername}
                        </button>
                      )}
                    </div>
                    <span className="font-black text-[#c4457b]">
                      {formatPrice(p.amount, currencyMode)}
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
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="w-full py-3.5 rounded-full bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black active-press shadow-lg shadow-[#c4457b]/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles size={15} />
                  Подтвердить участие ({amount ? `${amount} ${currSymbol}` : `0 ${currSymbol}`})
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
