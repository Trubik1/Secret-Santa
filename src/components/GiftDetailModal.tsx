import React from 'react'
import { Gift } from '../types'
import { CurrencyMode, formatPrice, CROWDFUND_THRESHOLDS_IN_RUB } from '../utils/currency'
import { X, ExternalLink, Edit3, Trash2, Gift as GiftIcon, Users, CheckCircle2, Lock } from 'lucide-react'

interface GiftDetailModalProps {
  gift: Gift | null
  isOwner: boolean
  currencyMode: CurrencyMode
  onClose: () => void
  onEdit: (gift: Gift) => void
  onDelete: (gift: Gift) => void
  onBook: (gift: Gift) => void
  onUnbook: (gift: Gift) => void
  onPledge: (gift: Gift) => void
  onOpenLink: (url: string) => void
  onHaptic?: () => void
}

export const GiftDetailModal: React.FC<GiftDetailModalProps> = ({
  gift,
  isOwner,
  currencyMode,
  onClose,
  onEdit,
  onDelete,
  onBook,
  onUnbook,
  onPledge,
  onOpenLink,
  onHaptic,
}) => {
  if (!gift) return null

  const priceText = formatPrice(gift.price, currencyMode)
  const isCrowdfundAvailable = gift.price >= CROWDFUND_THRESHOLDS_IN_RUB
  const pledged = gift.totalPledged || 0
  const progressPercent = gift.price > 0 ? Math.min(100, Math.round((pledged / gift.price) * 100)) : 0

  const priorityLabel =
    gift.priority === 3
      ? { text: 'Мечта ✨', bg: 'bg-[#241920] text-[#d98aab] border-[#c4457b]/30' }
      : gift.priority === 2
      ? { text: 'Очень хочу 🔥', bg: 'bg-amber-950/40 text-amber-300 border-amber-600/30' }
      : { text: 'Хочу 👍', bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-600/30' }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-card dark:bg-[#17171a] border-t sm:border border-border-soft dark:border-[#34252f] rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with drag handle and close button */}
        <div className="flex items-center justify-between pb-3">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto" />
          <button
            onClick={() => {
              onHaptic?.()
              onClose()
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-ink-muted hover:text-ink-light dark:hover:text-white bg-surface-soft dark:bg-[#241920] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Big Product Image */}
        {gift.imageUrl ? (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 dark:bg-zinc-900 border border-border-soft dark:border-[#34252f] mb-4">
            <img src={gift.imageUrl} alt={gift.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 rounded-2xl bg-surface-soft dark:bg-[#241920] border border-border-soft dark:border-[#34252f] flex items-center justify-center text-4xl mb-4">
            🎁
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-black text-ink-light dark:text-white leading-snug">
          {gift.title}
        </h2>

        {/* Price and Priority Row */}
        <div className="mt-2.5 flex items-center gap-2.5 flex-wrap">
          <div className="text-xl font-black text-[#c4457b]">
            {priceText}
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${priorityLabel.bg}`}>
            {priorityLabel.text}
          </span>
        </div>

        {/* Description / Notes from Creator */}
        {gift.description && (
          <div className="mt-4 p-3.5 rounded-2xl bg-surface-soft dark:bg-[#241920]/80 border border-border-soft dark:border-[#34252f]">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#c4457b]">
              Заметки от создателя:
            </div>
            <p className="text-xs text-ink-light dark:text-zinc-200 mt-1 leading-relaxed whitespace-pre-wrap">
              {gift.description}
            </p>
          </div>
        )}

        {/* Marketplace Direct Link Button */}
        {gift.url && (
          <button
            onClick={() => {
              onHaptic?.()
              onOpenLink(gift.url!)
            }}
            className="mt-3.5 w-full py-3 px-4 rounded-xl bg-surface-soft dark:bg-zinc-800/80 border border-border-soft dark:border-zinc-700 hover:border-[#c4457b] text-xs font-bold text-ink-light dark:text-white flex items-center justify-between transition-colors active-press"
          >
            <span className="flex items-center gap-2 truncate">
              <ExternalLink size={15} className="text-[#c4457b] shrink-0" />
              <span className="truncate">Открыть в магазине (Wildberries / Ozon)</span>
            </span>
            <span className="text-ink-muted text-sm ml-2">↗</span>
          </button>
        )}

        {/* Crowdfunding progress for friends (never shown to owner) */}
        {!isOwner && (gift.isCrowdfund || isCrowdfundAvailable) && pledged > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-surface-soft dark:bg-[#241920] border border-[#c4457b]/30">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-ink-light dark:text-zinc-200">
                <Users size={14} className="text-[#c4457b]" />
                <span>Собрано на подарок:</span>
              </span>
              <span className="font-black text-[#c4457b]">
                {formatPrice(pledged, currencyMode)} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#c4457b] to-[#d98aab] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="mt-5 pt-3 border-t border-border-soft dark:border-[#34252f]">
          {isOwner ? (
            /* Creator Actions: Edit & Delete (No booking leak) */
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onHaptic?.()
                  onClose()
                  onEdit(gift)
                }}
                className="py-3 px-4 rounded-xl bg-surface-soft dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-extrabold text-ink-light dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active-press"
              >
                <Edit3 size={15} />
                <span>Редактировать</span>
              </button>

              <button
                onClick={() => {
                  onHaptic?.()
                  onClose()
                  onDelete(gift)
                }}
                className="py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-extrabold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition-all active-press"
              >
                <Trash2 size={15} />
                <span>Удалить</span>
              </button>
            </div>
          ) : (
            /* Friend / Guest Actions: Book or Chip in */
            <div className="space-y-2.5">
              {gift.isBooked ? (
                gift.isBookedByMe ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>Вы забронировали этот подарок! 🎉</span>
                    </div>
                    <button
                      onClick={() => {
                        onHaptic?.()
                        onClose()
                        onUnbook(gift)
                      }}
                      className="w-full py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-ink-muted hover:text-ink-light dark:hover:text-white transition-colors"
                    >
                      Отменить мою бронь
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs font-bold flex items-center gap-2">
                    <Lock size={15} className="shrink-0" />
                    <span>
                      Подарок уже забронирован{' '}
                      {gift.bookedByUsername ? `@${gift.bookedByUsername}` : (gift.bookedByName || 'другом')} 🤫
                    </span>
                  </div>
                )
              ) : (
                <>
                  <button
                    onClick={() => {
                      onHaptic?.()
                      onClose()
                      onBook(gift)
                    }}
                    className="w-full py-3.5 rounded-full bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black shadow-lg shadow-[#c4457b]/25 active-press flex items-center justify-center gap-2 transition-all"
                  >
                    <GiftIcon size={16} />
                    <span>Подарить целиком (Забронировать)</span>
                  </button>

                  {/* Crowdfunding Button for items >= 3000 RUB / 100 BYN / 30 USD */}
                  {(isCrowdfundAvailable || gift.isCrowdfund) && (
                    <button
                      onClick={() => {
                        onHaptic?.()
                        onClose()
                        onPledge(gift)
                      }}
                      className="w-full py-3 rounded-full bg-surface-soft dark:bg-[#241920] border border-[#c4457b]/40 text-[#c4457b] dark:text-[#d98aab] hover:border-[#c4457b] text-xs font-black active-press flex items-center justify-center gap-2 transition-all"
                    >
                      <Users size={15} />
                      <span>Скинуться с друзьями</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
