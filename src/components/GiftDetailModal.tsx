import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Gift } from '../types'
import { CurrencyMode, formatPrice } from '../utils/currency'
import { ExternalLink, Edit3, Trash2, Gift as GiftIcon, Users, CheckCircle2, Lock, Pin } from 'lucide-react'

interface GiftDetailModalProps {
  gift: Gift | null
  isOwner: boolean
  currencyMode: CurrencyMode
  currentUserId?: number
  onClose: () => void
  onEdit: (gift: Gift) => void
  onDelete: (gift: Gift) => void
  onBook: (gift: Gift) => void
  onUnbook: (gift: Gift) => void
  onPledge: (gift: Gift) => void
  onCancelPledge?: (giftId: string) => Promise<void>
  onTogglePin?: (gift: Gift) => Promise<void>
  onOpenLink: (url: string) => void
  onHaptic?: () => void
}

function getMarketplaceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes('wildberries') || host.includes('wb.ru')) return 'Открыть на Wildberries'
    if (host.includes('ozon')) return 'Открыть на Ozon'
    if (host.includes('market.yandex') || host.includes('yandex')) return 'Открыть на Яндекс Маркете'
    if (host.includes('onliner.by')) return 'Открыть на Onlíner'
    if (host.includes('aliexpress')) return 'Открыть на AliExpress'
    if (host.includes('goldapple')) return 'Открыть в Золотом Яблоке'
    if (host.includes('megamarket')) return 'Открыть на Мегамаркете'
    if (host.includes('dns-shop')) return 'Открыть в DNS'
    return 'Открыть в магазине'
  } catch (_) {
    return 'Открыть в магазине'
  }
}

