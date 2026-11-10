import React, { useState } from 'react'
import { UserProfile } from '../types'
import { CurrencyMode, ALL_CURRENCIES } from '../utils/currency'
import {
  Coins,
  Calendar,
  Check,
  Copy,
  Share2,
  Gift,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

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
  // Event State
  const [hasEvent, setHasEvent] = useState<boolean>(Boolean(profile.eventTitle || profile.eventDate))
  const [isEventEditorOpen, setIsEventEditorOpen] = useState(false)
  const [eventTitle, setEventTitle] = useState(profile.eventTitle || '')
  const [eventDate, setEventDate] = useState(profile.eventDate || '')
  const [isSaving, setIsSaving] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const todayString = new Date().toISOString().split('T')[0]
  const currentCurrency = ALL_CURRENCIES.find((c) => c.id === currencyMode) || ALL_CURRENCIES[0]

  const handleSelectQuickDate = (daysAhead: number, defaultTitle?: string) => {
    onHaptic()
    const target = new Date()
    target.setDate(target.getDate() + daysAhead)
    const dateStr = target.toISOString().split('T')[0]
    setEventDate(dateStr)
    if (defaultTitle && !eventTitle) {
      setEventTitle(defaultTitle)
    }
  }

  const handleSelectHolidayChip = (title: string) => {
    onHaptic()
    setEventTitle(title)
  }

  const handleSaveEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    onHaptic()
    try {
      if (hasEvent) {
        await onSaveProfile(eventTitle.trim(), eventDate || null)
        onShowToast('Событие сохранено ✨')
      } else {
        await onSaveProfile('', null)
        onShowToast('Вишлист сделан круглогодичным ✨')
      }
      setIsEventEditorOpen(false)
    } catch (_) {
      onShowToast('Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisableEvent = async () => {
    onHaptic()
    setIsSaving(true)
    try {
      setHasEvent(false)
      setEventTitle('')
      setEventDate('')
      await onSaveProfile('', null)
      setIsEventEditorOpen(false)
      onShowToast('Вишлист теперь круглогодичный ✨')
    } catch (_) {
      onShowToast('Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyLink = () => {
    onHaptic()
    const url = `https://t.me/giftly_me_bot?start=wish_${profile.id}`
    navigator.clipboard?.writeText?.(url)
    setCopiedLink(true)
    onShowToast('Ссылка скопирована в буфер 🔗')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="w-full px-4 pt-3 pb-28 animate-fade-in space-y-3">
      {/* Page Title */}
      <div className="mb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#c4457b]">
          Параметры
        </span>
        <h1 className="text-xl font-black text-white mt-0.5">
          Настройки ⚙️
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Управление валютой, событием и ссылкой на вишлист
        </p>
      </div>

      {/* ======================================================== */}
      {/* BENTO GRID DASHBOARD (Clean iOS 18 Tiles)                */}
      {/* ======================================================== */}

      {/* Bento 1: Top Wide Profile & Status Card */}
      <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c4457b]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-[#c4457b] to-[#d98aab] flex items-center justify-center text-white font-black text-lg shadow-sm border border-white/10 shrink-0">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.firstName} className="w-full h-full object-cover" />
              ) : (
                (profile.firstName || 'А')[0].toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-black text-white truncate">
                {profile.firstName} {profile.lastName || ''}
              </h3>
              {profile.username && (
                <p className="text-[11px] text-zinc-400 truncate">@{profile.username}</p>
              )}
              <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Вишлист активен</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="p-2.5 rounded-2xl bg-[#241920] border border-[#c4457b]/30 text-[#c4457b] active-press hover:bg-[#c4457b] hover:text-white transition-all shadow-sm shrink-0"
            title="Скопировать ссылку"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Bento 2 & 3: Two Middle Square Tiles */}
      <div className="grid grid-cols-2 gap-3">
        {/* Square Tile: Currency */}
        <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Валюта
              </span>
              <Coins size={14} className="text-[#c4457b]" />
            </div>

            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl leading-none">{currentCurrency.flag}</span>
              <span className="text-lg font-black text-white">{currencyMode.toUpperCase()}</span>
            </div>

            <div className="text-[11px] text-[#c4457b] font-extrabold mt-0.5">
              Символ: {currentCurrency.symbol}
            </div>
          </div>

          {/* Quick 1-tap currency selector chips inside the tile */}
          <div className="grid grid-cols-5 gap-1 mt-3">
            {ALL_CURRENCIES.map((c) => {
              const isSelected = currencyMode === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    onHaptic()
                    onSelectCurrency(c.id)
                    onShowToast(`Валюта: ${c.name} (${c.symbol})`)
                  }}
                  className={`py-1.5 rounded-lg text-[10px] font-black flex items-center justify-center border transition-all active-press ${
                    isSelected
                      ? 'bg-[#c4457b] text-white border-[#c4457b] shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                  title={c.name}
                >
                  {c.id.toUpperCase()}
                </button>
              )
            })}
          </div>
        </div>

        {/* Square Tile: Holiday / Event */}
        <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Праздник
              </span>
              <Calendar size={14} className="text-[#c4457b]" />
            </div>

            <div className="text-xs font-black text-white mt-1.5 line-clamp-1">
              {hasEvent && eventTitle ? eventTitle : 'Круглогодичный'}
            </div>

            <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
              {hasEvent && eventDate ? `Дата: ${eventDate}` : 'Без привязки к дате ♾️'}
            </div>
          </div>

          <button
            onClick={() => {
              onHaptic()
              setHasEvent(true)
              setIsEventEditorOpen(!isEventEditorOpen)
            }}
            className={`w-full py-2 rounded-xl text-[10px] font-black border transition-all active-press mt-3 flex items-center justify-center gap-1 ${
              hasEvent && eventTitle
                ? 'bg-[#241920] border-[#c4457b]/60 text-[#c4457b]'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
            }`}
          >
            <span>{hasEvent && eventTitle ? 'Изменить дату' : '+ Добавить дату'}</span>
            {isEventEditorOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Event Editor Accordion (Smoothly opens when user taps event button) */}
      {isEventEditorOpen && isOwner && (
        <div className="p-4 rounded-3xl bg-[#17171a] border border-[#c4457b]/50 shadow-md animate-fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-[#34252f] pb-2">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <Calendar size={14} className="text-[#c4457b]" />
              <span>Настройка события</span>
            </h4>
            {hasEvent && (
              <button
                type="button"
                onClick={handleDisableEvent}
                className="text-[10px] font-bold text-rose-400 hover:underline"
              >
                Отключить дату
              </button>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
              Быстрый повод
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['День Рождения 🎂', 'Новый Год 🎄', 'Новоселье 🏠', 'Свадьба 💍'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSelectHolidayChip(chip)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all active-press ${
                    eventTitle === chip
                      ? 'bg-[#c4457b] text-white border-[#c4457b]'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Или введите свой повод (например, Юбилей)"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-[#c4457b]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
              Срок
            </label>
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-[#c4457b]"
            />
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveEvent}
            className="w-full py-2.5 rounded-full bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black shadow-md shadow-[#c4457b]/25 active-press transition-all flex items-center justify-center gap-1.5"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить событие ✨'}
          </button>
        </div>
      )}

      {/* Bento 4: Wide Wishlist Link Tile */}
      <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] shadow-sm flex items-center justify-between">
        <div className="min-w-0 pr-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Ссылка на вишлист
          </span>
          <p className="text-xs text-white font-bold truncate mt-0.5">
            t.me/giftly_me_bot?start=wish_{profile.id}
          </p>
          <span className="text-[10px] text-zinc-400 block mt-0.5">
            Отправьте друзьям, чтобы они выбрали подарок
          </span>
        </div>

        <button
          onClick={handleCopyLink}
          className="px-3.5 py-2.5 rounded-2xl bg-[#241920] border border-[#c4457b]/40 text-[#c4457b] text-xs font-black flex items-center gap-1.5 active-press shrink-0 hover:bg-[#c4457b] hover:text-white transition-all shadow-sm"
        >
          {copiedLink ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
          <span>{copiedLink ? 'Скопировано!' : 'Копировать'}</span>
        </button>
      </div>

      {/* Bento 5: Wishlist Summary Card */}
      <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] shadow-sm flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-[#241920] border border-[#c4457b]/20 flex items-center justify-center text-[#c4457b] shrink-0">
          <Gift size={18} />
        </div>
        <div>
          <h4 className="text-xs font-black text-white">Список желаний готов</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
            Друзья могут бронировать подарки и скидываться. Список обновляется автоматически.
          </p>
        </div>
      </div>
    </div>
  )
}
