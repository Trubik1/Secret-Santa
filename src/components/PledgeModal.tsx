import React, { useState } from 'react'
import { Gift } from '../types'
import { X, Users, Loader2 } from 'lucide-react'
import {
  CurrencyMode,
  formatPrice,
  getCurrencySymbol,
  convertRubTo,
  convertToRub,
} from '../utils/currency'
import { fireConfetti } from '../utils/confetti'

interface PledgeModalProps {
  isOpen: boolean
  gift: Gift | null
  currencyMode: CurrencyMode
  currentUserId?: number
  onClose: () => void
  onConfirmPledge: (giftId: string, amountInRub: number) => Promise<void>
  onCancelPledge?: (giftId: string) => Promise<void>
  onOpenTelegramLink?: (url: string) => void
  onHaptic: () => void
}

export const PledgeModal: React.FC<PledgeModalProps> = ({
  isOpen,
  gift,
  currencyMode,
  currentUserId,
  onClose,
  onConfirmPledge,
  onCancelPledge,
  onOpenTelegramLink: _onOpenTelegramLink,
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
  const remainingInCurr = Math.max(1, Math.round(convertRubTo(remainingInRub, currencyMode)))

  const myPledge = gift.pledges?.find((p) => p.isMe || (currentUserId && p.userId === currentUserId)) || (gift.myPledgedAmount ? { amount: gift.myPledgedAmount } : undefined)

  const handleQuickAdd = (addVal: number) => {
    onHaptic()
    const cur = parseFloat(amount) || 0
    const nextVal = Math.min(remainingInCurr, cur + addVal)
    setAmount(String(nextVal))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0 || isSubmitting) return

    setIsSubmitting(true)
    onHaptic()
    try {
      const clampedNum = Math.min(remainingInCurr, num)
      const numInRub = Math.min(remainingInRub, convertToRub(clampedNum, currencyMode))
      await onConfirmPledge(gift.id, numInRub)
      fireConfetti()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-md bg-[#161618] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto animate-apple-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white/10 text-white">
              <Users size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-white">
                {currentTotalInRub > 0 ? 'Скинуться с друзьями' : 'Предложить скинуться'}
              </h2>
              <p className="text-[10px] text-zinc-400">
                {currentTotalInRub > 0 ? 'Внесите свою долю в общий подарок' : 'Начните совместный сбор на этот подарок'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onHaptic()
              onClose()
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Gift Summary */}
        <div className="mt-4 p-3.5 rounded-2xl bg-zinc-900 border border-white/5 flex items-center gap-3">
          {gift.imageUrl && (
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="w-14 h-14 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white truncate">{gift.title}</h3>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {formatPrice(targetAmountInRub, currencyMode)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Осталось собрать: <strong className="text-white">{formatPrice(remainingInRub, currencyMode)}</strong>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-zinc-400">Собрано: {progressPercent}%</span>
            <span className="text-white">{formatPrice(currentTotalInRub, currencyMode)}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Existing User Contribution Card */}
        {myPledge && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-300">Ваше участие в сборе</div>
              <div className="text-xs font-black text-white mt-0.5">
                Ваш текущий взнос: {formatPrice(myPledge.amount, currencyMode)}
              </div>
            </div>
            {onCancelPledge && (
              <button
                type="button"
                onClick={async () => {
                  onHaptic()
                  await onCancelPledge(gift.id)
                  onClose()
                }}
                className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-xs font-bold text-red-400 transition-colors cursor-pointer"
              >
                Отменить взнос
              </button>
            )}
          </div>
        )}

        {/* Pledge Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Сколько вы готовы внести ({currSymbol}) • макс. {remainingInCurr} {currSymbol}
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                max={remainingInCurr}
                required
                placeholder={`До ${remainingInCurr} ${currSymbol}`}
                value={amount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val > remainingInCurr) {
                    setAmount(String(remainingInCurr))
                  } else {
                    setAmount(e.target.value)
                  }
                }}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">
                {currSymbol}
              </span>
            </div>

            {/* Quick add chips */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {[10, 25, 50, 100].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleQuickAdd(chip)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-white/5 active:scale-95 transition-all cursor-pointer"
                >
                  +{chip} {currSymbol}
                </button>
              ))}
              {remainingInCurr > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onHaptic()
                    setAmount(String(remainingInCurr))
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-extrabold text-white border border-white/10 active:scale-95 transition-all ml-auto cursor-pointer"
                >
                  Внести остаток ({remainingInCurr})
                </button>
              )}
            </div>
          </div>

          {/* Existing Pledges list */}
          {gift.pledges && gift.pledges.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Участники сбора ({gift.pledges.length})
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {gift.pledges.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs py-1 px-2.5 rounded-lg bg-zinc-900 border border-white/5">
                    <span className="font-semibold text-zinc-300">
                      {p.userName} {p.userUsername && <span className="text-zinc-500 text-[10px]">@{p.userUsername}</span>}
                    </span>
                    <span className="font-black text-white">{formatPrice(p.amount, currencyMode)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black active:scale-[0.98] shadow-md disabled:opacity-40 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <span>{currentTotalInRub > 0 ? 'Внести свою долю 🤝' : 'Начать совместный сбор 🚀'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