export const GiftDetailModal: React.FC<GiftDetailModalProps> = ({
  gift,
  isOwner,
  currencyMode,
  currentUserId,
  onClose,
  onEdit,
  onDelete,
  onBook,
  onUnbook,
  onPledge,
  onCancelPledge,
  onTogglePin,
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
  const pledged = gift.totalPledged || 0
  const progressPercent = gift.price > 0 ? Math.min(100, Math.round((pledged / gift.price) * 100)) : 0
  const myPledge = gift.pledges?.find((p) => p.isMe || (currentUserId && p.userId === currentUserId)) || (gift.myPledgedAmount ? { amount: gift.myPledgedAmount } : undefined)

  const priorityLabel =
    gift.priority === 3
      ? { text: 'МЕЧТА', bg: 'bg-white/10 text-white border-white/20' }
      : gift.priority === 2
      ? { text: 'ОЧЕНЬ ХОЧУ', bg: 'bg-zinc-800 text-zinc-300 border-white/10' }
      : { text: 'ХОЧУ', bg: 'bg-zinc-800/80 text-zinc-400 border-white/5' }

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleDismiss}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
    >
      <div
        className={`w-full max-w-md bg-[#161618] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto shadow-2xl transition-all ${
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
          <div className="w-12 h-1.5 rounded-full bg-zinc-700 transition-all" />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
            Потяните вниз для закрытия
          </span>
        </div>

        {/* Product Image */}
        {gift.imageUrl ? (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 mt-2 mb-4">
            <img src={gift.imageUrl} alt={gift.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-4xl mt-2 mb-4 text-zinc-600">
            <GiftIcon size={40} />
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-black text-white leading-snug">
          {gift.title}
        </h2>

        {/* Price and Priority Row */}
        <div className="mt-2.5 flex items-center gap-2.5 flex-wrap">
          <div className="text-xl font-extrabold text-white">
            {priceText}
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border tracking-wider uppercase ${priorityLabel.bg}`}>
            {priorityLabel.text}
          </span>
        </div>

        {/* Description / Notes from Creator */}
        {gift.description && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#1c1c20] border border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Заметки:
            </div>
            <p className="text-xs text-zinc-200 mt-1 leading-relaxed whitespace-pre-wrap font-medium">
              {gift.description}
            </p>
          </div>
        )}

        {/* Marketplace Direct Link Button */}
        {gift.url && /^https?:\/\//i.test(gift.url) && (
          <button
            onClick={() => {
              onHaptic?.()
              onOpenLink(gift.url!)
            }}
            className="mt-3.5 w-full py-3 px-4 rounded-xl bg-[#1c1c20] hover:bg-zinc-800 border border-white/10 text-xs font-bold text-white flex items-center justify-between transition-colors active:scale-[0.98]"
          >
            <span className="flex items-center gap-2 truncate">
              <ExternalLink size={15} className="text-zinc-400 shrink-0" />
              <span className="truncate">{getMarketplaceLabel(gift.url)}</span>
            </span>
            <span className="text-zinc-400 text-sm ml-2">↗</span>
          </button>
        )}

        {/* Crowdfunding progress for friends */}
        {!isOwner && (gift.isCrowdfund || pledged > 0) && pledged > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#1c1c20] border border-white/5">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Users size={14} className="text-zinc-400" />
                <span>Собрано на подарок:</span>
              </span>
              <span className="font-extrabold text-white">
                {formatPrice(pledged, currencyMode)} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* List of contributors with usernames */}
            {gift.pledges && gift.pledges.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-white/5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Уже скинулись ({gift.pledges.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {gift.pledges.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-zinc-200"
                    >
                      <span className="font-semibold text-white">
                        {p.userUsername ? `@${p.userUsername}` : p.userName}
                      </span>
                      <span className="text-zinc-400 font-medium">
                        ({formatPrice(p.amount, currencyMode)})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* My contribution indicator + Cancel button */}
            {myPledge && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-zinc-400 font-medium">Ваш взнос: </span>
                  <span className="font-extrabold text-white">{formatPrice(myPledge.amount, currencyMode)}</span>
                </div>
                {onCancelPledge && (
                  <button
                    onClick={async () => {
                      onHaptic?.()
                      handleDismiss()
                      await onCancelPledge(gift.id)
                    }}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Отменить мой взнос
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="mt-5 pt-3.5 border-t border-white/10">
          {isOwner ? (
            <div className="space-y-2.5">
              {/* Pin / Unpin Button */}
              {onTogglePin && (
                <button
                  onClick={() => {
                    onHaptic?.()
                    onTogglePin(gift)
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 border cursor-pointer ${
                    gift.isPinned
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                      : 'bg-[#27272a] hover:bg-zinc-700 text-white border-white/10'
                  }`}
                >
                  <Pin size={15} className={gift.isPinned ? 'fill-amber-300 text-amber-300 rotate-45' : 'text-zinc-400'} />
                  <span>{gift.isPinned ? 'Открепить с 1 места' : 'Закрепить на 1 месте (PRO)'}</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onHaptic?.()
                    handleDismiss()
                    onEdit(gift)
                  }}
                  className="py-3 px-4 rounded-xl bg-[#27272a] hover:bg-zinc-700 text-xs font-bold text-white border border-white/5 flex items-center justify-center gap-2 transition-all active:scale-95"
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
                  className="py-3 px-4 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 text-xs font-bold text-red-400 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Trash2 size={15} />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {gift.isBooked ? (
                gift.isBookedByMe ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-zinc-800/80 border border-white/10 text-white text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-white" />
                      <span>Вы забронировали этот подарок!</span>
                    </div>
                    <button
                      onClick={() => {
                        onHaptic?.()
                        handleDismiss()
                        onUnbook(gift)
                      }}
                      className="w-full py-2.5 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      Отменить мою бронь
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-800/80 border border-white/10 text-zinc-400 text-xs font-bold flex items-center gap-2">
                    <Lock size={15} className="shrink-0" />
                    <span>
                      Подарок уже забронирован{' '}
                      {gift.bookedByUsername ? `@${gift.bookedByUsername}` : (gift.bookedByName || 'другом')}
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
                    className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black shadow-lg active:scale-95 flex items-center justify-center gap-2 transition-all"
                  >
                    <GiftIcon size={16} />
                    <span>Подарить целиком (Забронировать)</span>
                  </button>

                  <button
                    onClick={() => {
                      onHaptic?.()
                      handleDismiss()
                      onPledge(gift)
                    }}
                    className="w-full py-3 rounded-xl bg-[#27272a] hover:bg-zinc-700 border border-white/10 text-white text-xs font-bold active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Users size={15} className="text-zinc-400" />
                    <span>{pledged > 0 ? 'Скинуться с друзьями (Внести долю)' : 'Предложить скинуться с друзьями 🤝'}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
