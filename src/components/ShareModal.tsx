import React, { useState } from 'react'
import { UserProfile } from '../types'
import { X, Copy, Check, Send, Sparkles } from 'lucide-react'

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
  onClose,
  onHaptic,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const botUsername = 'yamload_bot'
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
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
      `Мой вишлист 🎁 ➔`
    )}`
    window.open(tgUrl, '_blank')
  }

  const initial = (user.firstName || 'А')[0].toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-surface-card dark:bg-[#17171a] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-border-soft dark:border-[#34252f] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#34252f]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-base font-black text-ink-light dark:text-white">
                Поделиться вишлистом
              </h2>
              <p className="text-[11px] text-ink-muted">
                Отправь друзьям в Telegram
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onHaptic()
              onClose()
            }}
            className="p-1.5 rounded-full text-ink-muted hover:text-ink-light dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Clean Apple HIG Share Preview Card (No cartoon stickers) */}
        <div className="mt-4 p-4 rounded-2xl bg-surface-soft dark:bg-[#241920]/60 border border-border-soft dark:border-[#34252f] text-center">
          <div className="flex flex-col items-center">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.firstName}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-accent-rose/40 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-accent-rose to-accent-pink text-white flex items-center justify-center font-black text-xl shadow-sm">
                {initial}
              </div>
            )}

            <h3 className="mt-2.5 text-sm font-black text-ink-light dark:text-white">
              {user.firstName} {user.lastName || ''}
            </h3>
            {user.username && (
              <span className="text-[11px] font-semibold text-ink-muted">
                @{user.username}
              </span>
            )}

            {/* Clickable Invitation text formatted cleanly */}
            <div className="mt-3 w-full p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-border-soft dark:border-zinc-800 text-xs font-bold text-ink-light dark:text-zinc-200 flex items-center justify-center gap-1.5 truncate">
              <span>Мой вишлист 🎁 ➔</span>
              <span className="text-[#c4457b] font-mono truncate">{shareUrl}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2.5">
          <button
            onClick={handleTelegramShare}
            className="w-full py-3.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-black shadow-lg shadow-sky-500/25 active-press flex items-center justify-center gap-2 transition-all"
          >
            <Send size={15} />
            <span>Отправить в Telegram</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-full bg-surface-soft dark:bg-zinc-800 border border-border-soft dark:border-zinc-700 text-ink-light dark:text-white text-xs font-bold hover:border-[#c4457b] active-press flex items-center justify-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check size={15} className="text-emerald-500" />
                <span className="text-emerald-500">Скопировано!</span>
              </>
            ) : (
              <>
                <Copy size={15} />
                <span>Скопировать ссылку</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
