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
import { SettingsModal } from './components/SettingsModal'
import { BottomNavDock, NavTabType } from './components/BottomNavDock'
import { FriendsWishlistPage } from './components/FriendsWishlistPage'
import { SecretSantaPage } from './components/SecretSantaPage'
import { DevToolsBar } from './components/DevToolsBar'
import { Plus, CheckCircle2, Sparkles } from 'lucide-react'

export function App() {
  const {
    user,
    startParam,
    colorScheme,
    setColorScheme,
    isInsideTelegram,
    haptics,
    openTelegramLink,
    openLink,
  } = useTelegram()

  const [data, setData] = useState<WishlistData | null>(null)
  const [loading, setLoading] = useState(true)

  // Navigation tab state (my | friends | santa | settings)
  const [currentNavTab, setCurrentNavTab] = useState<NavTabType>('my')

  // Selected friend's owner ID (if viewing friend's wishlist from Friends tab)
  const [targetFriendId, setTargetFriendId] = useState<number | null>(null)

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleSelectCurrency = (c: CurrencyMode) => {
    haptics.selection()
    setCurrencyMode(c)
    try {
      localStorage.setItem('wishlist_curr', c)
    } catch (_) {}
  }

  // Determine target owner ID: friend override > startParam > user
  const effectiveOwnerId = useMemo(() => {
    if (targetFriendId) return targetFriendId

    if (startParam && startParam.startsWith('wish_')) {
      const parsedId = parseInt(startParam.replace('wish_', ''), 10)
      if (!isNaN(parsedId)) return parsedId
    }
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const param = urlParams.get('start_param') || urlParams.get('tgWebAppStartParam')
      if (param && param.startsWith('wish_')) {
        const parsedId = parseInt(param.replace('wish_', ''), 10)
        if (!isNaN(parsedId)) return parsedId
      }
    }
    return user?.id || null
  }, [targetFriendId, startParam, user])

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

  // Gifts feed sorted cleanly by priority: Мечта -> Очень хочу -> Хочу
  const giftsFeed = useMemo(() => {
    if (!data?.gifts) return []
    return [...data.gifts].sort((a, b) => (b.priority || 1) - (a.priority || 1))
  }, [data?.gifts])

  // Gift actions
  const handleOpenAddModal = () => {
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

  const handleToggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
  }

  const handleSelectGiftFromHelper = (gift: Gift) => {
    setSelectedGiftDetail(gift)
  }

  const handleNavTabChange = (tab: NavTabType) => {
    if (tab === 'settings') {
      setIsSettingsModalOpen(true)
    } else {
      setCurrentNavTab(tab)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-ink-light dark:text-ink-dark flex flex-col font-inter selection:bg-surface-soft selection:text-accent-rose overflow-x-hidden">
      {/* Dev Tools Bar in standalone browser only */}
      {!isTelegramServerlessAvailable() && !isInsideTelegram && (
        <DevToolsBar
          isOwner={data?.isOwner ?? true}
          colorScheme={colorScheme}
          onToggleOwner={handleToggleOwner}
          onResetData={handleResetData}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-md mx-auto w-full pb-24 overflow-x-hidden">
        {loading && !data ? (
          /* Liquid Glass Orb Loader */
          <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#c4457b]/20 border-t-[#c4457b] animate-spin" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#c4457b] to-[#d98aab] opacity-80 blur-sm animate-pulse" />
              <span className="text-sm font-black text-white relative z-10">🎁</span>
            </div>
            <p className="text-xs font-black uppercase tracking-wider text-ink-muted">
              Загрузка вишлиста...
            </p>
          </div>
        ) : (
          <>
            {/* VIEW 1: MY WISHLIST */}
            {currentNavTab === 'my' && data && (
              <>
                {/* Back to my own wishlist banner if viewing a friend */}
                {targetFriendId && (
                  <div className="px-4 pt-2">
                    <button
                      onClick={() => {
                        haptics.impact('light')
                        setTargetFriendId(null)
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-surface-soft dark:bg-[#241920] border border-border-soft dark:border-[#34252f] text-xs font-bold text-[#c4457b] flex items-center justify-between"
                    >
                      <span>← Вернуться в мой личный вишлист</span>
                      <span>✕</span>
                    </button>
                  </div>
                )}

                {/* Profile Banner */}
                <HeroProfile
                  profile={data.profile}
                  isOwner={data.isOwner}
                  onOpenShare={handleShareWishlist}
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
                  onHaptic={() => haptics.impact('light')}
                />

                {/* Direct Gifts Feed Header with Add Button */}
                <div className="px-4 pt-2.5 pb-2 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-ink-muted">
                    Желания ({giftsFeed.length})
                  </span>

                  <div className="flex items-center gap-2">
                    {!data.isOwner && giftsFeed.length > 2 && (
                      <button
                        onClick={() => {
                          haptics.impact('light')
                          setIsBudgetModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-rose hover:underline"
                      >
                        <Sparkles size={12} />
                        <span>Подобрать</span>
                      </button>
                    )}

                    {data.isOwner && (
                      <button
                        onClick={handleOpenAddModal}
                        className="px-3 py-1 rounded-full bg-[#c4457b] hover:bg-[#b03b6d] text-white text-[11px] font-black active-press shadow-sm flex items-center gap-1"
                      >
                        <Plus size={13} strokeWidth={3} />
                        <span>Добавить</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2-COLUMN APPLE BOUTIQUE GRID */}
                <div className="px-4 mt-1">
                  {giftsFeed.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {giftsFeed.map((gift) => (
                        <GiftCard
                          key={gift.id}
                          gift={gift}
                          isOwner={data.isOwner}
                          currencyMode={currencyMode}
                          onSelect={(g) => setSelectedGiftDetail(g)}
                          onHaptic={() => haptics.impact('light')}
                        />
                      ))}
                    </div>
                  ) : (
                    /* Clean Empty state */
                    <div className="p-8 text-center bg-surface-card dark:bg-[#17171a] rounded-3xl border border-border-soft dark:border-[#34252f] mt-4 relative overflow-hidden">
                      <div className="w-16 h-16 rounded-full bg-accent-rose/10 text-accent-rose flex items-center justify-center mx-auto mb-3">
                        <Plus size={28} />
                      </div>
                      <h3 className="font-black text-base text-ink-light dark:text-ink-dark">
                        Список желаний пока пуст
                      </h3>
                      <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                        {data.isOwner
                          ? 'Добавьте первые подарки из Wildberries или Ozon, чтобы друзья знали, что подарить!'
                          : 'Владелец пока не добавил ни одного желания.'}
                      </p>
                      {data.isOwner && (
                        <button
                          onClick={handleOpenAddModal}
                          className="mt-4 px-5 py-2.5 rounded-full bg-accent-rose text-white text-xs font-black inline-flex items-center gap-1.5 shadow-md shadow-accent-rose/20 active-press hover:bg-accent-rose-hover transition-all"
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
                onOpenFriendWishlist={(friendId) => {
                  setTargetFriendId(friendId)
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
        isOwner={data?.isOwner ?? false}
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

      {/* Settings Modal (Single Currency, Dark/Light, Holiday Date) */}
      {data && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          profile={data.profile}
          isOwner={data.isOwner}
          currencyMode={currencyMode}
          colorScheme={colorScheme}
          onClose={() => setIsSettingsModalOpen(false)}
          onSelectCurrency={handleSelectCurrency}
          onToggleColorScheme={handleToggleTheme}
          onSaveProfile={handleSaveProfile}
          onHaptic={() => haptics.impact('light')}
          onShowToast={showToast}
        />
      )}

      {/* Budget Helper Modal */}
      {data && (
        <BudgetHelperModal
          isOpen={isBudgetModalOpen}
          gifts={data.gifts}
          isOwner={data.isOwner}
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
