import React, { useState } from 'react'
import { UserProfile } from '../types'
import { CurrencyMode, ALL_CURRENCIES } from '../utils/currency'
import {
  Coins,
  Calendar,
  Check,
  Copy,
  Share2,
  Sparkles,
  Shield,
  SlidersHorizontal,
  Layers,
  LayoutGrid,
} from 'lucide-react'

type SettingsVariant = 'ios' | 'tabs' | 'bento'

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
  // Variant choice (persisted in localStorage)
  const [variant, setVariant] = useState<SettingsVariant>(() => {
    try {
      const saved = localStorage.getItem('wishlist_settings_variant') as SettingsVariant
      if (saved === 'ios' || saved === 'tabs' || saved === 'bento') return saved
    } catch (_) {}
    return 'ios'
  })

  // Sub-tab for Variant 2 (Tabs)
  const [activeSubTab, setActiveSubTab] = useState<'currency' | 'event' | 'profile'>('currency')

  // Event State
  const [hasEvent, setHasEvent] = useState<boolean>(Boolean(profile.eventTitle || profile.eventDate))
  const [eventTitle, setEventTitle] = useState(profile.eventTitle || '')
  const [eventDate, setEventDate] = useState(profile.eventDate || '')
  const [isSaving, setIsSaving] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const todayString = new Date().toISOString().split('T')[0]

  const handleSelectVariant = (v: SettingsVariant) => {
    onHaptic()
    setVariant(v)
    try {
      localStorage.setItem('wishlist_settings_variant', v)
    } catch (_) {}
  }

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
      onShowToast('Вишлист теперь круглогодичный')
    }
  }

  const handleCopyLink = () => {
    onHaptic()
    const url = `https://t.me/yamload_bot?start=wish_${profile.id}`
    navigator.clipboard?.writeText?.(url)
    setCopiedLink(true)
    onShowToast('Ссылка скопирована в буфер 🔗')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="w-full px-4 pt-3 pb-28 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#c4457b]">
            Параметры
          </span>
          <h1 className="text-xl font-black text-white mt-0.5">
            Настройки ⚙️
          </h1>
        </div>
      </div>

      {/* VARIANT SWITCHER TABS (Live interactive testing) */}
      <div className="mb-5 p-1 rounded-2xl bg-[#17171a] border border-[#34252f] shadow-sm">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 px-2 py-1 flex items-center justify-between">
          <span>Стиль экрана:</span>
          <span className="text-[#c4457b] font-black">Переключайте для теста</span>
        </div>
        <div className="grid grid-cols-3 gap-1 mt-1">
          <button
            onClick={() => handleSelectVariant('ios')}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active-press ${
              variant === 'ios'
                ? 'bg-[#c4457b] text-white shadow-md shadow-[#c4457b]/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>1. iOS Секции</span>
          </button>

          <button
            onClick={() => handleSelectVariant('tabs')}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active-press ${
              variant === 'tabs'
                ? 'bg-[#c4457b] text-white shadow-md shadow-[#c4457b]/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Layers size={13} />
            <span>2. Вкладки</span>
          </button>

          <button
            onClick={() => handleSelectVariant('bento')}
            className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active-press ${
              variant === 'bento'
                ? 'bg-[#c4457b] text-white shadow-md shadow-[#c4457b]/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <LayoutGrid size={13} />
            <span>3. Bento Сетка</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VARIANT 1: APPLE iOS SECTIONS (Compact, 1-Click Chips) */}
      {/* ======================================================== */}
      {variant === 'ios' && (
        <div className="space-y-4 animate-fade-in">
          {/* 1. Currency selector: Compact 5-in-a-row */}
          <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Coins size={15} className="text-[#c4457b]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-white">
                  Валюта вишлиста
                </h2>
              </div>
              <span className="text-[10px] text-zinc-400 font-bold">1 тап для смены</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
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
                    className={`py-2 px-1 rounded-xl border text-center transition-all active-press flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'border-[#c4457b] bg-[#241920] text-white ring-1 ring-[#c4457b] shadow-sm'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="text-[11px] font-black">{c.id.toUpperCase()}</span>
                    <span className="text-[9px] text-[#c4457b] font-bold">{c.symbol}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Event Binding (Off by default, smart toggle) */}
          {isOwner && (
            <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#241920] flex items-center justify-center text-[#c4457b]">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">
                      Привязать к празднику
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {hasEvent ? 'Установлена дата события' : 'По умолчанию бессрочный вишлист'}
                    </p>
                  </div>
                </div>

                {/* iOS Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasEvent}
                  onClick={() => handleToggleHasEvent(!hasEvent)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                    hasEvent ? 'bg-[#c4457b] shadow-md shadow-[#c4457b]/30' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      hasEvent ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {hasEvent && (
                <form onSubmit={handleSaveEvent} className="mt-4 pt-3.5 border-t border-[#34252f] space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Повод
                    </label>
                    {/* Quick holiday chips */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
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
                      placeholder="Например, Мой юбилей или День Рождения"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-[#c4457b]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Срок / Дата
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
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-2.5 rounded-full bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black shadow-md shadow-[#c4457b]/25 active-press transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить событие ✨'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 3. Wishlist Share Link Tile */}
          <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Ссылка на ваш вишлист
              </span>
              <p className="text-xs text-white font-bold truncate mt-0.5">
                t.me/yamload_bot?start=wish_{profile.id}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-[#241920] border border-[#c4457b]/40 text-[#c4457b] text-xs font-black flex items-center gap-1.5 active-press shrink-0 hover:bg-[#c4457b] hover:text-white transition-all"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Скопировано' : 'Копировать'}</span>
            </button>
          </div>

          {/* 4. Privacy Hint */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-2.5">
            <Shield size={16} className="text-[#c4457b] shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <b>Режим сюрприза включён:</b> ваши друзья видят, кто из них забронировал подарок, но для вас это остаётся тайной до момента вручения!
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 2: SEGMENTED TABS (Currency / Event / Profile)    */}
      {/* ======================================================== */}
      {variant === 'tabs' && (
        <div className="space-y-4 animate-fade-in">
          {/* Sub-tab Navigation */}
          <div className="p-1 rounded-2xl bg-[#17171a] border border-[#34252f] flex items-center justify-between">
            <button
              onClick={() => {
                onHaptic()
                setActiveSubTab('currency')
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all text-center ${
                activeSubTab === 'currency'
                  ? 'bg-[#c4457b] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              💵 Валюта
            </button>
            <button
              onClick={() => {
                onHaptic()
                setActiveSubTab('event')
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all text-center ${
                activeSubTab === 'event'
                  ? 'bg-[#c4457b] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📅 Праздник
            </button>
            <button
              onClick={() => {
                onHaptic()
                setActiveSubTab('profile')
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all text-center ${
                activeSubTab === 'profile'
                  ? 'bg-[#c4457b] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              👤 Профиль
            </button>
          </div>

          {/* SubTab 1: Currency detailed list */}
          {activeSubTab === 'currency' && (
            <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] space-y-2.5 animate-fade-in">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Выберите активную валюту
              </span>
              {ALL_CURRENCIES.map((c) => {
                const isSelected = currencyMode === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onHaptic()
                      onSelectCurrency(c.id)
                      onShowToast(`Валюта: ${c.name}`)
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all active-press ${
                      isSelected
                        ? 'border-[#c4457b] bg-[#241920] text-white ring-1 ring-[#c4457b]'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <div className="text-xs font-black text-white">{c.name}</div>
                        <div className="text-[10px] text-zinc-400">{c.description}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[#c4457b] text-white flex items-center justify-center">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* SubTab 2: Event */}
          {activeSubTab === 'event' && (
            <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-white">Праздничное событие</h3>
                  <p className="text-[10px] text-zinc-400">Включите, если вишлист к конкретной дате</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleHasEvent(!hasEvent)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
                    hasEvent ? 'bg-[#c4457b]' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      hasEvent ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {hasEvent && (
                <form onSubmit={handleSaveEvent} className="space-y-3 pt-3 border-t border-[#34252f]">
                  <div>
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Название</label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Например, День Рождения 🎂"
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-zinc-800 text-xs font-bold text-white border border-zinc-700 focus:outline-none focus:border-[#c4457b]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Дата</label>
                    <input
                      type="date"
                      min={todayString}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-zinc-800 text-xs font-bold text-white border border-zinc-700 focus:outline-none focus:border-[#c4457b]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-full bg-[#c4457b] text-white text-xs font-black active-press"
                  >
                    Сохранить изменения ✨
                  </button>
                </form>
              )}
            </div>
          )}

          {/* SubTab 3: Profile */}
          {activeSubTab === 'profile' && (
            <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] space-y-3.5 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#c4457b] to-[#d98aab] flex items-center justify-center text-white font-black text-lg">
                  {(profile.firstName || 'А')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{profile.firstName} {profile.lastName || ''}</h3>
                  <p className="text-[11px] text-zinc-400">@{profile.username || 'user'}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                <span className="text-[10px] font-black uppercase text-zinc-400">Ссылка для друзей</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    readOnly
                    value={`t.me/yamload_bot?start=wish_${profile.id}`}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 font-bold border border-zinc-700"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-xl bg-[#c4457b] text-white shrink-0 active-press"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VARIANT 3: BENTO GRID DASHBOARD (iOS 18 Widgets)          */}
      {/* ======================================================== */}
      {variant === 'bento' && (
        <div className="space-y-3 animate-fade-in">
          {/* Top Wide Bento: Profile & Wishlist Status */}
          <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#c4457b]/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#241920] border border-[#c4457b]/30 flex items-center justify-center text-[#c4457b] font-black text-base">
                  {(profile.firstName || 'А')[0]}
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">{profile.firstName}</h3>
                  <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Вишлист онлайн</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-2xl bg-[#241920] border border-[#c4457b]/30 text-[#c4457b] active-press hover:bg-[#c4457b] hover:text-white transition-colors"
                title="Скопировать ссылку"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* 2 Middle Bento Squares */}
          <div className="grid grid-cols-2 gap-3">
            {/* Square 1: Currency Tile */}
            <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                  Валюта
                </span>
                <div className="text-xl font-black text-white mt-1">
                  {currencyMode.toUpperCase()}
                </div>
                <div className="text-[11px] text-[#c4457b] font-bold mt-0.5">
                  {ALL_CURRENCIES.find((c) => c.id === currencyMode)?.symbol}
                </div>
              </div>

              {/* Quick cycle button */}
              <div className="flex items-center gap-1 mt-3 flex-wrap">
                {ALL_CURRENCIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onHaptic()
                      onSelectCurrency(c.id)
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center border transition-all active-press ${
                      currencyMode === c.id
                        ? 'bg-[#c4457b] text-white border-[#c4457b]'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {c.id.slice(0, 1).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Square 2: Event Tile */}
            <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                  Праздник
                </span>
                <div className="text-xs font-black text-white mt-1.5 line-clamp-1">
                  {hasEvent && eventTitle ? eventTitle : 'Круглогодичный'}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  {hasEvent && eventDate ? eventDate : 'Без даты ♾️'}
                </div>
              </div>

              <button
                onClick={() => {
                  handleToggleHasEvent(!hasEvent)
                }}
                className={`w-full py-1.5 rounded-xl text-[10px] font-black border transition-all active-press mt-2 ${
                  hasEvent
                    ? 'bg-[#241920] border-[#c4457b] text-[#c4457b]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                {hasEvent ? 'Событие активно ✓' : '+ Добавить дату'}
              </button>
            </div>
          </div>

          {/* Bottom Bento: Secret Mode */}
          <div className="p-4 rounded-3xl bg-[#17171a] border border-[#34252f] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Режим сюрприза</h4>
                <p className="text-[10px] text-zinc-400">Дарители скрыты от владельца</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
              Включён
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
