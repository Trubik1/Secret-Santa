import React, { useState } from 'react'
import { ArrowRight, Trash2 } from 'lucide-react'

interface SavedFriend {
  id: number
  name: string
  username?: string | null
  eventTitle?: string
  giftsCount?: number
}

interface FriendsWishlistPageProps {
  currentUserId?: number
  onOpenFriendWishlist: (ownerId: number) => void
  onHaptic?: () => void
  onShowToast: (msg: string) => void
}

const STORAGE_KEY = 'tg_wishlist_saved_friends'

export const FriendsWishlistPage: React.FC<FriendsWishlistPageProps> = ({
  currentUserId,
  onOpenFriendWishlist,
  onHaptic,
  onShowToast,
}) => {
  const [query, setQuery] = useState('')
  const [savedFriends, setSavedFriends] = useState<SavedFriend[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    return [
      { id: 1211235294, name: 'Артём', username: 'yamload', eventTitle: 'Список подарков 🎁', giftsCount: 4 },
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

    if (!targetId) {
      onShowToast('Введите ссылку на вишлист вида t.me/yamload_bot?start=wish_123')
      return
    }

    // Validation 1: Cannot add self
    if (currentUserId && targetId === currentUserId) {
      onShowToast('Нельзя добавить свой собственный вишлист в список друзей 🙅‍♂️')
      return
    }

    // Validation 2: Check if already added
    const alreadyExists = savedFriends.some((f) => f.id === targetId)
    if (!alreadyExists) {
      const newFriend: SavedFriend = {
        id: targetId,
        name: `Друг #${targetId.toString().slice(-4)}`,
        username: null,
        eventTitle: 'Вишлист',
        giftsCount: 0,
      }
      const updated = [newFriend, ...savedFriends]
      setSavedFriends(updated)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (_) {}
      onShowToast('Друг добавлен в сохранённые!')
    }

    setQuery('')
    onOpenFriendWishlist(targetId)
  }

  const handleRemoveFriend = (friendId: number, friendName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onHaptic?.()
    if (!window.confirm(`Удалить "${friendName}" из сохранённых друзей?`)) return
    const updated = savedFriends.filter((f) => f.id !== friendId)
    setSavedFriends(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (_) {}
    onShowToast('Друг удалён из списка')
  }

  return (
    <div className="w-full px-4 pt-3 pb-28 animate-fade-in">
      {/* Page Header */}
      <div className="mb-4">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#c4457b]">
          Круг друзей
        </span>
        <h1 className="text-xl font-black text-ink-light dark:text-white mt-0.5">
          Вишлисты друзей 👥
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Отслеживайте списки желаний близких, чтобы всегда дарить то, что им действительно нужно.
        </p>
      </div>

      {/* Add / Search by Link (Only 1 friend at a time, no self-add) */}
      <form onSubmit={handleOpenByLink} className="p-3.5 rounded-2xl bg-surface-card dark:bg-[#17171a] border border-border-soft dark:border-[#34252f] shadow-sm mb-5">
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-2">
          Добавить друга по ссылке или ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="t.me/yamload_bot?start=wish_123"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-soft dark:bg-zinc-800 border border-border-soft dark:border-zinc-700 text-xs font-semibold text-ink-light dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#c4457b]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#c4457b] hover:bg-[#b03b6d] text-white text-xs font-black active-press shadow-md shadow-[#c4457b]/25 flex items-center gap-1.5 shrink-0"
          >
            <span>Найти</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* Saved / Pinned Friends List */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Сохранённые вишлисты ({savedFriends.length})
          </span>
        </div>

        {savedFriends.length > 0 ? (
          <div className="space-y-2.5">
            {savedFriends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => {
                  onHaptic?.()
                  onOpenFriendWishlist(friend.id)
                }}
                className="p-3.5 rounded-2xl bg-surface-card dark:bg-[#17171a] border border-border-soft dark:border-[#34252f] hover:border-[#c4457b]/60 transition-all cursor-pointer flex items-center justify-between shadow-sm active-press"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#c4457b] to-[#d98aab] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                    {friend.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-ink-light dark:text-white truncate">
                      {friend.name}
                    </h3>
                    <div className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5 truncate">
                      {friend.username && <span>@{friend.username} ·</span>}
                      <span className="text-[#c4457b] font-bold truncate">{friend.eventTitle || 'Вишлист'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={(e) => handleRemoveFriend(friend.id, friend.name, e)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                    title="Удалить из списка"
                  >
                    <Trash2 size={15} />
                  </button>
                  <span className="text-xs font-bold text-zinc-400">›</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-surface-card dark:bg-[#17171a] border border-border-soft dark:border-[#34252f] text-center text-xs text-zinc-400">
            Список друзей пуст. Вставьте ссылку на вишлист друга выше, чтобы добавить его.
          </div>
        )}
      </div>
    </div>
  )
}
