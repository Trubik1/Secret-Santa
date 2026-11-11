import React, { useState } from 'react'
import { X, Loader2, Sparkles, Infinity, Image as ImageIcon, Award } from 'lucide-react'
import { payWithTelegramStars } from '../api/serverless'
import { fireConfetti } from '../utils/confetti'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessUpgrade: () => void
  onHaptic?: () => void
  reason?: 'limit' | 'cover' | 'general'
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  onSuccessUpgrade,
  onHaptic,
  reason = 'general',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleBuyPremium = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    onHaptic?.()

    await payWithTelegramStars({
      amount: 50,
      title: 'Giftly Premium ⭐️',
      description: 'Безлимитные желания + кастомная обложка профиля навсегда',
      onSuccess: () => {
        fireConfetti()
        onHaptic?.()
        onSuccessUpgrade()
        setIsSubmitting(false)
        onClose()
      },
      onCancel: () => {
        setIsSubmitting(false)
      },
      onError: (err) => {
        setIsSubmitting(false)
        console.error('Premium purchase error:', err)
        alert('Не удалось провести оплату: ' + (err.message || 'Ошибка'))
      },
    })
  }

  const reasonTitle =
    reason === 'limit'
      ? 'Лимит подарков исчерпан'
      : reason === 'cover'
      ? 'Кастомная обложка вишлиста'
      : 'Подключите Giftly Premium'

  const reasonSubtitle =
    reason === 'limit'
      ? 'На бесплатном тарифе доступно до 5 желаний. Разблокируйте безлимит с Giftly Premium!'
      : reason === 'cover'
      ? 'Установка персонального фона доступна владельцам Giftly Premium.'
      : 'Снимите ограничения и сделайте свой вишлист по-настоящему уникальным.'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-md bg-[#161618] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto animate-apple-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-white">Giftly Premium</h2>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                50 ⭐ Telegram Stars
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onHaptic?.()
              onClose()
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hero Card with Glowing Star */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-zinc-900 to-black border border-amber-500/20 text-center relative overflow-hidden">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <img src="/icons/nav/star.png" alt="Star" className="w-8 h-8 object-contain" />
            </div>
          </div>
          <h3 className="text-sm font-extrabold text-white">{reasonTitle}</h3>
          <p className="text-[11px] text-zinc-300 mt-1 max-w-xs mx-auto leading-relaxed">
            {reasonSubtitle}
          </p>
        </div>

        {/* Premium Perks List */}
        <div className="mt-4 space-y-2.5">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/5 text-amber-400 shrink-0 mt-0.5">
              <Infinity size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white">Безлимитные желания</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Добавляйте неограниченное число подарков с Wildberries, Ozon и других магазинов.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/5 text-amber-400 shrink-0 mt-0.5">
              <ImageIcon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white">Кастомная обложка профиля</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Загружайте любое фото в шапку своего вишлиста со встроенным кроппером и зумом.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/5 text-amber-400 shrink-0 mt-0.5">
              <Award size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white">Премиум-статус и бейдж ⭐️</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Золотая звёздочка рядом с вашим именем в профиле и в списках друзей.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-5 pt-3 border-t border-white/5 space-y-2">
          <button
            type="button"
            onClick={handleBuyPremium}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:brightness-105 text-black text-xs font-black active:scale-95 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin text-black" />
            ) : (
              <>
                <img src="/icons/nav/star.png" alt="Star" className="w-4 h-4 object-contain" />
                <span>Активировать за 50 ⭐ навсегда</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-zinc-500 text-center">
            Разовая покупка через официальный Telegram Stars
          </p>
        </div>
      </div>
    </div>
  )
}
