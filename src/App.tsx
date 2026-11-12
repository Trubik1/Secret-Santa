import { useState, useEffect, useMemo, useCallback } from 'react'
import { Gift, WishlistData } from './types'
import { useTelegram } from './hooks/useTelegram'
import {
  serverlessCall,
  isTelegramServerlessAvailable,
  getMockIsOwner,
  setMockIsOwner,
  resetMockData,
} from './api/serverless'
import { parseWildberriesClient } from './api/clientParser'
import { CurrencyMode } from './utils/currency'
import { fireConfetti } from './utils/confetti'
import { HeroProfile } from './components/HeroProfile'
import { GiftCard } from './components/GiftCard'
import { GiftDetailModal } from './components/GiftDetailModal'
import { AddGiftModal } from './components/AddGiftModal'
import { PledgeModal } from './components/PledgeModal'
import { BudgetHelperModal } from './components/BudgetHelperModal'
import { ShareModal } from './components/ShareModal'
import { SettingsPage } from './components/SettingsPage'
import { BottomNavDock, NavTabType } from './components/BottomNavDock'
import { FriendsWishlistPage } from './components/FriendsWishlistPage'
import { SecretSantaPage } from './components/SecretSantaPage'
import { DevToolsBar } from './components/DevToolsBar'
import { CoverCropModal } from './components/CoverCropModal'
import { PremiumModal } from './components/PremiumModal'
import { GroupCollectionCard } from './components/GroupCollectionCard'
import { Plus, CheckCircle2 } from 'lucide-react'

function extractStartParam(): string | null {
  if (typeof window === 'undefined') return null
  // 1. Check window.Telegram?.WebApp?.initDataUnsafe?.start_param
  const tgParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param
  if (tgParam) return tgParam

  // 2. Check query string (?start_param=... or ?tgWebAppStartParam=...)
  try {
    const searchParams = new URLSearchParams(window.location.search)
    const param = searchParams.get('start_param') || searchParams.get('tgWebAppStartParam')
    if (param) return param
  } catch (_) {}

  // 3. Check hash string (#tgWebAppStartParam=... or #start_param=...)
  try {
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashParam = hashParams.get('tgWebAppStartParam') || hashParams.get('start_param')
      if (hashParam) return hashParam
    }
  } catch (_) {}

  return null
}

