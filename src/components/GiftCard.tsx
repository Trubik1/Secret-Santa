import React from 'react'
import { Gift } from '../types'
import { ExternalLink, Edit3, Trash2, Users, Check, Gift as GiftIcon, Lock } from 'lucide-react'
import { CurrencyMode, formatDualPrice } from '../utils/currency'
import { ThemeOption } from '../utils/theme'

interface GiftCardProps {
  gift: Gift
  isOwner: boolean
  currencyMode?: CurrencyMode
  theme?: ThemeOption
  onBook: (gift: Gift) => void
  onUnbook: (gift: Gift) => void
  onPledge: (gift: Gift) => void
  onEdit: (gift: Gift) => void
  onDelete: (gift: Gift) => void
  onOpenLink: (url: string) => void
}

export const GiftCard: React.FC<GiftCardProps> = ({
  gift,
  isOwner,
  currencyMode = 'both',
  theme,
  onBook,
  onUnbook,
  onPledge,
  onEdit,
  onDelete,
  onOpenLink,
}) => {
  const { primary: pricePrimary, secondary: priceSecondary } = formatDualPrice(gift.price, currencyMode)
  const targetPrice = gift.targetAmount > 0 ? gift.targetAmount : gift.price
  const currentPledged = gift.totalPledged || 0
  const progressPercent = targetPrice > 0 ? Math.min(100, Math.round((currentPledged / targetPrice) * 100)) : 0

  const bookerName = gift.bookedByUsername ? `@${gift.bookedByUsername}` : gift.bookedByName || 'гость'

  // Priority labels
  const priorityBadge = React.useMemo(() => {
    switch (gift.priority) {
      case 3:
        return { label: 'Мечта ✨', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
      case 2:
        return { label: 'Очень хочу 🔥', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' }
      default:
        return { label: 'Хочу 👍', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
    }
  }, [gift.priority])

  const cardRadius = theme?.cardRadius || 'rounded-28'
  const cardBorder = theme?.borderClass || 'border border-border-soft/60 dark:border-border-soft-dark/60'
  const headingFont = theme?.headingFont || 'font-bold'

  return (
    <div className={`bg-surface-card dark:bg-surface-card-dark ${cardRadius} overflow-hidden ${cardBorder} shadow-card flex flex-col justify-between transition-all duration-200 hover:shadow-subtle`}>
      {/* Top Media & Badges */}
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-soft dark:bg-surface-soft-dark">
          {gift.imageUrl ? (
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                // Fallback to placeholder if image link fails
                (e.target as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-accent-pink/50">
              <GiftIcon size={44} strokeWidth={1.5} />
            </div>
          )}

          {/* Priority Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-sm ${priorityBadge.bg}`}>
              {priorityBadge.label}
            </span>
          </div>

          {/* External Link button if provided */}
          {gift.url && (
            <button
              onClick={() => onOpenLink(gift.url!)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-surface-card-dark/90 text-ink-muted hover:text-accent-rose active-press shadow-sm backdrop-blur-sm"
              title="Перейти в магазин"
            >
              <ExternalLink size={14} />
            </button>
          )}

          {/* Guest status badges over image */}
          {!isOwner && gift.isBooked && (
            <div className="absolute inset-0 bg-ink-light/60 backdrop-blur-[2px] flex items-center justify-center p-4">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-zinc-900 text-ink-light dark:text-ink-dark shadow-lg flex items-center gap-1.5 border border-border-soft dark:border-border-soft-dark text-center">
                {gift.isBookedByMe ? (
                  <>Вы дарите этот подарок 🎁</>
                ) : (
                  <>
                    <Lock size={12} className="text-accent-rose shrink-0" />
                    <span>Забронировал {bookerName}</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Content details */}
        <div className="p-4">
          <h3 className={`${headingFont} text-sm text-ink-light dark:text-ink-dark line-clamp-2 leading-snug`}>
            {gift.title}
          </h3>

          <div className="mt-2 flex items-baseline justify-between flex-wrap gap-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-extrabold tracking-tight text-accent-rose dark:text-accent-rose-dark">
                {pricePrimary}
              </span>
              {priceSecondary && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-soft dark:bg-surface-soft-dark text-ink-muted border border-border-soft/50">
                  {priceSecondary}
                </span>
              )}
            </div>
            {gift.isCrowdfund && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <Users size={12} />
                Складчина
              </span>
            )}
          </div>

          {/* Crowdfunding progress bar */}
          {gift.isCrowdfund && !isOwner && (
            <div className="mt-3">
              <div className="flex justify-between text-[11px] font-semibold text-ink-muted dark:text-ink-muted-dark mb-1">
                <span>Собрано {formatDualPrice(currentPledged, currencyMode).primary}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-border-soft dark:bg-border-soft-dark overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-rose to-accent-pink rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {gift.pledgesCount ? (
                <p className="text-[10px] text-ink-muted mt-1">
                  Участвуют: {gift.pledgesCount} {gift.pledgesCount === 1 ? 'человек' : 'человека'}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-4 pb-4 pt-1">
        {isOwner ? (
          /* Owner Controls */
          <div className="flex items-center gap-2 pt-2 border-t border-border-soft/60 dark:border-border-soft-dark/60">
            <button
              onClick={() => onEdit(gift)}
              className="flex-1 py-2 px-3 rounded-full text-xs font-bold bg-white dark:bg-surface-soft-dark text-ink-light dark:text-ink-dark hover:text-accent-rose flex items-center justify-center gap-1.5 transition-colors active-press shadow-sm border border-border-soft/40"
            >
              <Edit3 size={13} />
              Изменить
            </button>
            <button
              onClick={() => onDelete(gift)}
              className="p-2 rounded-full bg-white dark:bg-surface-soft-dark text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors active-press shadow-sm border border-border-soft/40"
              title="Удалить подарок"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          /* Guest Controls */
          <div className="pt-2">
            {gift.isCrowdfund ? (
              <button
                onClick={() => onPledge(gift)}
                className="w-full py-2.5 rounded-full text-xs font-bold text-white bg-accent-rose hover:bg-accent-rose-hover flex items-center justify-center gap-1.5 active-press shadow-md shadow-accent-rose/20 transition-all"
              >
                <Users size={14} />
                {gift.myPledgedAmount ? `Внесли ${formatDualPrice(gift.myPledgedAmount, currencyMode).primary}` : 'Скинуться 🤝'}
              </button>
            ) : gift.isBooked ? (
              gift.isBookedByMe ? (
                <button
                  onClick={() => onUnbook(gift)}
                  className="w-full py-2.5 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center gap-1.5 active-press hover:bg-emerald-500/25 transition-all"
                >
                  <Check size={14} />
                  Вы дарите (Отменить?)
                </button>
              ) : (
                <div className="w-full py-2.5 px-3 rounded-full text-xs font-bold text-ink-muted text-center bg-black/5 dark:bg-white/5 border border-border-soft dark:border-border-soft-dark flex items-center justify-center gap-1.5">
                  <Lock size={12} className="text-ink-muted shrink-0" />
                  <span className="truncate">
                    Забронировал: <b className="text-accent-rose">{bookerName}</b>
                  </span>
                </div>
              )
            ) : (
              <button
                onClick={() => onBook(gift)}
                className="w-full py-2.5 rounded-full text-xs font-bold text-white bg-accent-rose hover:bg-accent-rose-hover flex items-center justify-center gap-1.5 active-press shadow-md shadow-accent-rose/20 transition-all"
              >
                <GiftIcon size={14} />
                Подарю я 🎁
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
