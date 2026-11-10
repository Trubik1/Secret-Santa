import React, { useState, useRef, useEffect, useCallback } from 'react'
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
  const [isClosing, setIsClosing] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef(0)

  // Reset closing state when gift opens
  useEffect(() => {
    if (gift) {
      setIsClosing(false)
      setDragOffset(0)
      setIsDragging(false)
    }
  }, [gift])

  const handleDismiss = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setDragOffset(0)
    }, 280)
  }, [onClose])

  // Drag down to dismiss touch handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    startYRef.current = clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const deltaY = clientY - startYRef.current
    if (deltaY > 0) {
      setDragOffset(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragOffset > 75) {
      onHaptic?.()
      handleDismiss()
    } else {
      setDragOffset(0)
    }
  }

  if (!gift) return null

  const priceText = formatPrice(gift.price, currencyMode)
  const isCrowdfundAvailable = gift.price >= CROWDFUND_THRESHOLDS_IN_RUB
  const pledged = gift.totalPledged || 0
  const progressPercent = gift.price > 0 ? Math.min(100, Math.round((pledged / gift.price) * 100)) : 0

  const priorityLabel =
    gift.priority === 3
      ? { text: 'Мечта ✨', bg: 'bg-[#241920] dark:bg-[#241920] text-[#c4457b] dark:text-[#d98aab] border-[#c4457b]/30' }
      : gift.priority === 2
      ? { text: 'Очень хочу 🔥', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' }
      : { text: 'Хочу 👍', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' }

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleDismiss}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
    >
      <div
        className={`w-full max-w-md bg-white dark:bg-[#17171a] border-t sm:border border-zinc-200 dark:border-[#34252f] rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto shadow-2xl transition-all ${
          isDragging
            ? ''
            : isClosing
            ? 'transition-transform duration-300 ease-in translate-y-full'
            : 'animate-apple-spring'
        }`}
        style={{
          transform: isDragging ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? 'none' : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swipe Handle Header (Pull down to dismiss) */}
        <div
          className="w-full py-1.5 flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
        >
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 transition-all" />
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
            Потяните вниз для закрытия
          </span>
        </div>

        {/* Close Button top-right */}
        <button
          onClick={() => {
            onHaptic?.()
            handleDismiss()
          }}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Product Image */}
        {gift.imageUrl ? (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-[#34252f] mt-2 mb-4">
            <img src={gift.imageUrl} alt={gift.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 rounded-2xl bg-zinc-100 dark:bg-[#241920] border border-zinc-200 dark:border-[#34252f] flex items-center justify-center text-4xl mt-2 mb-4">
            🎁
          </div>
        )}

        {/* Title (High-contrast Apple typography) */}
        <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-snug">
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

        {/* Description / Notes from Creator (Anti-slop clean styling) */}
        {gift.description && (
          <div className="mt-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#241920]/80 border border-zinc-200 dark:border-[#34252f]">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#c4457b]">
              Заметки от создателя:
            </div>
            <p className="text-xs text-zinc-800 dark:text-zinc-200 mt-1 leading-relaxed whitespace-pre-wrap font-medium">
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
            className="mt-3.5 w-full py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-between transition-colors active-press"
          >
            <span className="flex items-center gap-2 truncate">
              <ExternalLink size={15} className="text-[#c4457b] shrink-0" />
              <span className="truncate">Открыть в магазине (Wildberries / Ozon)</span>
            </span>
            <span className="text-zinc-400 text-sm ml-2">↗</span>
          </button>
        )}

        {/* Crowdfunding progress for friends */}
        {!isOwner && (gift.isCrowdfund || isCrowdfundAvailable) && pledged > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-[#241920] border border-zinc-200 dark:border-[#c4457b]/30">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
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

        {/* ACTION BUTTONS (High-contrast Apple HIG) */}
        <div className="mt-5 pt-3.5 border-t border-zinc-200 dark:border-[#34252f]">
          {isOwner ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onHaptic?.()
                  handleDismiss()
                  onEdit(gift)
                }}
                className="py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-extrabold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-transparent flex items-center justify-center gap-2 transition-all active-press"
              >
                <Edit3 size={15} />
                <span>Редактировать</span>
              </button>

              <button
                onClick={() => {
                  onHaptic?.()
                  handleDismiss()
                  onDelete(gift)
                }}
                className="py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/50 text-xs font-extrabold text-red-600 dark:text-rose-400 flex items-center justify-center gap-2 transition-all active-press"
              >
                <Trash2 size={15} />
                <span>Удалить</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {gift.isBooked ? (
                gift.isBookedByMe ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Вы забронировали этот подарок! 🎉</span>
                    </div>
                    <button
                      onClick={() => {
                        onHaptic?.()
                        handleDismiss()
                        onUnbook(gift)
                      }}
                      className="w-full py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Отменить мою бронь
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-bold flex items-center gap-2">
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
                      handleDismiss()
                      onBook(gift)
                    }}
                    className="w-full py-3.5 rounded-full bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black shadow-lg shadow-[#c4457b]/25 active-press flex items-center justify-center gap-2 transition-all"
                  >
                    <GiftIcon size={16} />
                    <span>Подарить целиком (Забронировать)</span>
                  </button>

                  {(isCrowdfundAvailable || gift.isCrowdfund) && (
                    <button
                      onClick={() => {
                        onHaptic?.()
                        handleDismiss()
                        onPledge(gift)
                      }}
                      className="w-full py-3 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-[#241920] border border-zinc-200 dark:border-[#c4457b]/40 text-zinc-900 dark:text-[#d98aab] text-xs font-black active-press flex items-center justify-center gap-2 transition-all"
                    >
                      <Users size={15} className="text-[#c4457b]" />
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
