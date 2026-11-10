import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'

interface SavedFriend {
  id: number
  name: string
  username?: string | null
  eventTitle?: string
  giftsCount?: number
}

interface FriendsWishlistPageProps {
  onOpenFriendWishlist: (ownerId: number) => void
  onHaptic?: () => void
  onShowToast: (msg: string) => void
}

const STORAGE_KEY = 'tg_wishlist_saved_friends'

export const FriendsWishlistPage: React.FC<FriendsWishlistPageProps> = ({
  onOpenFriendWishlist,
  onHaptic,
  onShowToast,
}) => {
  const [query, setQuery] = useState('')
  const [savedFriends] = useState<SavedFriend[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    return [
      { id: 1211235294, name: 'Артём', username: 'yamload', eventTitle: 'День Рождения 🎂', giftsCount: 4 },
    ]
  })

  const handleOpenByLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    onHaptic?.()
    const input = query.trim()

    // Parse ID from link or input
    let targetId: number | null = null
    const matchWish = input.match(/wish_(\d+)/)
    if (matchWish) {
      targetId = parseInt(matchWish[1], 10)
    } else {
      const parsedNum = parseInt(input.replace(/[^\d]/g, ''), 10)
      if (!isNaN(parsedNum) && parsedNum > 0) {
        targetId = parsedNum
      }
    }

    if (targetId) {
      onOpenFriendWishlist(targetId)
    } else {
      onShowToast('Введите ссылку на вишлист друга вида t.me/yamload_bot?start=wish_123')
    }
  }

  return (
    <div className="w-full px-4 pt-3 pb-24 animate-fade-in">
      {/* Page Header */}
      <div className="mb-4">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#c4457b]">
          Круг друзей
        </span>
        <h1 className="text-xl font-black text-zinc-900 dark:text-white mt-0.5">
          Вишлисты друзей 👥
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Отслеживайте списки желаний близких, чтобы всегда дарить то, что им действительно нужно.
        </p>
      </div>

      {/* Add / Search by Link */}
      <form onSubmit={handleOpenByLink} className="p-3.5 rounded-2xl bg-white dark:bg-[#17171a] border border-zinc-200 dark:border-[#34252f] shadow-sm mb-5">
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 mb-2">
          Найти по ссылке или ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Вставьте ссылку на вишлист друга..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#c4457b]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black active-press shadow-md shadow-[#c4457b]/25 flex items-center gap-1.5 shrink-0"
          >
            <span>Открыть</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* Saved / Pinned Friends List */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
            Сохранённые вишлисты ({savedFriends.length})
          </span>
        </div>

        <div className="space-y-2.5">
          {savedFriends.map((friend) => (
            <div
              key={friend.id}
              onClick={() => {
                onHaptic?.()
                onOpenFriendWishlist(friend.id)
              }}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#17171a] border border-zinc-200 dark:border-[#34252f] hover:border-[#c4457b]/60 transition-all cursor-pointer flex items-center justify-between shadow-sm active-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#c4457b] to-[#d98aab] text-white flex items-center justify-center font-black text-base shadow-sm">
                  {friend.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                    {friend.name}
                  </h3>
                  <div className="text-[11px] text-zinc-500 font-semibold flex items-center gap-1.5 mt-0.5">
                    {friend.username && <span>@{friend.username} ·</span>}
                    <span className="text-[#c4457b] font-bold">{friend.eventTitle || 'Вишлист'}</span>
                  </div>
                </div>
              </div>

              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                <span>Перейти</span>
                <span className="text-sm">›</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
