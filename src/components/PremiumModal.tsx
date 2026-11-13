import React, { useState } from 'react'
import {
  X,
  Loader2,
  Infinity,
  Image as ImageIcon,
  Award,
  Pin,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react'
import { payWithTelegramStars } from '../api/serverless'
import { fireConfetti } from '../utils/confetti'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessUpgrade: () => void
  onHaptic?: () => void
  reason?: 'limit' | 'cover' | 'general'
}

/**
 * High-DPI Vector Telegram Star Badge (No pixelation, pure SVG)
 */
export const TelegramStarIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="starGoldBody" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF2A3" />
          <stop offset="25%" stopColor="#FFD233" />
          <stop offset="70%" stopColor="#FF9F0A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="starFacetedRight" x1="16" y1="2" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E58A00" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#9A4500" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="starGlassGleam" x1="8" y1="4" x2="24" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#FFF4B8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="starCoreLight" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FFDE59" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFA000" stopOpacity="0" />
        </radialGradient>
        <filter id="starBloom" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FFB800" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Main Faceted Star Geometry */}
      <g filter="url(#starBloom)">
        <path
          d="M16 2.5L19.8 11.2L29.2 12.3L22.2 18.6L24.1 28L16 23.3L7.9 28L9.8 18.6L2.8 12.3L12.2 11.2L16 2.5Z"
          fill="url(#starGoldBody)"
          stroke="#FFE685"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        {/* Right 3D shading facet */}
        <path
          d="M16 2.5V23.3L24.1 28L22.2 18.6L29.2 12.3L19.8 11.2L16 2.5Z"
          fill="url(#starFacetedRight)"
        />
        {/* Specular Gleam Highlight */}
        <path
          d="M16 3.8L13 11.5L4.5 12.5L10.8 18.2L9.2 26.5L16 22.5V3.8Z"
          fill="url(#starGlassGleam)"
        />
        {/* Center Glow */}
        <circle cx="16" cy="15" r="5" fill="url(#starCoreLight)" />
      </g>
    </svg>
  )
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
      title: 'Giftly PRO ⭐️',
      description: 'Безлимитные желания + кастомная обложка + статус PRO навсегда',
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
      ? 'Лимит желаний исчерпан'
      : reason === 'cover'
      ? 'Кастомная обложка вишлиста'
      : 'Подключите Giftly PRO'

  const reasonSubtitle =
    reason === 'limit'
      ? 'На базовом тарифе доступно до 5 подарков. Разблокируйте безлимит и эксклюзивные функции!'
      : reason === 'cover'
      ? 'Установка собственного фона доступна владельцам Giftly PRO.'
      : 'Снимите любые ограничения и сделайте свой профиль по-настоящему особенным.'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-md bg-[#161618] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto animate-apple-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-md shadow-amber-500/10 shrink-0">
              <TelegramStarIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-white tracking-tight">Giftly PRO</h2>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-extrabold uppercase border border-amber-400/30">
                  Forever
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-400 block mt-0.5">
                50 ⭐ Telegram Stars (разово)
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onHaptic?.()
              onClose()
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hero Banner with Radiant 3D Star & Specular Aura */}
        <div className="mt-4 p-5 rounded-3xl bg-gradient-to-b from-amber-500/15 via-[#1a1714] to-[#121214] border border-amber-500/30 text-center relative overflow-hidden shadow-inner">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-white/10 to-amber-500/10 border border-amber-400/30 flex items-center justify-center shadow-xl shadow-amber-500/15 mb-3 backdrop-blur-md">
              <TelegramStarIcon size={38} />
            </div>
            <h3 className="text-base font-black text-white">{reasonTitle}</h3>
            <p className="text-xs text-zinc-300 mt-1 max-w-xs leading-relaxed font-medium">
              {reasonSubtitle}
            </p>
          </div>
        </div>

        {/* PRO Perks List */}
        <div className="mt-4 space-y-2.5">
          {/* Perk 1: Unlimited Wishes */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/5 flex items-start gap-3 hover:border-amber-500/20 transition-colors">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 shrink-0 mt-0.5">
              <Infinity size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-white">Безлимитные желания</h4>
                <span className="text-[9px] font-bold text-amber-400 uppercase bg-amber-400/10 px-1 rounded">No Limit</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                Добавляйте неограниченное число подарков с Wildberries, Ozon, AliExpress или вручную без ограничений.
              </p>
            </div>
          </div>

          {/* Perk 2: Custom Cover */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/5 flex items-start gap-3 hover:border-amber-500/20 transition-colors">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 shrink-0 mt-0.5">
              <ImageIcon size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-white">Персональная обложка вишлиста</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                Загружайте любое своё фото в шапку профиля с удобным зумом и масштабированием.
              </p>
            </div>
          </div>

          {/* Perk 3: Golden PRO Badge */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/5 flex items-start gap-3 hover:border-amber-500/20 transition-colors">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 shrink-0 mt-0.5">
              <Award size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-white">Золотой статус PRO ⭐️</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                Сияющая золотая звезда возле вашего имени в профиле, вишлисте и для всех гостей.
              </p>
            </div>
          </div>

          {/* Perk 4: Pin Top Wish */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/5 flex items-start gap-3 hover:border-amber-500/20 transition-colors">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 shrink-0 mt-0.5">
              <Pin size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-white">Приоритет главной мечты</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                Закрепляйте самое желанное на первом месте, чтобы друзья сразу видели вашу цель.
              </p>
            </div>
          </div>

          {/* Perk 5: Secret Santa & Surprise Analytics */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/5 flex items-start gap-3 hover:border-amber-500/20 transition-colors">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 shrink-0 mt-0.5">
              <TrendingUp size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-white">Умная статистика и аналитика</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                Отслеживайте статистику интереса к вашему вишлисту без раскрытия сюрпризов.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-5 pt-3 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={handleBuyPremium}
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:brightness-105 active:scale-[0.98] text-black text-xs sm:text-sm font-black shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin text-black" />
            ) : (
              <>
                <TelegramStarIcon size={20} />
                <span>Активировать PRO за 50 ⭐ навсегда</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-medium">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Официальная разовая оплата через Telegram Stars</span>
          </div>
        </div>
      </div>
    </div>
  )
}
