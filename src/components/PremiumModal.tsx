import React, { useState } from 'react'
import {
  X,
  Loader2,
  Infinity,
  Image as ImageIcon,
  Award,
  Pin,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { payWithTelegramStars } from '../api/serverless'
import { fireConfetti } from '../utils/confetti'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessUpgrade: () => void
  onHaptic?: () => void
  reason?: 'limit' | 'cover' | 'general'
  isAlreadyPremium?: boolean
}

/**
 * High-DPI Vector Telegram Star Badge (Pure SVG, no pixelation)
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
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
        </linearGradient>
        <radialGradient id="starCoreLight" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FFDE59" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFA000" stopOpacity="0" />
        </radialGradient>
        <filter id="starBloom" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FFB800" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter="url(#starBloom)">
        <path
          d="M16 2.5L19.8 11.2L29.2 12.3L22.2 18.6L24.1 28L16 23.3L7.9 28L9.8 18.6L2.8 12.3L12.2 11.2L16 2.5Z"
          fill="url(#starGoldBody)"
          stroke="#FFE685"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path
          d="M16 2.5V23.3L24.1 28L22.2 18.6L29.2 12.3L19.8 11.2L16 2.5Z"
          fill="url(#starFacetedRight)"
        />
        <path
          d="M16 3.8L13 11.5L4.5 12.5L10.8 18.2L9.2 26.5L16 22.5V3.8Z"
          fill="url(#starGlassGleam)"
        />
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
  isAlreadyPremium = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleBuyPremium = async () => {
    if (isSubmitting || isAlreadyPremium) return
    setIsSubmitting(true)
    onHaptic?.()

    await payWithTelegramStars({
      amount: 50,
      title: 'Giftly PRO ⭐️',
      description: 'Безлимит желаний, своя обложка и PRO статус навсегда',
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

  const reasonSubtitle = isAlreadyPremium
    ? 'У вас активирован вечный доступ ко всем возможностям Giftly PRO без ограничений.'
    : reason === 'limit'
    ? 'На бесплатном тарифе доступно до 5 подарков. Разблокируйте безлимит навсегда!'
    : reason === 'cover'
    ? 'Установка собственного фона доступна в подписке Giftly PRO.'
    : 'Разблокируйте полный потенциал и персонализацию вашего вишлиста.'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#141416] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 animate-apple-spring relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle for Bottom Sheet */}
        <div className="w-9 h-1 rounded-full bg-white/20 mx-auto mb-2" />

        {/* Close Button */}
        <button
          onClick={() => {
            onHaptic?.()
            onClose()
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <div className="relative mb-2.5">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
              <TelegramStarIcon size={38} />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-black text-white tracking-tight">Giftly PRO</h2>
            {isAlreadyPremium ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                Активен ✓
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-bold border border-amber-400/25">
                Forever
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
            {reasonSubtitle}
          </p>
        </div>

        {/* 2x2 Bento Grid (Compact, no endless scrolling!) */}
        <div className="grid grid-cols-2 gap-2.5 my-2">
          {/* Card 1 */}
          <div className="p-3.5 rounded-2xl bg-[#1c1c1f] border border-white/5 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-white/5 text-amber-300 flex items-center justify-center mb-2">
              <Infinity size={16} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white">Безлимит желаний</h4>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                Сколько угодно подарков без ограничений
              </p>
              {isAlreadyPremium && (
                <span className="text-[10px] font-bold text-emerald-400 mt-1.5 inline-flex items-center gap-1">
                  <Check size={11} strokeWidth={3} /> Активно
                </span>
              )}
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-3.5 rounded-2xl bg-[#1c1c1f] border border-white/5 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-white/5 text-amber-300 flex items-center justify-center mb-2">
              <ImageIcon size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Своя обложка</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                Любое фото в шапку профиля с кроппером
              </p>
              {isAlreadyPremium && (
                <span className="text-[10px] font-bold text-emerald-400 mt-1.5 inline-flex items-center gap-1">
                  <Check size={11} strokeWidth={3} /> Активно
                </span>
              )}
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-3.5 rounded-2xl bg-[#1c1c1f] border border-white/5 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-white/5 text-amber-300 flex items-center justify-center mb-2">
              <Award size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Золотой статус</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                Бейдж PRO в профиле и для всех гостей
              </p>
              {isAlreadyPremium && (
                <span className="text-[10px] font-bold text-emerald-400 mt-1.5 inline-flex items-center gap-1">
                  <Check size={11} strokeWidth={3} /> Активно
                </span>
              )}
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-3.5 rounded-2xl bg-[#1c1c1f] border border-white/5 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-white/5 text-amber-300 flex items-center justify-center mb-2">
              <Pin size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">PIN в каталоге</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                Закрепление главной мечты на 1 месте
              </p>
              {isAlreadyPremium && (
                <span className="text-[10px] font-bold text-emerald-400 mt-1.5 inline-flex items-center gap-1">
                  <Check size={11} strokeWidth={3} /> Активно
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Clean Apple Button */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
          {isAlreadyPremium ? (
            <>
              <div className="w-full py-3.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black shadow-lg flex items-center justify-center gap-2 select-none">
                <Check size={16} strokeWidth={3} />
                <span>⭐️ PRO подключен навсегда</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onHaptic?.()
                  onClose()
                }}
                className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Отлично
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Ваш аккаунт обладает полным безлимитным доступом</span>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBuyPremium}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-100 active:scale-[0.98] text-black text-sm font-black shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : (
                  <>
                    <TelegramStarIcon size={18} />
                    <span>Активировать за 50 ⭐</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
                <ShieldCheck size={12} className="text-zinc-500" />
                <span>Разовая покупка через Telegram Stars • Навсегда</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
