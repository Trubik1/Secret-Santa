import React from 'react'
import { Gift, DeleteReason } from '../types'
import { X, Gift as GiftIcon, ShoppingBag, Sparkles, Trash2, HeartHandshake } from 'lucide-react'

interface DeleteReasonModalProps {
  isOpen: boolean
  gift: Gift | null
  onClose: () => void
  onConfirmDelete: (gift: Gift, reason: DeleteReason) => Promise<void>
  onHaptic?: () => void
}

export const DeleteReasonModal: React.FC<DeleteReasonModalProps> = ({
  isOpen,
  gift,
  onClose,
  onConfirmDelete,
  onHaptic,
}) => {
  const [loadingReason, setLoadingReason] = React.useState<DeleteReason | null>(null)

  if (!isOpen || !gift) return null

  const handleSelectReason = async (reason: DeleteReason) => {
    onHaptic?.()
    setLoadingReason(reason)
    try {
      await onConfirmDelete(gift, reason)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReason(null)
    }
  }

  const reasons = [
    {
      id: 'gifted' as DeleteReason,
      icon: <HeartHandshake size={20} className="text-emerald-400" />,
      badge: '🎁 Подарили!',
      title: 'Мне это уже подарили!',
      subtitle: 'Желание исполнилось — отметим как подаренное',
      cardStyle: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
      badgeStyle: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'bought_self' as DeleteReason,
      icon: <ShoppingBag size={20} className="text-sky-400" />,
      badge: '🛍 Купил(а) сам(а)',
      title: 'Купил(а) самостоятельно',
      subtitle: 'Приобрел(а) себе — больше не требуется',
      cardStyle: 'hover:border-sky-500/40 hover:bg-sky-500/5',
      badgeStyle: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    },
    {
      id: 'changed_mind' as DeleteReason,
      icon: <Sparkles size={20} className="text-amber-400" />,
      badge: '💭 Передумал(а)',
      title: 'Больше не актуально',
      subtitle: 'Пропал интерес или разонравилось',
      cardStyle: 'hover:border-amber-500/40 hover:bg-amber-500/5',
      badgeStyle: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    {
      id: 'just_delete' as DeleteReason,
      icon: <Trash2 size={20} className="text-rose-400" />,
      badge: '🗑 Удалить',
      title: 'Просто удалить из вишлиста',
      subtitle: 'Случайное добавление или ошибка',
      cardStyle: 'hover:border-rose-500/40 hover:bg-rose-500/5',
      badgeStyle: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-md bg-[#161618] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto animate-apple-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-black text-white">
              Что случилось с желанием?
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Помогите вести статистику ваших подарков
            </p>
          </div>
          <button
            onClick={() => {
              onHaptic?.()
              onClose()
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Gift Mini Preview */}
        <div className="mt-3.5 p-3 rounded-2xl bg-zinc-900 border border-white/5 flex items-center gap-3">
          {gift.imageUrl ? (
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-white font-bold text-lg">
              <GiftIcon size={20} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">{gift.title}</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {gift.price > 0 ? `${gift.price.toLocaleString('ru-RU')} ₽` : 'Без цены'}
            </p>
          </div>
        </div>

        {/* Reason Buttons */}
        <div className="mt-4 space-y-2.5">
          {reasons.map((r) => {
            const isLoading = loadingReason === r.id
            return (
              <button
                key={r.id}
                disabled={Boolean(loadingReason)}
                onClick={() => handleSelectReason(r.id)}
                className={`w-full p-3.5 rounded-2xl bg-[#1c1c20] border border-white/5 text-left flex items-start gap-3 transition-all active:scale-[0.99] cursor-pointer ${r.cardStyle} disabled:opacity-50`}
              >
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 shrink-0 mt-0.5">
                  {r.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{r.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${r.badgeStyle}`}>
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    {r.subtitle}
                  </p>
                </div>

                {isLoading && (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin shrink-0 self-center" />
                )}
              </button>
            )
          })}
        </div>

        {/* Cancel Button */}
        <div className="mt-4 pt-2">
          <button
            onClick={() => {
              onHaptic?.()
              onClose()
            }}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Отмена (оставить желание)
          </button>
        </div>
      </div>
    </div>
  )
}
