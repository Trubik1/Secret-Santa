import React, { useState } from 'react'
import { UserProfile } from '../types'
import { X, Copy, Check, Send, Sparkles } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'

interface ShareModalProps {
  isOpen: boolean
  user: UserProfile
  giftsCount: number
  onClose: () => void
  onHaptic: () => void
  onShowToast: (msg: string) => void
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  user,
  giftsCount,
  onClose,
  onHaptic,
  onShowToast,
}) => {
  const { openTelegramLink } = useTelegram()
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const botUsername = 'giftly_me_bot'
  const shareUrl = `https://t.me/${botUsername}?start=wish_${user.id}`
  const shareText = `Мой вишлист 🎁 ➔ ${shareUrl}`

  const handleCopy = async () => {
    onHaptic()
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = shareText
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      onShowToast('Ссылка скопирована в буфер!')
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {
      onShowToast('Не удалось скопировать')
    }
  }

  const handleTelegramShare = () => {
    onHaptic()
    const tgUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`
    openTelegramLink(tgUrl)
  }

  const initial = (user.firstName || 'А')[0].toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-md bg-[#161618] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto animate-apple-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-white/10 text-white">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-base font-black text-white">
                Поделиться вишлистом
              </h2>
              <p className="text-[11px] text-zinc-400">
                Отправь друзьям в Telegram
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onHaptic()
              onClose()
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Card Preview */}
        <div className="mt-4 p-4 rounded-2xl bg-zinc-900 border border-white/5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-white/10 bg-zinc-800 flex items-center justify-center shrink-0">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-base">{initial}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black text-white truncate">
              Вишлист {user.firstName} {user.lastName || ''}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {giftsCount > 0 ? `${giftsCount} желаний в списке` : 'Список желаний готов'}
            </p>
          </div>
        </div>

        {/* Link box */}
        <div className="mt-3.5 p-3 rounded-xl bg-zinc-900/80 border border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
            Короткая ссылка:
          </span>
          <p className="text-xs font-mono text-zinc-200 select-all break-all font-semibold">
            {shareUrl}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2">
          <button
            onClick={handleTelegramShare}
            className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Send size={15} />
            <span>Отправить в Telegram</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? 'Скопировано!' : 'Скопировать ссылку'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
