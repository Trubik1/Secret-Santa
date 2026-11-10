import React from 'react'
import { Gift, Clock } from 'lucide-react'

interface SecretSantaPageProps {
  onBackToWishlist: () => void
  onHaptic?: () => void
}

export const SecretSantaPage: React.FC<SecretSantaPageProps> = ({
  onBackToWishlist,
  onHaptic,
}) => {
  return (
    <div className="w-full px-4 pt-3 pb-24 animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#c4457b]">
          Новогодний ивент
        </span>
        <h1 className="text-xl font-black text-zinc-900 dark:text-white mt-0.5">
          Тайный Санта 🎅
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Анонимный обмен подарками с друзьями, близкими или коллегами.
        </p>
      </div>

      {/* In Development Card with Liquid Glass feel */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#17171a] border border-zinc-200 dark:border-[#34252f] shadow-lg text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#c4457b]/15 blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#c4457b] to-[#d98aab] text-white flex items-center justify-center text-3xl mx-auto shadow-md shadow-[#c4457b]/20 mb-3.5">
          🎅
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 mb-2">
          <Clock size={13} />
          <span>В разработке · Скоро к Новому Году!</span>
        </span>

        <h2 className="text-base font-black text-zinc-900 dark:text-white mt-2">
          Автоматическая жеребьёвка подарков
        </h2>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
          Создавайте комнаты для Тайного Санты, устанавливайте комфортный бюджет и привязывайте свои вишлисты — бот сам анонимно распределит, кто кому дарит подарок!
        </p>

        <div className="mt-5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#241920]/60 border border-zinc-200 dark:border-[#34252f] text-left space-y-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="text-[#c4457b]">✓</span>
            <span>Анонимная жеребьевка прямо в Telegram</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#c4457b]">✓</span>
            <span>Возможность подсмотреть вишлист своего подопечного</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#c4457b]">✓</span>
            <span>Ограничение бюджета и дедлайны вручения</span>
          </div>
        </div>

        <button
          onClick={() => {
            onHaptic?.()
            onBackToWishlist()
          }}
          className="mt-6 w-full py-3.5 rounded-full bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black shadow-lg shadow-[#c4457b]/25 active-press transition-all flex items-center justify-center gap-2"
        >
          <Gift size={15} />
          <span>Вернуться в мой вишлист</span>
        </button>
      </div>
    </div>
  )
}
