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
  ChevronRight,
  BarChart3,
  Palette,
} from 'lucide-react'
import { TelegramStarIcon } from './PremiumModal'

interface SettingsPageProps {
  profile: UserProfile
  isOwner: boolean
  currencyMode: CurrencyMode
  onSelectCurrency: (c: CurrencyMode) => void
  onSaveProfile: (eventTitle: string, eventDate: string | null) => Promise<void>
  onHaptic: () => void
  onShowToast: (msg: string) => void
  onOpenPremiumModal: () => void
  onOpenAdminModal: () => void
  onOpenCustomization?: () => void
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  isOwner,
  currencyMode,
  onSelectCurrency,
  onSaveProfile,
  onHaptic,
  onShowToast,
  onOpenPremiumModal,
  onOpenAdminModal,
  onOpenCustomization,
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
    <div className="w-full pt-2 pb-28 select-none animate-fadeIn space-y-3">
      {/* Studio Minimal Header */}
      <div className="mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Параметры
        </span>
        <h1 className="text-lg sm:text-xl font-black text-white mt-0.5">
          Настройки
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Управление валютой, событием и ссылкой на вишлист
        </p>
      </div>

      {/* Bento 1: Top Wide Profile Card */}
      <div className="p-4 rounded-3xl bg-[#161618] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 ring-1 ring-white/10 flex items-center justify-center text-white font-black text-lg shrink-0">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.firstName} className="w-full h-full object-cover" />
              ) : (
                (profile.firstName || 'А')[0].toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-white truncate">
                  {profile.firstName} {profile.lastName || ''}
                </h3>
                {profile.isPremium && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-black border border-amber-400/30">
                    <TelegramStarIcon size={11} />
                    PRO
                  </span>
                )}
              </div>
              {profile.username && (
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">@{profile.username}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-colors active:scale-95 shrink-0 cursor-pointer"
            title="Скопировать ссылку"
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      {/* Action Banner 0: Profile Customization & Cover */}
      <button
        type="button"
        onClick={() => {
          onHaptic()
          onOpenCustomization?.()
        }}
        className="w-full p-4 rounded-3xl bg-[#161618] hover:bg-[#1a1a1d] border border-white/10 hover:border-white/20 shadow-xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer group text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
            <Palette size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white tracking-tight">Кастомизация вишлиста</span>
              {profile.coverUrl ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                  Обложка есть ✓
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[10px] font-bold">
                  Обложка и стили
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
              Обложка профиля, готовые темы и визуальный стиль
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 text-zinc-400 group-hover:text-white flex items-center justify-center shrink-0 ml-2 transition-colors">
          <ChevronRight size={15} />
        </div>
      </button>

      {/* Action Banner 1: PRO Account Card / Upgrade Button */}
      {profile.isPremium ? (
        <div className="p-4 rounded-3xl bg-[#161618] border border-white/10 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
              <TelegramStarIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white">Giftly PRO</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/25">
                  Активен
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Безлимит желаний, своя обложка и статус разблокированы
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onHaptic()
              onOpenPremiumModal()
            }}
            className="text-[10px] font-bold text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors shrink-0 cursor-pointer"
          >
            Инфо
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            onHaptic()
            onOpenPremiumModal()
          }}
          className="w-full p-4 rounded-3xl bg-[#161618] hover:bg-[#1a1a1d] border border-white/10 hover:border-white/20 shadow-xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <TelegramStarIcon size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white tracking-tight">Giftly PRO</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-black border border-amber-400/25">
                  50 ⭐
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                Безлимит желаний, своя обложка профиля и золотой бейдж
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 text-zinc-400 group-hover:text-white flex items-center justify-center shrink-0 ml-2 transition-colors">
            <ChevronRight size={15} />
          </div>
        </button>
      )}

      {/* Action Banner 2: Admin Dashboard Button (Only for Creator: Telegram ID 1211235294) */}
      {profile.id === 1211235294 && (
        <button
          type="button"
          onClick={() => {
            onHaptic()
            onOpenAdminModal()
          }}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-zinc-900 to-indigo-500/15 hover:from-purple-500/25 hover:to-indigo-500/25 border border-purple-500/30 shadow-lg shadow-purple-500/10 flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white">Панель создателя (Admin)</span>
                <span className="px-1.5 py-0.5 rounded-full bg-purple-400/20 text-purple-300 text-[9px] font-bold border border-purple-400/30">
                  Creator Access
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Статистика пользователей, средний чек, исполненные цели за 30 дней
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/20 text-purple-300 flex items-center justify-center shrink-0 ml-2 transition-colors">
            <ChevronRight size={15} />
          </div>
        </button>
      )}

      {/* Bento 2 & 3: Two Middle Square Tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Square Tile: Currency */}
        <div className="p-4 rounded-3xl bg-[#161618] border border-white/10 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Валюта
              </span>
              <Coins size={14} className="text-zinc-400" />
            </div>

            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl leading-none">{currentCurrency.flag}</span>
              <span className="text-base sm:text-lg font-black text-white">{currencyMode.toUpperCase()}</span>
            </div>

            <div className="text-[11px] text-zinc-400 font-bold mt-0.5">
              Символ: {currentCurrency.symbol}
            </div>
          </div>

          {/* Quick 1-tap currency selector chips */}
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
                  className={`py-1.5 rounded-lg text-[10px] font-black flex items-center justify-center border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white'
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
        <div className="p-4 rounded-3xl bg-[#161618] border border-white/10 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Праздник
              </span>
              <Calendar size={14} className="text-zinc-400" />
            </div>

            <div className="text-xs font-black text-white mt-1.5 line-clamp-1">
              {hasEvent && eventTitle ? eventTitle : 'Круглогодичный'}
            </div>

            <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1 font-medium">
              {hasEvent && eventDate ? `Дата: ${eventDate}` : 'Без даты ♾️'}
            </div>
          </div>

          <button
            onClick={() => {
              onHaptic()
              setHasEvent(true)
              setIsEventEditorOpen(!isEventEditorOpen)
            }}
            className="w-full py-2 rounded-xl text-[10px] font-black border border-white/10 bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 mt-3 flex items-center justify-center gap-1"
          >
            <span>{hasEvent && eventTitle ? 'Изменить' : '+ Дата'}</span>
            {isEventEditorOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Event Editor Accordion */}
      {isEventEditorOpen && isOwner && (
        <div className="p-4 rounded-3xl bg-[#161618] border border-white/15 shadow-2xl animate-fadeIn space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <Calendar size={14} className="text-zinc-400" />
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Быстрый повод
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['День Рождения 🎂', 'Новый Год 🎄', 'Новоселье 🏠', 'Свадьба 💍'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSelectHolidayChip(chip)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95 ${
                    eventTitle === chip
                      ? 'bg-white text-black border-white font-extrabold shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white'
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
              className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Срок
            </label>
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <button
                type="button"
                onClick={() => handleSelectQuickDate(7, 'Праздник 🎉')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-white/5 active:scale-95"
              >
                +1 неделя
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickDate(14, 'Праздник 🎉')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-white/5 active:scale-95"
              >
                +2 недели
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickDate(30, 'Праздник 🎉')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-white/5 active:scale-95"
              >
                +1 месяц
              </button>
            </div>

            <input
              type="date"
              min={todayString}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveEvent}
            className="w-full py-3 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить событие ✨'}
          </button>
        </div>
      )}

      {/* Bento 4: Wide Wishlist Link Tile */}
      <div className="p-4 rounded-3xl bg-[#161618] border border-white/10 shadow-md flex items-center justify-between">
        <div className="min-w-0 pr-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Ссылка на вишлист
          </span>
          <p className="text-xs text-white font-bold truncate mt-0.5">
            t.me/giftly_me_bot?start=wish_{profile.id}
          </p>
          <span className="text-[10px] text-zinc-500 block mt-0.5 font-medium">
            Отправьте друзьям, чтобы они выбрали подарок
          </span>
        </div>

        <button
          onClick={handleCopyLink}
          className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-black flex items-center gap-1.5 active:scale-95 shrink-0 transition-all shadow-md"
        >
          {copiedLink ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
          <span>{copiedLink ? 'Скопировано!' : 'Копировать'}</span>
        </button>
      </div>

      {/* Bento 5: Wishlist Summary Card */}
      <div className="p-4 rounded-3xl bg-[#161618] border border-white/10 shadow-md flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-white shrink-0">
          <Gift size={16} />
        </div>
        <div>
          <h4 className="text-xs font-black text-white">Список желаний готов</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight font-medium">
            Друзья могут бронировать подарки и скидываться. Список обновляется автоматически.
          </p>
        </div>
      </div>
    </div>
  )
}
