import React, { useState } from 'react'
import { UserProfile } from '../types'
import { CurrencyMode, ALL_CURRENCIES } from '../utils/currency'
import { Coins, Calendar, Check } from 'lucide-react'

interface SettingsPageProps {
  profile: UserProfile
  isOwner: boolean
  currencyMode: CurrencyMode
  onSelectCurrency: (c: CurrencyMode) => void
  onSaveProfile: (eventTitle: string, eventDate: string | null) => Promise<void>
  onHaptic: () => void
  onShowToast: (msg: string) => void
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  isOwner,
  currencyMode,
  onSelectCurrency,
  onSaveProfile,
  onHaptic,
  onShowToast,
}) => {
  const [hasEvent, setHasEvent] = useState<boolean>(Boolean(profile.eventTitle || profile.eventDate))
  const [eventTitle, setEventTitle] = useState(profile.eventTitle || '')
  const [eventDate, setEventDate] = useState(profile.eventDate || '')
  const [isSaving, setIsSaving] = useState(false)

  const todayString = new Date().toISOString().split('T')[0]

  const handleSelectQuickDate = (daysAhead: number, title?: string) => {
    onHaptic()
    const target = new Date()
    target.setDate(target.getDate() + daysAhead)
    const dateStr = target.toISOString().split('T')[0]
    setEventDate(dateStr)
    if (title && !eventTitle) {
      setEventTitle(title)
    }
  }

  const handleSaveEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    onHaptic()
    try {
      if (hasEvent) {
        await onSaveProfile(eventTitle.trim(), eventDate || null)
        onShowToast('Настройки сохранены ✨')
      } else {
        await onSaveProfile('', null)
        onShowToast('Вишлист сделан круглогодичным ✨')
      }
    } catch (_) {
      onShowToast('Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleHasEvent = async (enabled: boolean) => {
    onHaptic()
    setHasEvent(enabled)
    if (!enabled) {
      setEventTitle('')
      setEventDate('')
      await onSaveProfile('', null)
      onShowToast('Праздник отключён (круглогодичный вишлист)')
    }
  }

  return (
    <div className="w-full px-4 pt-3 pb-28 animate-fade-in">
      {/* Page Header */}
      <div className="mb-4">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#c4457b]">
          Параметры
        </span>
        <h1 className="text-xl font-black text-ink-light dark:text-white mt-0.5">
          Настройки ⚙️
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Управление валютой, праздничной датой и списком желаний.
        </p>
      </div>

      {/* SECTION 1: CURRENCY (Instant auto-save, single tap) */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Coins size={15} className="text-[#c4457b]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-300">
            Валюта вишлиста
          </h2>
        </div>

        <div className="space-y-2">
          {ALL_CURRENCIES.map((c) => {
            const isSelected = currencyMode === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onHaptic()
                  onSelectCurrency(c.id)
                  onShowToast(`Валюта переключена на ${c.name}`)
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all active-press ${
                  isSelected
                    ? 'border-[#c4457b] bg-[#241920]/80 text-white ring-1 ring-[#c4457b] shadow-sm'
                    : 'border-border-soft dark:border-[#34252f] hover:border-zinc-500 bg-surface-card dark:bg-[#17171a]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{c.flag}</span>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>{c.name}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-[10px] text-[#c4457b] font-black">
                        {c.symbol}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{c.description}</div>
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
      </div>

      {/* SECTION 2: EVENT & DATE (Optional, off by default, quick chips) */}
      {isOwner && (
        <div className="p-4 rounded-3xl bg-surface-card dark:bg-[#17171a] border border-border-soft dark:border-[#34252f] shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#c4457b]" />
              <div>
                <h3 className="text-xs font-black text-white">
                  Привязать к празднику
                </h3>
                <p className="text-[11px] text-zinc-400">
                  По умолчанию вишлист бессрочный
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={hasEvent}
              onClick={() => handleToggleHasEvent(!hasEvent)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                hasEvent
                  ? 'bg-[#c4457b] shadow-md shadow-[#c4457b]/30'
                  : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  hasEvent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Form fields shown only when event is active */}
          {hasEvent && (
            <form onSubmit={handleSaveEvent} className="mt-4 pt-3.5 border-t border-[#34252f] space-y-3.5 animate-fade-in">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1">
                  Название события
                </label>
                <input
                  type="text"
                  placeholder="Например, День Рождения или Новый Год 🎄"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-[#c4457b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1">
                  Дата события
                </label>

                {/* Quick Date Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <button
                    type="button"
                    onClick={() => handleSelectQuickDate(7, 'Праздник 🎉')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300 border border-zinc-700 active-press"
                  >
                    +1 неделя
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectQuickDate(14, 'Праздник 🎉')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300 border border-zinc-700 active-press"
                  >
                    +2 недели
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectQuickDate(30, 'Праздник 🎉')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300 border border-zinc-700 active-press"
                  >
                    +1 месяц
                  </button>
                </div>

                <input
                  type="date"
                  min={todayString}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-[#c4457b]"
                />
              </div>

              {/* Single Save Action Button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 rounded-full bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black shadow-md shadow-[#c4457b]/25 active-press transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить событие ✨'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
