import React, { useState } from 'react'
import { UserProfile } from '../types'
import { CurrencyMode, ALL_CURRENCIES } from '../utils/currency'
import { X, Settings, Coins, Moon, Sun, Calendar, Check, Trash2 } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  profile: UserProfile
  isOwner: boolean
  currencyMode: CurrencyMode
  colorScheme: 'light' | 'dark'
  onClose: () => void
  onSelectCurrency: (c: CurrencyMode) => void
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
  colorScheme,
  onClose,
  onSelectCurrency,
  onToggleColorScheme,
  onSaveProfile,
  onHaptic,
  onShowToast,
}) => {
  const [eventTitle, setEventTitle] = useState(profile.eventTitle || '')
  const [eventDate, setEventDate] = useState(profile.eventDate || '')
  const [activeTab, setActiveTab] = useState<'currency' | 'profile'>('currency')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const todayString = new Date().toISOString().split('T')[0]

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    onHaptic()
    try {
      await onSaveProfile(eventTitle.trim(), eventDate || null)
      onShowToast('Настройки вишлиста сохранены ✨')
    } catch (_) {
      onShowToast('Не удалось сохранить')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearEvent = async () => {
    setEventTitle('')
    setEventDate('')
    setIsSaving(true)
    onHaptic()
    try {
      await onSaveProfile('', null)
      onShowToast('Привязка к празднику отключена ✨')
    } catch (_) {
      onShowToast('Ошибка сброса')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-surface-card dark:bg-[#17171a] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-border-soft dark:border-[#34252f] max-h-[90vh] overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#34252f]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose">
                <Settings size={18} />
              </span>
              <div>
                <h2 className="text-base font-black text-ink-light dark:text-white">
                  Настройки
                </h2>
                <p className="text-[11px] text-ink-muted">
                  Валюта, тема и настройки вишлиста
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

          {/* Quick Theme Switcher (Dark / Light) */}
          <div className="mt-3.5 p-3 rounded-2xl bg-surface-soft dark:bg-[#241920]/60 border border-border-soft dark:border-[#34252f] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {colorScheme === 'dark' ? (
                <Moon size={16} className="text-amber-400" />
              ) : (
                <Sun size={16} className="text-amber-500" />
              )}
              <span className="text-xs font-bold text-ink-light dark:text-white">
                {colorScheme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onHaptic()
                onToggleColorScheme()
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-border-soft dark:border-zinc-700 text-xs font-bold text-ink-light dark:text-white active-press"
            >
              Переключить
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-3 flex rounded-xl bg-surface-soft dark:bg-zinc-800/80 p-1 border border-border-soft dark:border-zinc-700 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => {
                onHaptic()
                setActiveTab('currency')
              }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all active-press ${
                activeTab === 'currency'
                  ? 'bg-white dark:bg-[#241920] text-accent-rose shadow-sm font-black'
                  : 'text-ink-muted hover:text-ink-light dark:hover:text-white'
              }`}
            >
              <Coins size={14} />
              <span>Валюта отображения</span>
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  onHaptic()
                  setActiveTab('profile')
                }}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all active-press ${
                  activeTab === 'profile'
                    ? 'bg-white dark:bg-[#241920] text-accent-rose shadow-sm font-black'
                    : 'text-ink-muted hover:text-ink-light dark:hover:text-white'
                }`}
              >
                <Calendar size={14} />
                <span>Праздник / Дата</span>
              </button>
            )}
          </div>

          {/* Tab 1: Currency Selection (Strictly Single Currencies, No "Both") */}
          {activeTab === 'currency' && (
            <div className="mt-3.5 space-y-2">
              <p className="text-[11px] text-ink-muted mb-2 font-medium">
                Выберите валюту. Все цены в вишлисте и формах будут отображаться строго в ней:
              </p>
              {ALL_CURRENCIES.map((c) => {
                const isSelected = currencyMode === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onHaptic()
                      onSelectCurrency(c.id)
                      onShowToast(`Валюта: ${c.name}`)
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all active-press ${
                      isSelected
                        ? 'border-[#c4457b] bg-[#241920]/70 text-ink-light dark:text-white ring-1 ring-[#c4457b]'
                        : 'border-border-soft dark:border-[#34252f] hover:border-zinc-500 bg-surface-soft/60 dark:bg-[#17171a]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{c.flag}</span>
                      <div>
                        <div className="text-xs font-black text-ink-light dark:text-white flex items-center gap-1.5">
                          <span>{c.name}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-[10px] text-[#c4457b] font-black">
                            {c.symbol}
                          </span>
                        </div>
                        <div className="text-[11px] text-ink-muted mt-0.5">{c.description}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[#c4457b] text-white flex items-center justify-center shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Tab 2: Profile / Event Settings (Optional, cannot pick past dates) */}
          {activeTab === 'profile' && isOwner && (
            <form onSubmit={handleSaveEvent} className="mt-3.5 space-y-3.5">
              <p className="text-[11px] text-ink-muted font-medium">
                Вишлист можно привязать к событию (День Рождения, Новый Год) или оставить бессрочным:
              </p>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-muted mb-1">
                  Название праздника (необязательно)
                </label>
                <input
                  type="text"
                  placeholder="Например, День Рождения 🎂 (или пусто)"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-soft dark:bg-zinc-800/80 border border-border-soft dark:border-zinc-700 text-xs font-bold text-ink-light dark:text-white focus:outline-none focus:border-[#c4457b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-muted mb-1">
                  Дата события (только будущие даты)
                </label>
                <input
                  type="date"
                  min={todayString}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-soft dark:bg-zinc-800/80 border border-border-soft dark:border-zinc-700 text-xs font-bold text-ink-light dark:text-white focus:outline-none focus:border-[#c4457b]"
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  Выбрать старую дату невозможно. Если дату не указывать — таймер будет скрыт.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-full bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black shadow-md shadow-[#c4457b]/25 active-press transition-all"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>

                {(eventTitle || eventDate) && (
                  <button
                    type="button"
                    onClick={handleClearEvent}
                    disabled={isSaving}
                    title="Сделать вишлист бессрочным"
                    className="p-3 rounded-full bg-surface-soft dark:bg-zinc-800 border border-border-soft dark:border-zinc-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 active-press"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer close button */}
        <div className="pt-4 mt-4 border-t border-border-soft dark:border-[#34252f]">
          <button
            type="button"
            onClick={() => {
              onHaptic()
              onClose()
            }}
            className="w-full py-2.5 rounded-xl bg-surface-soft dark:bg-zinc-800 text-ink-light dark:text-zinc-300 text-xs font-extrabold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  )
}
