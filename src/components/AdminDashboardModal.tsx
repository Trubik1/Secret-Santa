import React, { useState, useEffect, useCallback } from 'react'
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
  Crown,
  HeartHandshake,
  ShoppingBag,
  Sparkles,
  Trash2,
  Calendar,
} from 'lucide-react'

interface AdminDashboardModalProps {
  isOpen: boolean
  onClose: () => void
  currencyMode: CurrencyMode
  onHaptic?: () => void
  onShowToast: (msg: string) => void
}

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

  if (!isOpen) return null

  // Total reasons count
  const reasons = stats?.completedLastMonth.reasons || { gifted: 0, boughtSelf: 0, changedMind: 0, justDelete: 0 }
  const totalEventsCount = reasons.gifted + reasons.boughtSelf + reasons.changedMind + reasons.justDelete || 1

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
                <h2 className="text-base font-black text-white">Дашборд владельца</h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Аналитика аудитории и метрики вишлистов
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
              className="mt-3 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold"
            >
              Попробовать снова
            </button>
          </div>
        ) : stats ? (
          <div className="mt-4 space-y-3">
            {/* Bento Grid 1: Key Numbers */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Tile 1: Users */}
              <div className="p-4 rounded-2xl bg-[#1b1b1e] border border-white/5 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Пользователи</span>
                  <Users size={15} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">
                    {stats.users.total}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-300 font-bold">
                    <Crown size={12} />
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

              {/* Tile 4: Completed Goals this Month */}
              <div className="p-4 rounded-2xl bg-[#1b1b1e] border border-white/5 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Завершено (30 дней)</span>
                  <Trophy size={15} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-400">
                    {stats.completedLastMonth.count} шт.
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-400 truncate">
                    На сумму {formatPrice(stats.completedLastMonth.totalValue, currencyMode)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Grid 2: Reasons Breakdown */}
            <div className="p-4 rounded-2xl bg-[#1b1b1e] border border-white/5 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Почему удаляют / завершают желания
                </h4>
                <span className="text-[10px] text-zinc-500 font-bold">За последние 30 дней</span>
              </div>

              <div className="space-y-2.5">
                {/* Gifted */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <HeartHandshake size={13} />
                      <span>Подарили друзья:</span>
                    </span>
                    <span className="text-white font-extrabold">{reasons.gifted} шт.</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
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
                      className="h-full bg-sky-400 rounded-full"
                      style={{ width: `${Math.round((reasons.boughtSelf / totalEventsCount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Changed mind */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Sparkles size={13} />
                      <span>Передумали / не актуально:</span>
                    </span>
                    <span className="text-white font-extrabold">{reasons.changedMind} шт.</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${Math.round((reasons.changedMind / totalEventsCount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Just delete */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Trash2 size={13} />
                      <span>Обычное удаление / ошибка:</span>
                    </span>
                    <span className="text-white font-extrabold">{reasons.justDelete} шт.</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-zinc-600 rounded-full"
                      style={{ width: `${Math.round((reasons.justDelete / totalEventsCount) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Grid 3: Recent Users */}
            <div className="p-4 rounded-2xl bg-[#1b1b1e] border border-white/5 shadow-md">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Недавние пользователи ({stats.users.recent.length})
                </h4>
                <span className="text-[10px] text-zinc-500 font-bold">Последние регистрации</span>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {stats.users.recent.map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-bold text-white truncate">{u.name}</span>
                      {u.username && (
                        <span className="text-zinc-500 text-[10px] truncate">@{u.username}</span>
                      )}
                      {u.isPremium && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          PRO
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-zinc-500 shrink-0 flex items-center gap-1">
                      <Calendar size={10} />
                      <span>{u.createdAt ? u.createdAt.slice(0, 10) : 'Недавно'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
