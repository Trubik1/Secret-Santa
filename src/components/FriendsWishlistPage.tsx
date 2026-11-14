import React, { useState } from 'react'
import { ArrowRight, Trash2, Users } from 'lucide-react'

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
      onShowToast('Введите ссылку на вишлист вида t.me/giftly_me_bot?start=wish_123')
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
    <div className="w-full pt-2 pb-28 select-none animate-fadeIn">
      {/* Studio Minimal Header */}
      <div className="mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Круг друзей
        </span>
        <h1 className="text-lg sm:text-xl font-black text-white mt-0.5">
          Вишлисты друзей
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Отслеживайте списки желаний близких, чтобы всегда дарить то, что им действительно нужно.
        </p>
      </div>

      {/* Add / Search by Link */}
      <form onSubmit={handleOpenByLink} className="p-4 rounded-3xl bg-[#161618] border border-white/10 shadow-2xl mb-5">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Добавить друга по ссылке или ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="t.me/giftly_me_bot?start=wish_123"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black active:scale-95 transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            <span>Найти</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* Saved / Pinned Friends List */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Сохранённые вишлисты ({savedFriends.length})
          </span>
        </div>

        {savedFriends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {savedFriends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => {
                  onHaptic?.()
                  onOpenFriendWishlist(friend.id)
                }}
                className="p-3.5 rounded-2xl bg-[#161618] border border-white/5 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-zinc-800 ring-1 ring-white/10 text-white flex items-center justify-center font-black text-sm shrink-0">
                    {friend.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-white truncate">
                      {friend.name}
                    </h3>
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                      {friend.username && <span>@{friend.username} ·</span>}
                      <span className="text-zinc-300 font-semibold truncate">{friend.eventTitle || 'Вишлист'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={(e) => handleRemoveFriend(friend.id, friend.name, e)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
                    title="Удалить из списка"
                  >
                    <Trash2 size={15} />
                  </button>
                  <span className="text-xs font-bold text-zinc-500">›</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[#161618] border border-white/5 text-center text-xs text-zinc-400">
            <Users size={28} className="mx-auto text-zinc-600 mb-2" />
            <p className="font-semibold text-white text-sm">Список друзей пуст</p>
            <p className="text-xs text-zinc-400 mt-1">Вставьте ссылку на вишлист друга выше, чтобы добавить его.</p>
          </div>
        )}
      </div>
    </div>
  )
}
