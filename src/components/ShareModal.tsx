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
  giftsCount,
  onClose,
  onHaptic,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const botUsername = 'yamload_bot'
  const shareUrl = `https://t.me/${botUsername}?start=wish_${user.id}`
  const shareText = `🎁 Мой вишлист в Telegram! Заходи посмотреть, что я хочу в подарок (цены в ₽ и бел. руб.):\n${shareUrl}`

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
      `🎁 Привет! Вот мой список желаний к празднику. Выбирай подарок на любой бюджет (в ₽ и бел. рублях Br)!`
    )}`
    window.open(tgUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-bg-light dark:bg-bg-dark rounded-t-32 sm:rounded-32 p-6 shadow-2xl border border-border-soft dark:border-border-soft-dark max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-border-soft-dark">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-ink-light dark:text-ink-dark">
                Поделиться вишлистом
              </h2>
              <p className="text-[11px] text-ink-muted">
                Отправь друзьям в Telegram или соцсети
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-card dark:hover:bg-surface-card-dark text-ink-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Share Preview Card */}
        <div className="mt-5 p-5 rounded-28 bg-gradient-to-br from-surface-card to-surface-soft dark:from-surface-card-dark dark:to-surface-soft-dark border border-border-soft dark:border-border-soft-dark text-center relative overflow-hidden shadow-card">
          <div className="absolute top-2 right-2 opacity-80 pointer-events-none">
            <img
              src="/stickers/bunny-heart.webp"
              alt="Mascot"
              className="w-16 h-16 object-contain"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <img
              src={user.photoUrl || '/avatar.png'}
              alt={user.firstName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-surface-card-dark shadow-md"
            />
            <h3 className="mt-2 text-base font-extrabold text-ink-light dark:text-ink-dark">
              Вишлист: {user.firstName} {user.lastName || ''}
            </h3>
            <p className="text-xs text-accent-rose font-bold mt-0.5">
              {giftsCount} {giftsCount === 1 ? 'подарок' : giftsCount < 5 ? 'подарка' : 'подарков'} · Цены в ₽ и Br
            </p>

            <div className="mt-3 px-3 py-1.5 rounded-full bg-white/70 dark:bg-black/40 text-[11px] font-mono text-ink-muted truncate max-w-full border border-border-soft/60">
              {shareUrl}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={handleTelegramShare}
            className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-accent-rose to-accent-pink text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-button active-press"
          >
            <Send size={16} />
            Отправить в Telegram чат
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-3.5 px-4 rounded-full bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-ink-light dark:text-ink-dark font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-soft transition-colors active-press"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-500" />
                <span className="text-emerald-500">Ссылка скопирована!</span>
              </>
            ) : (
              <>
                <Copy size={16} className="text-ink-muted" />
                <span>Скопировать готовый текст</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
