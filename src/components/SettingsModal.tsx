import React, { useState } from 'react'
import { UserProfile } from '../types'
import { CurrencyMode, ALL_CURRENCIES } from '../utils/currency'
import { DesignTheme, THEME_OPTIONS } from '../utils/theme'
import { X, Settings, Coins, Palette, Moon, Sun, Calendar, Sparkles, Check } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  profile: UserProfile
  isOwner: boolean
  currencyMode: CurrencyMode
  designTheme: DesignTheme
  colorScheme: 'light' | 'dark'
  onClose: () => void
  onSelectCurrency: (c: CurrencyMode) => void
  onSelectTheme: (t: DesignTheme) => void
  onToggleColorScheme: () => void
  onSaveProfile: (eventTitle: string, eventDate: string | null) => Promise<void>
  onHaptic: () => void
  onShowToast: (msg: string) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  profile,
  isOwner,
  currencyMode,
  designTheme,
  colorScheme,
  onClose,
  onSelectCurrency,
  onSelectTheme,
  onToggleColorScheme,
  onSaveProfile,
  onHaptic,
  onShowToast,
}) => {
  const [eventTitle, setEventTitle] = useState(profile.eventTitle || '')
  const [eventDate, setEventDate] = useState(profile.eventDate || '')
  const [activeTab, setActiveTab] = useState<'currency' | 'design' | 'profile'>('currency')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    onHaptic()
    try {
      await onSaveProfile(eventTitle.trim() || 'Мой День Рождения 🎂', eventDate || null)
      onShowToast('Настройки события сохранены ✨')
    } catch (_) {
      onShowToast('Не удалось сохранить')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-bg-light dark:bg-bg-dark rounded-t-32 sm:rounded-32 p-6 shadow-2xl border border-border-soft dark:border-border-soft-dark max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-border-soft-dark">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose">
                <Settings size={18} />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-ink-light dark:text-ink-dark">
                  Настройки вишлиста
                </h2>
                <p className="text-[11px] text-ink-muted">
                  Валюты, дизайн, шрифты и тема
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

          {/* Navigation Tabs */}
          <div className="mt-4 flex rounded-2xl bg-surface-soft dark:bg-surface-soft-dark p-1 border border-border-soft dark:border-border-soft-dark text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => {
                onHaptic()
                setActiveTab('currency')
              }}
              className={`flex-1 py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all active-press ${
                activeTab === 'currency'
                  ? 'bg-white dark:bg-zinc-800 text-accent-rose shadow-sm font-extrabold'
                  : 'text-ink-muted hover:text-ink-light'
              }`}
            >
              <Coins size={14} />
              <span>Валюта</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onHaptic()
                setActiveTab('design')
              }}
              className={`flex-1 py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all active-press ${
                activeTab === 'design'
                  ? 'bg-white dark:bg-zinc-800 text-accent-rose shadow-sm font-extrabold'
                  : 'text-ink-muted hover:text-ink-light'
              }`}
            >
              <Palette size={14} />
              <span>5 Стилей</span>
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  onHaptic()
                  setActiveTab('profile')
                }}
                className={`flex-1 py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all active-press ${
                  activeTab === 'profile'
                    ? 'bg-white dark:bg-zinc-800 text-accent-rose shadow-sm font-extrabold'
                    : 'text-ink-muted hover:text-ink-light'
                }`}
              >
                <Calendar size={14} />
                <span>Событие</span>
              </button>
            )}
          </div>

          {/* Tab 1: Currency Selection */}
          {activeTab === 'currency' && (
            <div className="mt-5 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-ink-muted uppercase tracking-wider">
                  Выберите валюту отображения
                </span>
                <span className="text-[11px] font-bold text-accent-rose">
                  Курсы авто-конвертации
                </span>
              </div>

              {ALL_CURRENCIES.map((c) => {
                const isSelected = currencyMode === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onHaptic()
                      onSelectCurrency(c.id)
                      onShowToast(`Валюта: ${c.name} (${c.symbol})`)
                    }}
                    className={`p-3.5 rounded-24 border cursor-pointer transition-all active-press flex items-center justify-between ${
                      isSelected
                        ? 'bg-accent-rose/10 border-accent-rose shadow-sm'
                        : 'bg-surface-card dark:bg-surface-card-dark border-border-soft dark:border-border-soft-dark hover:border-accent-rose/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl select-none">{c.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-ink-light dark:text-ink-dark">
                            {c.name}
                          </h4>
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-ink-muted font-bold">
                            {c.symbol}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {c.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-accent-rose text-white'
                          : 'border border-border-soft dark:border-border-soft-dark bg-surface-soft dark:bg-surface-soft-dark text-transparent'
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tab 2: 5 Design & Typography Styles */}
          {activeTab === 'design' && (
            <div className="mt-5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-ink-muted uppercase tracking-wider">
                  5 Вариантов шрифта и стиля
                </span>
                <span className="text-[11px] font-bold text-accent-rose">
                  Жмите для примерки
                </span>
              </div>

              {THEME_OPTIONS.map((t) => {
                const isSelected = designTheme === t.id
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      onHaptic()
                      onSelectTheme(t.id)
                      onShowToast(`Выбран стиль: ${t.name}`)
                    }}
                    className={`p-4 rounded-24 border cursor-pointer transition-all active-press ${
                      isSelected
                        ? 'bg-accent-rose/10 border-accent-rose shadow-md'
                        : 'bg-surface-card dark:bg-surface-card-dark border-border-soft dark:border-border-soft-dark hover:border-accent-rose/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent-rose block mb-0.5">
                          {t.subtitle}
                        </span>
                        <h4 className={`text-sm ${t.headingFont} text-ink-light dark:text-ink-dark`}>
                          {t.name}
                        </h4>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-accent-rose text-white'
                            : 'border border-border-soft dark:border-border-soft-dark bg-surface-soft dark:bg-surface-soft-dark text-transparent'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>

                    <p className="text-xs text-ink-muted mt-1 leading-snug">
                      {t.description}
                    </p>

                    {/* Mini live visual badge */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-[11px] font-semibold bg-white/80 dark:bg-zinc-800/80 rounded-lg border border-border-soft dark:border-border-soft-dark text-ink-light dark:text-ink-dark ${t.fontClass}`}>
                        Образец: 14 990 ₽ (~508 Br) · Мечта ✨
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Dark / Light Toggle inside design tab */}
              <div className="pt-2">
                <div className="p-3.5 rounded-24 bg-surface-soft dark:bg-surface-soft-dark border border-border-soft dark:border-border-soft-dark flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-ink-light dark:text-ink-dark">
                      Тема оформления
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {colorScheme === 'dark' ? 'Тёмная тема (Dark mode)' : 'Светлая тема (Light mode)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onHaptic()
                      onToggleColorScheme()
                    }}
                    className="p-2.5 rounded-full bg-white dark:bg-zinc-800 text-ink-light dark:text-ink-dark border border-border-soft dark:border-border-soft-dark shadow-sm active-press hover:text-accent-rose"
                  >
                    {colorScheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Profile & Event Date */}
          {activeTab === 'profile' && isOwner && (
            <form onSubmit={handleSaveEvent} className="mt-5 space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                  Название события / праздника
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например, Мой 25-й День Рождения 🎂"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-sm text-ink-light dark:text-ink-dark font-medium focus:outline-none focus:ring-2 focus:ring-accent-rose"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                  Дата праздника (для обратного отсчета)
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-border-soft dark:border-border-soft-dark text-sm text-ink-light dark:text-ink-dark font-medium focus:outline-none focus:ring-2 focus:ring-accent-rose"
                />
              </div>

              {/* Surprise mode disclaimer */}
              <div className="p-3.5 rounded-24 bg-accent-rose/10 border border-accent-rose/20 text-xs text-accent-rose dark:text-accent-rose-dark flex items-start gap-2.5">
                <Sparkles size={16} className="shrink-0 mt-0.5" />
                <div>
                  <b className="block">Режим сюрприза включён 🤫</b>
                  <span className="text-[11px] opacity-90 leading-snug block mt-0.5">
                    Вы видите только общий счётчик забронированных подарков. Имена дарителей скрыты от вас до наступления праздника!
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 rounded-full bg-accent-rose text-white font-extrabold text-sm active-press shadow-md shadow-accent-rose/25 hover:bg-accent-rose-hover transition-all"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить событие ✨'}
              </button>
            </form>
          )}
        </div>

        {/* Footer close button */}
        <div className="pt-5 mt-4 border-t border-border-soft dark:border-border-soft-dark">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-full bg-surface-soft dark:bg-surface-soft-dark text-ink-light dark:text-ink-dark font-bold text-xs active-press border border-border-soft dark:border-border-soft-dark hover:bg-surface-card transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  )
}
