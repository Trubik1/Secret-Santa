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
    <div className="w-full pt-2 pb-28 select-none animate-fadeIn">
      {/* Studio Minimal Header */}
      <div className="mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Ивент
        </span>
        <h1 className="text-lg sm:text-xl font-black text-white mt-0.5">
          Тайный Санта 🎅
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Анонимный обмен подарками с друзьями, близкими или коллегами.
        </p>
      </div>

      {/* Studio Minimal Feature Card */}
      <div className="p-6 rounded-3xl bg-[#161618] border border-white/10 shadow-2xl text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-full bg-zinc-800 text-white ring-1 ring-white/10 flex items-center justify-center text-2xl mx-auto mb-3 shadow-md">
          🎅
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-zinc-200 border border-white/10 mb-2">
          <Clock size={12} />
          <span>В разработке · Скоро к Новому Году!</span>
        </span>

        <h2 className="text-sm sm:text-base font-black text-white mt-2">
          Автоматическая жеребьёвка подарков
        </h2>

        <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed font-medium">
          Создавайте комнаты для Тайного Санты, устанавливайте комфортный бюджет и привязывайте свои вишлисты — бот сам анонимно распределит, кто кому дарит подарок!
        </p>

        <div className="mt-5 p-4 rounded-2xl bg-zinc-900 border border-white/5 text-left space-y-2 text-xs font-semibold text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="text-white">✓</span>
            <span>Анонимная жеребьевка прямо в Telegram</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white">✓</span>
            <span>Возможность подсмотреть вишлист своего подопечного</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white">✓</span>
            <span>Ограничение бюджета и дедлайны вручения</span>
          </div>
        </div>

        <button
          onClick={() => {
            onHaptic?.()
            onBackToWishlist()
          }}
          className="mt-6 w-full py-3 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Gift size={15} />
          <span>Вернуться в мой вишлист</span>
        </button>
      </div>
    </div>
  )
}