export function App() {
  const {
    user,
    startParam,
    isInsideTelegram,
    haptics,
    openTelegramLink,
    openLink,
  } = useTelegram()

  const [data, setData] = useState<WishlistData | null>(null)
  const [loading, setLoading] = useState(true)

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Navigation tab state (my | friends | santa | settings)
  const [currentNavTab, setCurrentNavTab] = useState<NavTabType>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab') as NavTabType
      if (p === 'santa' || p === 'my' || p === 'friends' || p === 'settings') return p
    }
    return 'my'
  })

  // Friend ID being viewed (from startParam, query string, or friends tab)
  const [viewingFriendId, setViewingFriendId] = useState<number | null>(() => {
    const p = extractStartParam()
    if (p && p.startsWith('wish_')) {
      const parsed = parseInt(p.replace('wish_', ''), 10)
      if (!isNaN(parsed)) return parsed
    }
    return null
  })

  // Watch for startParam becoming available from useTelegram or URL
  useEffect(() => {
    const p = startParam || extractStartParam()
    if (p && p.startsWith('wish_')) {
      const parsed = parseInt(p.replace('wish_', ''), 10)
      if (!isNaN(parsed)) {
        if (!user?.id || parsed !== user.id) {
          setViewingFriendId(parsed)
        }
      }
    }
  }, [startParam, user?.id])

  // Is the user actively viewing a friend's wishlist?
  const isViewingFriend = useMemo(() => {
    if (!viewingFriendId) return false
    if (user?.id && viewingFriendId === user.id) return false
    return true
  }, [viewingFriendId, user?.id])

  // Effective owner ID to query
  const effectiveOwnerId = useMemo(() => {
    if (isViewingFriend) return viewingFriendId
    return user?.id || null
  }, [isViewingFriend, viewingFriendId, user?.id])

  // Strictly enforce that if viewing a friend, isOwner is ALWAYS false!
  const isEffectiveOwner = useMemo(() => {
    if (isViewingFriend) return false
    return Boolean(data?.isOwner)
  }, [isViewingFriend, data?.isOwner])

  const handleBackToMyWishlist = useCallback(() => {
    haptics.impact('light')
    setViewingFriendId(null)
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete('start_param')
        url.searchParams.delete('tgWebAppStartParam')
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''))
      } catch (_) {}
    }
    showToast('Переключено на ваш личный вишлист ✨')
  }, [haptics, showToast])

  // Auto-save friend to local storage so they appear in Friends tab
  useEffect(() => {
    if (isViewingFriend && viewingFriendId && data?.profile) {
      try {
        const STORAGE_KEY = 'tg_wishlist_saved_friends'
        const raw = localStorage.getItem(STORAGE_KEY)
        const list = raw ? JSON.parse(raw) : []
        const exists = list.some((f: any) => f.id === viewingFriendId)
        if (!exists) {
          const friendName = [data.profile.firstName, data.profile.lastName].filter(Boolean).join(' ') || data.profile.firstName || `Друг #${viewingFriendId.toString().slice(-4)}`
          const friendEntry = {
            id: viewingFriendId,
            name: friendName,
            username: data.profile.username || null,
            eventTitle: data.profile.eventTitle || 'Вишлист',
            giftsCount: data.gifts.length,
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify([friendEntry, ...list]))
        }
      } catch (_) {}
    }
  }, [isViewingFriend, viewingFriendId, data])

  // Single Currency Preference (defaults to 'byn')
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>(() => {
    try {
      const saved = localStorage.getItem('wishlist_curr') as CurrencyMode
      if (saved && saved !== ('both' as any)) return saved
      return 'byn'
    } catch (_) {
      return 'byn'
    }
  })

  // Modals state
  const [selectedGiftDetail, setSelectedGiftDetail] = useState<Gift | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [pledgingGift, setPledgingGift] = useState<Gift | null>(null)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [premiumReason, setPremiumReason] = useState<'limit' | 'cover' | 'general'>('general')

  const handleSaveCover = async (coverUrl: string) => {
    try {
      await serverlessCall('updateProfile', { coverUrl })
      if (data) {
        setData({
          ...data,
          profile: {
            ...data.profile,
            coverUrl,
          },
        })
      }
      showToast('Обложка вишлиста обновлена ✨')
      haptics.notification('success')
    } catch (err) {
      console.error(err)
      showToast('Ошибка при обновлении обложки')
    }
  }

  const handleUpgradeSuccess = async () => {
    try {
      await serverlessCall('updateProfile', { isPremium: true })
      if (data) {
        setData({
          ...data,
          profile: {
            ...data.profile,
            isPremium: true,
          },
        })
      }
      showToast('Giftly Premium успешно активирован! ⭐️')
      haptics.notification('success')
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectCurrency = (c: CurrencyMode) => {
    haptics.selection()
    setCurrencyMode(c)
    try {
      localStorage.setItem('wishlist_curr', c)
    } catch (_) {}
  }

  // Load wishlist data from serverless
  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true)
      const input = effectiveOwnerId ? { ownerId: effectiveOwnerId } : {}
      const res = await serverlessCall<WishlistData>('getWishlist', input)
      setData(res)
    } catch (err: any) {
      console.error('Failed to load wishlist:', err)
      showToast(err.message || 'Ошибка загрузки вишлиста')
    } finally {
      setLoading(false)
    }
  }, [effectiveOwnerId, showToast])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  // Gifts feed:
  // For friends (!isEffectiveOwner): gifts with active/completed group collection (totalPledged > 0) are pinned to the VERY TOP (#1 place)!
  // For owner (isEffectiveOwner): surprise mode, sorted cleanly by priority (Мечта -> Очень хочу -> Хочу).
  const giftsFeed = useMemo(() => {
    if (!data?.gifts) return []
    return [...data.gifts].sort((a, b) => {
      if (!isEffectiveOwner) {
        const aHasPledge = (a.totalPledged || 0) > 0 ? 1 : 0
        const bHasPledge = (b.totalPledged || 0) > 0 ? 1 : 0
        if (aHasPledge !== bHasPledge) {
          return bHasPledge - aHasPledge // Pledged/group gift is strictly first!
        }
      }
      return (b.priority || 1) - (a.priority || 1)
    })
  }, [data?.gifts, isEffectiveOwner])

  // Gift actions
  const handleOpenAddModal = () => {
    if (data && !data.profile.isPremium && data.gifts.length >= 5) {
      haptics.notification('warning')
      setPremiumReason('limit')
      setIsPremiumModalOpen(true)
      return
    }
    haptics.impact('light')
    setEditingGift(null)
    setIsAddModalOpen(true)
  }

  const handleEditGift = (gift: Gift) => {
    haptics.impact('light')
    setSelectedGiftDetail(null)
    setEditingGift(gift)
    setIsAddModalOpen(true)
  }

  const handleSaveGift = async (giftData: Partial<Gift>) => {
    if (editingGift) {
      await serverlessCall('updateGift', { id: editingGift.id, ...giftData })
      showToast('Желание обновлено ✨')
    } else {
      await serverlessCall('addGift', giftData)
      showToast('Желание добавлено в список 🎁')
    }
    haptics.notification('success')
    await loadWishlist()
  }

  const handleDeleteGift = async (gift: Gift) => {
    if (!window.confirm(`Удалить "${gift.title}" из вишлиста?`)) return
    haptics.impact('medium')
    try {
      setSelectedGiftDetail(null)
      await serverlessCall('deleteGift', { id: gift.id })
      showToast('Желание удалено')
      await loadWishlist()
    } catch (err: any) {
      showToast(err.message || 'Не удалось удалить')
    }
  }

  const handleBookGift = async (gift: Gift) => {
    haptics.impact('heavy')
    try {
      await serverlessCall('bookGift', { id: gift.id, action: 'book' })
      haptics.notification('success')
      fireConfetti()
      showToast('Подарок успешно забронирован! 🎉')
      await loadWishlist()
    } catch (err: any) {
      haptics.notification('error')
      showToast(err.message || 'Ошибка бронирования')
    }
  }

  const handleUnbookGift = async (gift: Gift) => {
    if (!window.confirm('Отменить бронирование этого подарка?')) return
    haptics.impact('medium')
    try {
      await serverlessCall('bookGift', { id: gift.id, action: 'unbook' })
      showToast('Бронь отменена')
      await loadWishlist()
    } catch (err: any) {
      showToast(err.message || 'Ошибка отмены брони')
    }
  }

  const handleOpenPledge = (gift: Gift) => {
    haptics.impact('light')
    setSelectedGiftDetail(null)
    setPledgingGift(gift)
  }

  const handleConfirmPledge = async (giftId: string, amount: number) => {
    await serverlessCall('pledgeGift', { giftId, amount })
    haptics.notification('success')
    fireConfetti()
    showToast(`Вы внесли вклад! Спасибо 🤝`)
    await loadWishlist()
  }

  const handleParseUrl = async (targetUrl: string) => {
    try {
      const wbClientResult = await parseWildberriesClient(targetUrl)
      if (wbClientResult && wbClientResult.parsed) {
        return wbClientResult
      }
    } catch (_) {}
    return await serverlessCall('parseUrl', { url: targetUrl })
  }

  const handleSaveProfile = async (eventTitle: string, eventDate: string | null) => {
    await serverlessCall('updateProfile', { eventTitle, eventDate })
    haptics.notification('success')
    showToast('Настройки сохранены ✨')
    await loadWishlist()
  }

  const handleShareWishlist = () => {
    haptics.impact('medium')
    setIsShareModalOpen(true)
  }

  // Dev bar handlers
  const handleToggleOwner = () => {
    const cur = getMockIsOwner()
    setMockIsOwner(!cur)
    loadWishlist()
  }

  const handleResetData = () => {
    resetMockData()
    loadWishlist()
    showToast('Данные сброшены к начальным')
  }

  const handleSelectGiftFromHelper = (gift: Gift) => {
    setSelectedGiftDetail(gift)
  }

  const handleNavTabChange = (tab: NavTabType) => {
    if (tab === 'my' && isViewingFriend) {
      handleBackToMyWishlist()
      return
    }
    setCurrentNavTab(tab)
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden">
      {/* Dev Tools Bar in standalone browser only */}
      {!isTelegramServerlessAvailable() && !isInsideTelegram && (
        <DevToolsBar
          isOwner={isEffectiveOwner}
          onToggleOwner={handleToggleOwner}
          onResetData={handleResetData}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto pb-28 px-3">
        {loading && !data ? (
          /* Minimalist Monochrome Loader */
          <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-white animate-spin" />
              <span className="text-sm font-black text-white relative z-10">🎁</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Загрузка вишлиста...
            </p>
          </div>
        ) : (
          <>
            {/* VIEW 1: MY WISHLIST */}
            {currentNavTab === 'my' && data && (
              <>
                {/* Persistent Friend Mode Context Bar */}
                {isViewingFriend && (
                  <div className="mb-3 pt-1 animate-fadeIn">
                    <div className="p-3 rounded-2xl bg-[#161618] border border-white/10 shadow-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white font-black text-sm">
                          🎁
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Гостевой режим
                          </div>
                          <div className="text-xs font-black text-white truncate">
                            {data.profile.firstName || 'Друг'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleBackToMyWishlist}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black shrink-0 active:scale-95 transition-all shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <span>← В мой вишлист</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Giftly Minimalist Hero Banner */}
                <HeroProfile
                  profile={data.profile}
                  isOwner={isEffectiveOwner}
                  totalGifts={data.gifts.length}
                  onOpenShare={handleShareWishlist}
                  onOpenAdd={handleOpenAddModal}
                  onOpenCoverModal={() => setIsCoverModalOpen(true)}
                  onOpenPremiumModal={(r) => {
                    setPremiumReason(r)
                    setIsPremiumModalOpen(true)
                  }}
                  onHaptic={() => haptics.impact('light')}
                />

                {/* Catalog Header */}
                <div className="pt-3 pb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    {isEffectiveOwner
                      ? `Каталог (${giftsFeed.length})`
                      : `Желания ${data.profile.firstName || 'друга'} (${giftsFeed.length})`}
                  </span>
                </div>

                {/* 2-COLUMN MINIMALIST GRID WITH LARGE CARDS (STUDIO DESIGN) */}
                <div className="mt-1">
                  {giftsFeed.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      {giftsFeed.map((gift) => {
                        const isGroupCollection = !isEffectiveOwner && (gift.totalPledged || 0) > 0
                        if (isGroupCollection) {
                          return (
                            <GroupCollectionCard
                              key={gift.id}
                              gift={gift}
                              currencyMode={currencyMode}
                              onSelect={(g) => setSelectedGiftDetail(g)}
                              onPledge={(g) => handleOpenPledge(g)}
                              onHaptic={() => haptics.impact('light')}
                            />
                          )
                        }
                        return (
                          <GiftCard
                            key={gift.id}
                            gift={gift}
                            isOwner={isEffectiveOwner}
                            currencyMode={currencyMode}
                            onSelect={(g) => setSelectedGiftDetail(g)}
                            onHaptic={() => haptics.impact('light')}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    /* Clean Empty state */
                    <div className="p-8 text-center bg-[#161618] rounded-3xl border border-white/5 mt-4 relative overflow-hidden">
                      <div className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto mb-3">
                        <Plus size={28} />
                      </div>
                      <h3 className="font-extrabold text-base text-white">
                        Список желаний пока пуст
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                        {isEffectiveOwner
                          ? 'Добавьте первые подарки из Wildberries или Ozon, чтобы друзья знали, что подарить!'
                          : `${data.profile.firstName || 'Владелец'} пока не добавил ни одного желания.`}
                      </p>
                      {isEffectiveOwner && (
                        <button
                          onClick={handleOpenAddModal}
                          className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-xs font-black inline-flex items-center gap-1.5 active:scale-95 hover:bg-zinc-200 transition-all shadow-md"
                        >
                          <Plus size={15} />
                          Добавить первое желание
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* VIEW 2: FRIENDS' WISHLISTS */}
            {currentNavTab === 'friends' && (
              <FriendsWishlistPage
                currentUserId={data?.profile?.id}
                onOpenFriendWishlist={(friendId) => {
                  setViewingFriendId(friendId)
                  setCurrentNavTab('my')
                }}
                onHaptic={() => haptics.impact('light')}
                onShowToast={showToast}
              />
            )}

            {/* VIEW 3: SECRET SANTA (IN DEVELOPMENT) */}
            {currentNavTab === 'santa' && (
              <SecretSantaPage
                onBackToWishlist={() => setCurrentNavTab('my')}
                onHaptic={() => haptics.impact('light')}
              />
            )}

            {/* VIEW 4: SETTINGS (Full Page within Dock Navigation) */}
            {currentNavTab === 'settings' && data && (
              <SettingsPage
                profile={data.profile}
                isOwner={isEffectiveOwner}
                currencyMode={currencyMode}
                onSelectCurrency={handleSelectCurrency}
                onSaveProfile={handleSaveProfile}
                onHaptic={() => haptics.impact('light')}
                onShowToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Liquid Glass Floating Navigation Dock */}
      <BottomNavDock
        activeTab={currentNavTab}
        onChangeTab={handleNavTabChange}
        onHaptic={() => haptics.impact('light')}
      />

      {/* Pop-up Gift Detail Modal (Apple Fluid Spring & Drag to Dismiss) */}
      <GiftDetailModal
        gift={selectedGiftDetail}
        isOwner={isEffectiveOwner}
        currencyMode={currencyMode}
        onClose={() => setSelectedGiftDetail(null)}
        onEdit={handleEditGift}
        onDelete={handleDeleteGift}
        onBook={handleBookGift}
        onUnbook={handleUnbookGift}
        onPledge={handleOpenPledge}
        onOpenLink={openLink}
        onHaptic={() => haptics.impact('light')}
      />

      {/* Add / Edit Gift Modal */}
      <AddGiftModal
        isOpen={isAddModalOpen}
        initialGift={editingGift}
        currencyMode={currencyMode}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingGift(null)
        }}
        onSave={handleSaveGift}
        onParseUrl={handleParseUrl}
        onHaptic={() => haptics.impact('light')}
      />

      {/* Crowdfund Pledge Modal */}
      <PledgeModal
        isOpen={Boolean(pledgingGift)}
        gift={pledgingGift}
        currencyMode={currencyMode}
        onClose={() => setPledgingGift(null)}
        onConfirmPledge={handleConfirmPledge}
        onOpenTelegramLink={openTelegramLink}
        onHaptic={() => haptics.impact('light')}
      />

      {/* Budget Helper Modal */}
      {data && (
        <BudgetHelperModal
          isOpen={isBudgetModalOpen}
          gifts={data.gifts}
          isOwner={isEffectiveOwner}
          currencyMode={currencyMode}
          onClose={() => setIsBudgetModalOpen(false)}
          onSelectGift={handleSelectGiftFromHelper}
          onHaptic={() => haptics.impact('medium')}
        />
      )}

      {/* Share Modal */}
      {data && (
        <ShareModal
          isOpen={isShareModalOpen}
          user={data.profile}
          giftsCount={data.gifts.length}
          onClose={() => setIsShareModalOpen(false)}
          onHaptic={() => haptics.impact('light')}
          onShowToast={showToast}
        />
      )}

      {/* Cover Cropper Modal */}
      <CoverCropModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onSaveCover={handleSaveCover}
        onHaptic={() => haptics.impact('light')}
      />

      {/* Giftly Premium Modal (50 Stars) */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        reason={premiumReason}
        onClose={() => setIsPremiumModalOpen(false)}
        onSuccessUpgrade={handleUpgradeSuccess}
        onHaptic={() => haptics.impact('light')}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce-subtle pointer-events-none">
          <div className="bg-ink-light text-white dark:bg-white dark:text-ink-light px-4 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
