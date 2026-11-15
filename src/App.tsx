import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Gift, WishlistData, DeleteReason, UserProfile } from './types'
import { useTelegram } from './hooks/useTelegram'
import {
  serverlessCall,
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
import { CoverCropModal } from './components/CoverCropModal'
import { PremiumModal } from './components/PremiumModal'
import { CustomizationModal } from './components/CustomizationModal'
import { GroupCollectionCard } from './components/GroupCollectionCard'
import { DeleteReasonModal } from './components/DeleteReasonModal'
import { AdminDashboardModal } from './components/AdminDashboardModal'
import { LiquidRadarLoader } from './components/LiquidRadarLoader'
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
    haptics,
    openTelegramLink,
    openLink,
  } = useTelegram()

  const [data, setData] = useState<WishlistData | null>(null)
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null)
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

  // Current user's PRO status (creator trubik1 is guaranteed PRO)
  const isUserPremium = useMemo(() => {
    if (user?.id === 1211235294 || user?.username?.toLowerCase() === 'trubik1') return true
    return Boolean(myProfile?.isPremium || (isEffectiveOwner && data?.profile?.isPremium))
  }, [user?.id, user?.username, myProfile?.isPremium, isEffectiveOwner, data?.profile?.isPremium])

  // Profile data with synchronized PRO status for owner
  const effectiveProfile = useMemo(() => {
    if (!data?.profile) return null
    if (isEffectiveOwner && isUserPremium) {
      return { ...data.profile, isPremium: true }
    }
    return data.profile
  }, [data?.profile, isEffectiveOwner, isUserPremium])

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

  // Single Currency Preference (defaults to 'usd')
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>(() => {
    try {
      const saved = localStorage.getItem('wishlist_curr') as CurrencyMode
      if (saved && saved !== ('both' as any)) return saved
      return 'usd'
    } catch (_) {
      return 'usd'
    }
  })

  // Modals state
  const [selectedGiftDetail, setSelectedGiftDetail] = useState<Gift | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [pledgingGift, setPledgingGift] = useState<Gift | null>(null)
  const [deletingGift, setDeletingGift] = useState<Gift | null>(null)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [premiumReason, setPremiumReason] = useState<'limit' | 'cover' | 'general'>('general')

  const handleSaveCover = async (coverUrl: string | null) => {
    try {
      await serverlessCall('updateProfile', { coverUrl })
      setMyProfile((prev) => (prev ? { ...prev, coverUrl } : null))
      if (data && !isViewingFriend) {
        setData({
          ...data,
          profile: {
            ...data.profile,
            coverUrl,
          },
        })
      }
      showToast(coverUrl ? 'Обложка вишлиста обновлена ✨' : 'Обложка вишлиста сброшена')
      haptics.notification('success')
    } catch (err) {
      console.error(err)
      showToast('Ошибка при обновлении обложки')
    }
  }

  const handleUpgradeSuccess = async () => {
    try {
      await serverlessCall('updateProfile', { isPremium: true })
      setMyProfile((prev) => (prev ? { ...prev, isPremium: true } : null))
      if (data && !isViewingFriend) {
        setData({
          ...data,
          profile: {
            ...data.profile,
            isPremium: true,
          },
        })
      }
      showToast('Giftly PRO успешно активирован! ⭐️')
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
      // 1. If viewing a friend, load friend's wishlist for catalog
      if (effectiveOwnerId && isViewingFriend) {
        const friendRes = await serverlessCall<WishlistData>('getWishlist', { ownerId: effectiveOwnerId })
        setData(friendRes)
      } else {
        // 2. Load my own wishlist
        const myRes = await serverlessCall<WishlistData>('getWishlist', {})
        setData(myRes)
        setMyProfile(myRes.profile)
      }

      // Always ensure myProfile is populated for Settings tab
      if (isViewingFriend) {
        serverlessCall<WishlistData>('getWishlist', {})
          .then((res) => {
            if (res?.profile) setMyProfile(res.profile)
          })
          .catch(() => {})
      }
    } catch (err: any) {
      console.error('Failed to load wishlist:', err)
      showToast(err.message || 'Ошибка загрузки вишлиста')
    } finally {
      setLoading(false)
    }
  }, [effectiveOwnerId, isViewingFriend, showToast])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  // Gifts feed:
  // 1. PINNED gift is always #1 (both for owner and guest!)
  // 2. For friends (!isEffectiveOwner): gifts with active/completed group collection (totalPledged > 0) come next
  // 3. Sorted by priority (Мечта -> Очень хочу -> Хочу).
  const giftsFeed = useMemo(() => {
    if (!data?.gifts) return []
    return [...data.gifts].sort((a, b) => {
      const aPinned = a.isPinned ? 1 : 0
      const bPinned = b.isPinned ? 1 : 0
      if (aPinned !== bPinned) {
        return bPinned - aPinned // Pinned gift is strictly #1
      }
      if (!isEffectiveOwner) {
        const aHasPledge = (a.totalPledged || 0) > 0 ? 1 : 0
        const bHasPledge = (b.totalPledged || 0) > 0 ? 1 : 0
        if (aHasPledge !== bHasPledge) {
          return bHasPledge - aHasPledge // Pledged/group gift is next
        }
      }
      return (b.priority || 1) - (a.priority || 1)
    })
  }, [data?.gifts, isEffectiveOwner])

  // Gift actions
  const handleOpenAddModal = () => {
    if (data && !isUserPremium && data.gifts.length >= 5) {
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

  const handleRequestDeleteGift = (gift: Gift) => {
    haptics.impact('light')
    setSelectedGiftDetail(null)
    setDeletingGift(gift)
  }

  const handleConfirmDeleteGift = async (gift: Gift, reason: DeleteReason) => {
    haptics.impact('medium')
    try {
      setDeletingGift(null)
      await serverlessCall('deleteGift', { id: gift.id, reason })
      if (reason === 'gifted' || reason === 'bought_self') {
        fireConfetti()
        haptics.notification('success')
        showToast('Поздравляем с исполнением желания! 🎉')
      } else {
        showToast('Желание удалено из вишлиста')
      }
      await loadWishlist()
    } catch (err: any) {
      showToast(err.message || 'Не удалось удалить желание')
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

  const handleTogglePin = async (gift: Gift) => {
    if (!isUserPremium && !gift.isPinned) {
      haptics.notification('warning')
      setPremiumReason('general')
      setIsPremiumModalOpen(true)
      return
    }
    haptics.impact('medium')
    try {
      const nextPinned = !gift.isPinned
      await serverlessCall('updateGift', { id: gift.id, isPinned: nextPinned })
      haptics.notification('success')
      showToast(nextPinned ? 'Подарок закреплён на первом месте 📌' : 'Подарок откреплён')
      await loadWishlist()
      if (selectedGiftDetail && selectedGiftDetail.id === gift.id) {
        setSelectedGiftDetail({ ...selectedGiftDetail, isPinned: nextPinned })
      }
    } catch (err: any) {
      showToast(err.message || 'Ошибка закрепления подарка')
    }
  }

  const handleCancelPledge = async (giftId: string) => {
    if (!window.confirm('Отменить ваш взнос в этот подарок?')) return
    haptics.impact('medium')
    try {
      await serverlessCall('pledgeGift', { giftId, cancel: true })
      haptics.notification('success')
      showToast('Ваш взнос успешно отменён')
      await loadWishlist()
      setPledgingGift(null)
      setSelectedGiftDetail(null)
    } catch (err: any) {
      showToast(err.message || 'Ошибка отмены взноса')
    }
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
    setMyProfile((prev) => (prev ? { ...prev, eventTitle, eventDate } : null))
    if (!isViewingFriend && data) {
      setData({
        ...data,
        profile: { ...data.profile, eventTitle, eventDate },
      })
    }
    haptics.notification('success')
    showToast('Настройки сохранены ✨')
  }

  const handleShareWishlist = () => {
    haptics.impact('medium')
    setIsShareModalOpen(true)
  }

  const handleSelectGiftFromHelper = (gift: Gift) => {
    setSelectedGiftDetail(gift)
  }

  // Navigation tabs config & swipe state
  const NAV_TABS: NavTabType[] = useMemo(() => ['santa', 'my', 'friends', 'settings'], [])
  const currentTabIndex = Math.max(0, NAV_TABS.indexOf(currentNavTab))

  const [isTransitioning, setIsTransitioning] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number; time: number; isHorizontal: boolean | null }>({
    x: 0,
    y: 0,
    time: 0,
    isHorizontal: null,
  })

  const handleNavTabChange = useCallback((tab: NavTabType) => {
    if (tab === 'my' && isViewingFriend) {
      handleBackToMyWishlist()
      return
    }
    if (tab !== currentNavTab) {
      setIsTransitioning(true)
      setCurrentNavTab(tab)
      window.scrollTo({ top: 0, behavior: 'instant' })
      setTimeout(() => {
        setIsTransitioning(false)
      }, 320)
    }
  }, [currentNavTab, isViewingFriend])

  // Check if any modal / overlay is currently open
  const isAnyModalOpen = Boolean(
    isAddModalOpen ||
    isPremiumModalOpen ||
    isBudgetModalOpen ||
    isShareModalOpen ||
    isCustomizationModalOpen ||
    isAdminModalOpen ||
    selectedGiftDetail ||
    pledgingGift ||
    deletingGift
  )

  // Horizontal swipe gestures between tabs
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnyModalOpen) return
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isHorizontal: null,
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnyModalOpen) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    // Determine swipe vs scroll intent on first movement
    if (touchStartRef.current.isHorizontal === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        touchStartRef.current.isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
      }
    }

    if (touchStartRef.current.isHorizontal !== true) return

    // Apply rubber-band dampening at boundaries
    let offset = deltaX
    if ((currentTabIndex === 0 && deltaX > 0) || (currentTabIndex === NAV_TABS.length - 1 && deltaX < 0)) {
      offset = deltaX * 0.2
    }

    setIsDragging(true)
    setSwipeOffset(offset)
  }

  const handleTouchEnd = () => {
    if (!isDragging && touchStartRef.current.isHorizontal !== true) {
      setIsDragging(false)
      setSwipeOffset(0)
      return
    }

    const deltaX = swipeOffset
    const duration = Math.max(1, Date.now() - touchStartRef.current.time)
    const velocity = Math.abs(deltaX) / duration

    setIsDragging(false)
    setSwipeOffset(0)

    // Trigger tab change if dragged > 50px or quick flick
    if (Math.abs(deltaX) > 50 || (Math.abs(deltaX) > 25 && velocity > 0.3)) {
      if (deltaX < 0 && currentTabIndex < NAV_TABS.length - 1) {
        // Swipe left -> Next tab
        haptics.impact('light')
        handleNavTabChange(NAV_TABS[currentTabIndex + 1])
      } else if (deltaX > 0 && currentTabIndex > 0) {
        // Swipe right -> Prev tab
        haptics.impact('light')
        handleNavTabChange(NAV_TABS[currentTabIndex - 1])
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden safe-top">
      {/* Main Content Area: Responsive Widescreen Desktop & Smartphone */}
      <main
        className="flex-1 w-full max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto pb-28 px-3 sm:px-6 transition-all duration-300 overflow-x-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading && !data ? (
          /* Exact Pink-Deer-76 Loader */
          <div className="flex flex-col items-center justify-center min-h-[65vh]">
            <LiquidRadarLoader
              size="lg"
              text="загрузка..."
              subtext="Синхронизация с сервером..."
            />
          </div>
        ) : (
          <div
            className={`flex w-full items-start ${
              isDragging ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]'
            }`}
            style={{
              transform: `translateX(calc(-${currentTabIndex * 100}% + ${swipeOffset}px))`,
            }}
          >
            {/* TAB 0: SECRET SANTA */}
            <div
              className={`w-full shrink-0 min-w-full transition-opacity duration-200 ${
                currentNavTab === 'santa'
                  ? 'opacity-100'
                  : isDragging || isTransitioning
                  ? 'opacity-70'
                  : 'h-0 overflow-hidden opacity-0 pointer-events-none'
              }`}
            >
              <SecretSantaPage
                onBackToWishlist={() => handleNavTabChange('my')}
                onHaptic={() => haptics.impact('light')}
              />
            </div>

            {/* TAB 1: MY WISHLIST */}
            <div
              className={`w-full shrink-0 min-w-full transition-opacity duration-200 ${
                currentNavTab === 'my'
                  ? 'opacity-100'
                  : isDragging || isTransitioning
                  ? 'opacity-70'
                  : 'h-0 overflow-hidden opacity-0 pointer-events-none'
              }`}
            >
              {data && (
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
                    profile={effectiveProfile || data.profile}
                    isOwner={isEffectiveOwner}
                    totalGifts={data.gifts.length}
                    onOpenShare={handleShareWishlist}
                    onOpenAdd={handleOpenAddModal}
                    onOpenCustomization={() => setIsCustomizationModalOpen(true)}
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

                  {/* ADAPTIVE RESPONSIVE GRID (2 cols on Phone, 3-5 cols on Desktop) */}
                  <div className="mt-1">
                    {giftsFeed.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
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
            </div>

            {/* TAB 2: FRIENDS */}
            <div
              className={`w-full shrink-0 min-w-full transition-opacity duration-200 ${
                currentNavTab === 'friends'
                  ? 'opacity-100'
                  : isDragging || isTransitioning
                  ? 'opacity-70'
                  : 'h-0 overflow-hidden opacity-0 pointer-events-none'
              }`}
            >
              <FriendsWishlistPage
                currentUserId={data?.profile?.id}
                onOpenFriendWishlist={(friendId) => {
                  setViewingFriendId(friendId)
                  handleNavTabChange('my')
                }}
                onHaptic={() => haptics.impact('light')}
                onShowToast={showToast}
              />
            </div>

            {/* TAB 3: SETTINGS */}
            <div
              className={`w-full shrink-0 min-w-full transition-opacity duration-200 ${
                currentNavTab === 'settings'
                  ? 'opacity-100'
                  : isDragging || isTransitioning
                  ? 'opacity-70'
                  : 'h-0 overflow-hidden opacity-0 pointer-events-none'
              }`}
            >
              {(myProfile || data?.profile) && (
                <SettingsPage
                  profile={{
                    ...(myProfile || data!.profile),
                    isPremium: isUserPremium || Boolean(myProfile?.isPremium),
                  }}
                  isOwner={true}
                  currencyMode={currencyMode}
                  onSelectCurrency={handleSelectCurrency}
                  onSaveProfile={handleSaveProfile}
                  onHaptic={() => haptics.impact('light')}
                  onShowToast={showToast}
                  onOpenPremiumModal={() => {
                    setPremiumReason('general')
                    setIsPremiumModalOpen(true)
                  }}
                  onOpenAdminModal={() => setIsAdminModalOpen(true)}
                  onOpenCustomization={() => setIsCustomizationModalOpen(true)}
                />
              )}
            </div>
          </div>
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
        currentUserId={user?.id}
        onClose={() => setSelectedGiftDetail(null)}
        onEdit={handleEditGift}
        onDelete={handleRequestDeleteGift}
        onBook={handleBookGift}
        onUnbook={handleUnbookGift}
        onPledge={handleOpenPledge}
        onCancelPledge={handleCancelPledge}
        onTogglePin={handleTogglePin}
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
        currentUserId={user?.id}
        onClose={() => setPledgingGift(null)}
        onConfirmPledge={handleConfirmPledge}
        onCancelPledge={handleCancelPledge}
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
          onOpenTelegramLink={openTelegramLink}
        />
      )}

      {/* Profile & Wishlist Customization Modal */}
      {(myProfile || data?.profile) && (
        <CustomizationModal
          isOpen={isCustomizationModalOpen}
          onClose={() => setIsCustomizationModalOpen(false)}
          profile={myProfile || data!.profile}
          isPremium={isUserPremium}
          onOpenCoverCropper={() => setIsCoverModalOpen(true)}
          onSaveCover={handleSaveCover}
          onOpenPremiumModal={(r) => {
            setPremiumReason(r || 'cover')
            setIsPremiumModalOpen(true)
          }}
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

      {/* Giftly Premium Modal (150 Stars) */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        reason={premiumReason}
        isAlreadyPremium={isUserPremium}
        onClose={() => setIsPremiumModalOpen(false)}
        onSuccessUpgrade={handleUpgradeSuccess}
        onHaptic={() => haptics.impact('light')}
      />

      {/* Delete Reason Modal */}
      <DeleteReasonModal
        isOpen={Boolean(deletingGift)}
        gift={deletingGift}
        onClose={() => setDeletingGift(null)}
        onConfirmDelete={handleConfirmDeleteGift}
        onHaptic={() => haptics.impact('light')}
      />

      {/* Admin Dashboard Modal (Creator Only) */}
      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currencyMode={currencyMode}
        onHaptic={() => haptics.impact('light')}
        onShowToast={showToast}
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
