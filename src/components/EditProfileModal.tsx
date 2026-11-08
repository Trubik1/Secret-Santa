import React, { useState } from 'react'
import { UserProfile } from '../types'
import { X, Calendar, Loader2 } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  profile: UserProfile
  onClose: () => void
  onSave: (eventTitle: string, eventDate: string | null) => Promise<void>
  onHaptic: () => void
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
  onHaptic,
}) => {
  const [eventTitle, setEventTitle] = useState(profile.eventTitle || 'Мой День Рождения 🎂')
  const [eventDate, setEventDate] = useState(profile.eventDate || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventTitle.trim() || isSubmitting) return

    setIsSubmitting(true)
    onHaptic()
    try {
      await onSave(eventTitle.trim(), eventDate || null)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-bg-light dark:bg-bg-dark rounded-t-32 sm:rounded-32 p-6 shadow-2xl border border-border-soft dark:border-border-soft-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-soft dark:border-border-soft-dark">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose">
              <Calendar size={18} />
            </span>
            <h2 className="text-base font-extrabold text-ink-light dark:text-ink-dark">
              Настройки праздника
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-card dark:hover:bg-surface-card-dark text-ink-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
              Название события *
            </label>
            <input
              type="text"
              required
              placeholder="Например, День Рождения Артема 🎂"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-sm font-semibold text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
              Дата события
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-sm font-semibold text-ink-light dark:text-ink-dark placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-rose"
            />
            <p className="text-[11px] text-ink-muted mt-1">
              На витрине появится таймер обратного отсчета для гостей
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !eventTitle.trim()}
              className="w-full py-3.5 rounded-full bg-accent-rose text-white text-sm font-extrabold active-press shadow-lg shadow-accent-rose/25 hover:bg-accent-rose-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <span>Сохранить</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
