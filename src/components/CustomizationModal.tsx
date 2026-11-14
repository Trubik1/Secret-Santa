import React, { useState } from 'react'
import {
  X,
  Palette,
  Camera,
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react'
import { UserProfile } from '../types'
import { TelegramStarIcon } from './PremiumModal'

interface CustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
  isPremium: boolean
  onOpenCoverCropper: () => void
  onSaveCover: (coverUrl: string | null) => Promise<void>
  onOpenPremiumModal: (reason?: 'cover' | 'limit' | 'general') => void
  onHaptic?: () => void
  onShowToast?: (msg: string) => void
}

interface ThemePreset {
  id: string
  name: string
  colors: [string, string, string]
  bgPreview: string
}

const PRESET_THEMES: ThemePreset[] = [
  {
    id: 'deep-oled',
    name: 'OLED Midnight',
    colors: ['#0d0d0f', '#18181c', '#24242c'],
    bgPreview: 'from-[#0d0d0f] via-[#18181c] to-[#24242c]',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    colors: ['#3b1223', '#7a2245', '#c4457b'],
    bgPreview: 'from-[#3b1223] via-[#7a2245] to-[#c4457b]',
  },
  {
    id: 'emerald-luxe',
    name: 'Emerald Luxe',
    colors: ['#06231a', '#0f4c3a', '#10b981'],
    bgPreview: 'from-[#06231a] via-[#0f4c3a] to-[#10b981]',
  },
  {
    id: 'cosmic-violet',
    name: 'Cosmic Violet',
    colors: ['#170b2c', '#3c186d', '#8b5cf6'],
    bgPreview: 'from-[#170b2c] via-[#3c186d] to-[#8b5cf6]',
  },
  {
    id: 'amber-sunset',
    name: 'Sunset Amber',
    colors: ['#2e1505', '#6b3209', '#f59e0b'],
    bgPreview: 'from-[#2e1505] via-[#6b3209] to-[#f59e0b]',
  },
  {
    id: 'cyber-indigo',
    name: 'Cyber Indigo',
    colors: ['#0b132b', '#1c2541', '#3a86ff'],
    bgPreview: 'from-[#0b132b] via-[#1c2541] to-[#3a86ff]',
  },
]

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  profile,
  isPremium,
  onOpenCoverCropper,
  onSaveCover,
  onOpenPremiumModal,
  onHaptic,
  onShowToast,
}) => {
  const [isApplyingPreset, setIsApplyingPreset] = useState(false)

  if (!isOpen) return null

  const handleApplyPreset = async (preset: ThemePreset) => {
    onHaptic?.()
    if (!isPremium) {
      onOpenPremiumModal('cover')
      return
    }

    setIsApplyingPreset(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 480
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 1200, 480)
        grad.addColorStop(0, preset.colors[0])
        grad.addColorStop(0.5, preset.colors[1])
        grad.addColorStop(1, preset.colors[2])
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 1200, 480)

        // Subtle decorative particle glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
        ctx.beginPath()
        ctx.arc(900, 100, 260, 0, Math.PI * 2)
        ctx.fill()

        const dataUrl = canvas.toDataURL('image/webp', 0.92)
        await onSaveCover(dataUrl)
        onShowToast?.(`Тема «${preset.name}» установлена ✨`)
      }
    } catch (err) {
      console.error('Failed to apply preset:', err)
      onShowToast?.('Не удалось применить тему')
    } finally {
      setIsApplyingPreset(false)
    }
  }

  const handleRemoveCover = async () => {
    onHaptic?.()
    try {
      await onSaveCover(null)
      onShowToast?.('Обложка удалена')
    } catch (_) {
      onShowToast?.('Ошибка при удалении обложки')
    }
  }

  const handleSelectCustomPhoto = () => {
    onHaptic?.()
    if (!isPremium) {
      onOpenPremiumModal('cover')
      return
    }
    onClose()
    onOpenCoverCropper()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#161618] rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto animate-apple-spring relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
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

        {/* Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
            <Palette size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Кастомизация вишлиста</h2>
            <p className="text-[11px] text-zinc-400">
              Оформление профиля, обложка и внешний вид
            </p>
          </div>
        </div>

        {/* Section 1: Live Cover Banner Preview */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Обложка профиля
            </span>
            {profile.coverUrl && (
              <button
                type="button"
                onClick={handleRemoveCover}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Сбросить</span>
              </button>
            )}
          </div>

          {/* Banner Box */}
          <div className="relative aspect-[2.5/1] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg">
            {profile.coverUrl ? (
              <>
                <img
                  src={profile.coverUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-black/40 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-black via-zinc-900 to-zinc-800 flex flex-col items-center justify-center text-center p-3">
                <Layers size={22} className="text-zinc-500 mb-1" />
                <span className="text-xs font-bold text-zinc-300">
                  Стандартный тёмный фон
                </span>
                <span className="text-[10px] text-zinc-500">
                  Установите своё фото или выберите готовый стиль
                </span>
              </div>
            )}

            {/* Avatar & Name Preview Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/20 bg-zinc-800 shrink-0">
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-[10px] font-black text-white">
                      {(profile.firstName || 'А')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-white truncate">
                      {profile.firstName || 'Мой вишлист'}
                    </span>
                    {isPremium && <TelegramStarIcon size={14} />}
                  </div>
                  <span className="text-[9px] text-zinc-400 block -mt-0.5">
                    Превью для гостей
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action: Upload Photo */}
          <button
            type="button"
            onClick={handleSelectCustomPhoto}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md cursor-pointer"
          >
            <Camera size={16} />
            <span>{profile.coverUrl ? 'Загрузить другое фото' : 'Выбрать фото из галереи'}</span>
          </button>
        </div>

        {/* Section 2: Designer Theme Presets */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Готовые дизайнерские темы
            </span>
            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
              <Sparkles size={11} />
              В 1 клик
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PRESET_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleApplyPreset(theme)}
                disabled={isApplyingPreset}
                className="group relative p-2.5 rounded-2xl border border-white/10 hover:border-white/25 bg-[#1a1a1d] flex flex-col items-center gap-1.5 transition-all active:scale-95 text-center cursor-pointer disabled:opacity-50"
              >
                <div
                  className={`w-full h-10 rounded-xl bg-gradient-to-r ${theme.bgPreview} border border-white/10 shadow-inner group-hover:scale-[1.02] transition-transform`}
                />
                <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white truncate max-w-full">
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Profile & Avatar Details */}
        <div className="mt-5 p-3.5 rounded-2xl bg-[#1c1c1f] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/15 bg-zinc-800 shrink-0">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-xs font-black text-white">
                    {(profile.firstName || 'А')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-white">
                    {profile.firstName} {profile.lastName || ''}
                  </span>
                  {isPremium && <TelegramStarIcon size={14} />}
                </div>
                {profile.username && (
                  <span className="text-[10px] text-zinc-400 block">
                    @{profile.username}
                  </span>
                )}
              </div>
            </div>

            {isPremium ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                PRO ✓
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenPremiumModal('general')
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-400/15 text-amber-300 text-[10px] font-black border border-amber-400/25 active:scale-95 transition-all cursor-pointer"
              >
                Получить PRO
              </button>
            )}
          </div>

          <p className="text-[10px] text-zinc-500 leading-relaxed pt-1 border-t border-white/5">
            Аватарка и имя пользователя автоматически синхронизируются с вашим профилем в Telegram.
          </p>
        </div>
      </div>
    </div>
  )
}
