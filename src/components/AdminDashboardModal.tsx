import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { AdminStats } from '../types'
import { CurrencyMode, formatPrice } from '../utils/currency'
import { serverlessCall } from '../api/serverless'
import {
  X,
  Users,
  Gift,
  Coins,
  Trophy,
  RotateCw,
  HeartHandshake,
  ShoppingBag,
  Sparkles,
  Trash2,
  Calendar,
  Search,
  ExternalLink,
} from 'lucide-react'
import { TelegramStarIcon } from './PremiumModal'

interface AdminDashboardModalProps {
  isOpen: boolean
  onClose: () => void
  currencyMode: CurrencyMode
  onHaptic?: () => void
  onShowToast: (msg: string) => void
}

type TimeframeType = '7d' | '30d' | 'all'
type UserFilterType = 'all' | 'pro'

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currencyMode,
  onHaptic,
  onShowToast,
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [timeframe, setTimeframe] = useState<TimeframeType>('30d')
  const [userFilter, setUserFilter] = useState<UserFilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const usersSectionRef = useRef<HTMLDivElement>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await serverlessCall<AdminStats>('getAdminStats')
      setStats(data)
    } catch (err: any) {
      console.error('Failed to load admin stats:', err)
      setError(err.message || 'Ошибка загрузки статистики')
      onShowToast(err.message || 'Ошибка доступа')
    } finally {
      setLoading(false)
    }
  }, [onShowToast])

  useEffect(() => {
    if (isOpen) {
      fetchStats()
    }
  }, [isOpen, fetchStats])

  // Active Timeframe metrics
  const activeTimeframe = useMemo(() => {
    if (!stats) return { count: 0, totalValue: 0, reasons: { gifted: 0, boughtSelf: 0, changedMind: 0, justDelete: 0 } }
    if (timeframe === '7d' && stats.timeframes?.days7) return stats.timeframes.days7
    if (timeframe === 'all' && stats.timeframes?.allTime) return stats.timeframes.allTime
    return stats.timeframes?.days30 || stats.completedLastMonth
  }, [stats, timeframe])

  const reasons = activeTimeframe.reasons || { gifted: 0, boughtSelf: 0, changedMind: 0, justDelete: 0 }
  const totalEventsCount = reasons.gifted + reasons.boughtSelf + reasons.changedMind + reasons.justDelete || 1

  // Filtered Users List
  const allUsersList = useMemo(() => {
    return stats?.users.all || stats?.users.recent || []
  }, [stats])

  const displayedUsers = useMemo(() => {
    return allUsersList.filter((u) => {
      if (userFilter === 'pro' && !u.isPremium) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = u.name.toLowerCase().includes(q)
        const matchUsername = u.username ? u.username.toLowerCase().includes(q) : false
        const matchId = String(u.id).includes(q)
        return matchName || matchUsername || matchId
      }
      return true
    })
  }, [allUsersList, userFilter, searchQuery])

  const handleTileClickUsers = (filter: UserFilterType) => {
    onHaptic?.()
    setUserFilter(filter)
    usersSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-lg bg-[#141416] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto animate-apple-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <Trophy size={18} />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-white">Панель создателя</h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CREATOR
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Живая аналитика аудитории и желаний
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onHaptic?.()
                fetchStats()
              }}
              disabled={loading}
              title="Обновить данные"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-95 disabled:opacity-40"
            >
              <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                onHaptic?.()
                onClose()
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Loading / Error / Content */}
        {loading && !stats ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              Загрузка метрик...
            </p>
          </div>
        ) : error && !stats ? (
          <div className="py-12 text-center p-4 rounded-2xl bg-red-950/20 border border-red-500/20 mt-4">
            <p className="text-xs font-bold text-red-400">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-3 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold cursor-pointer"
            >
              Попробовать снова
            </button>
          </div>
        ) : stats ? (
          <div className="mt-4 space-y-3">
            {/* Bento Grid 1: Key Numbers */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Tile 1: Users (Clickable to inspect PRO or All) */}
              <div
                onClick={() => handleTileClickUsers(userFilter === 'pro' ? 'all' : 'pro')}
                className="p-4 rounded-2xl bg-[#1b1b1e] hover:bg-[#202024] border border-white/5 hover:border-white/15 shadow-md flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] group"
                title="Нажмите, чтобы отфильтровать пользователей"
              >
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Пользователи</span>
                  <Users size={15} className="group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">
                    {stats.users.total}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-300 font-bold">
                    <TelegramStarIcon size={13} />
                    <span>{stats.users.premium} с тарифом PRO</span>
                  </div>
                </div>
              </div>

              {/* Tile 2: Gifts */}
              <div className="p-4 rounded-2xl bg-[#1b1b1e] border border-white/5 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Всего желаний</span>
                  <Gift size={15} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">
                    {stats.gifts.total}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400 font-medium">
                    В среднем <strong className="text-white">{stats.gifts.avgPerUser}</strong> на человека
                  </div>
                </div>
              </div>

              {/* Tile 3: Average Wishlist Value */}
              <div className="p-4 rounded-2xl bg-[#1b1b1e] border border-white/5 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ср. цена вишлиста</span>
                  <Coins size={15} />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-white truncate">
                    {formatPrice(stats.gifts.avgWishlistPrice, currencyMode)}
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-400 truncate">
                    Ср. цена предмета: {formatPrice(stats.gifts.avgGiftPrice, currencyMode)}
                  </div>
                </div>
              </div>

              {/* Tile 4: Completed Goals (Dynamic timeframe) */}
              <div className="p-4 rounded-2xl bg-[#1b1b1e] border border-white/5 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {timeframe === '7d' ? 'За 7 дней' : timeframe === '30d' ? 'За 30 дней' : 'За всё время'}
                  </span>
                  <Trophy size={15} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-400">
                    {activeTimeframe.count} шт.
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-400 truncate">
                    На сумму {formatPrice(activeTimeframe.totalValue, currencyMode)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Grid 2: Fulfillment Analytics with Timeframe Toggle */}
            <div className="p-4 rounded-2xl bg-[#1b1b1e] border border-white/5 shadow-md">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Исполненные цели и причины удаления
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Статистика закрытых желаний пользователей
                  </p>
                </div>

                {/* Timeframe Segmented Control */}
                <div className="inline-flex rounded-xl bg-zinc-900 p-0.5 border border-white/5 text-[10px] font-bold">
                  <button
                    onClick={() => {
                      onHaptic?.()
                      setTimeframe('7d')
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      timeframe === '7d'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    7 дней
                  </button>
                  <button
                    onClick={() => {
                      onHaptic?.()
                      setTimeframe('30d')
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      timeframe === '30d'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    30 дней
                  </button>
                  <button
                    onClick={() => {
                      onHaptic?.()
                      setTimeframe('all')
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      timeframe === 'all'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Всё время
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 mt-2">
                {/* Gifted */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <HeartHandshake size={13} />
                      <span>Подарили друзья (Успех):</span>
                    </span>
                    <span className="text-white font-extrabold">{reasons.gifted} шт.</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((reasons.gifted / totalEventsCount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Bought Self */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <ShoppingBag size={13} />
                      <span>Купили самостоятельно:</span>
                    </span>
                    <span className="text-white font-extrabold">{reasons.boughtSelf} шт.</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((reasons.boughtSelf / totalEventsCount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Changed mind */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Sparkles size={13} />
                      <span>Передумали / расхотели:</span>
                    </span>
                    <span className="text-white font-extrabold">{reasons.changedMind} шт.</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((reasons.changedMind / totalEventsCount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Just delete */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Trash2 size={13} />
                      <span>Просто удалили из списка:</span>
                    </span>
                    <span className="text-white font-extrabold">{reasons.justDelete} шт.</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-zinc-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((reasons.justDelete / totalEventsCount) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Grid 3: Full Users Directory & PRO Filter */}
            <div ref={usersSectionRef} className="p-4 rounded-2xl bg-[#1b1b1e] border border-white/5 shadow-md">
              <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    База пользователей ({allUsersList.length})
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    {userFilter === 'pro' ? 'Показаны только PRO-пользователи' : 'Полный список зарегистрированных аккаунтов'}
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="inline-flex rounded-xl bg-zinc-900 p-0.5 border border-white/5 text-[10px] font-bold">
                  <button
                    onClick={() => {
                      onHaptic?.()
                      setUserFilter('all')
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      userFilter === 'all'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Все ({stats.users.total})
                  </button>
                  <button
                    onClick={() => {
                      onHaptic?.()
                      setUserFilter('pro')
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      userFilter === 'pro'
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'text-amber-300 hover:text-white'
                    }`}
                  >
                    <TelegramStarIcon size={11} />
                    <span>PRO ({stats.users.premium})</span>
                  </button>
                </div>
              </div>

              {/* Search Bar for Users */}
              <div className="relative mb-2.5">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Поиск по имени, @username или ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-white/5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Users List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {displayedUsers.length > 0 ? (
                  displayedUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-xl bg-zinc-900/90 border border-white/5 hover:border-white/10 flex items-center justify-between gap-2 text-xs transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 ring-1 ring-white/10 text-white flex items-center justify-center font-black text-xs shrink-0">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white truncate">{u.name}</span>
                            {u.isPremium && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                                <TelegramStarIcon size={9} />
                                PRO
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                            {u.username ? (
                              <a
                                href={`https://t.me/${u.username}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-0.5 truncate"
                              >
                                <span>@{u.username}</span>
                                <ExternalLink size={9} />
                              </a>
                            ) : (
                              <span className="text-zinc-600">ID: {u.id}</span>
                            )}
                            <span>•</span>
                            <span>Желаний: {u.giftsCount || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-500 shrink-0 flex items-center gap-1">
                        <Calendar size={10} />
                        <span>{u.createdAt ? u.createdAt.slice(0, 10) : '—'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    Пользователи не найдены
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
