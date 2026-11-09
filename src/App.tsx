import { useState, useEffect, useMemo, useCallback } from 'react'
import { CategoryId, Gift, WishlistData } from './types'
import { useTelegram } from './hooks/useTelegram'
import {
  serverlessCall,
  isTelegramServerlessAvailable,
  getMockIsOwner,
  setMockIsOwner,
  resetMockData,
} from './api/serverless'
import { HeroProfile } from './components/HeroProfile'
import { CategoryFilter } from './components/CategoryFilter'
import { GiftCard } from './components/GiftCard'
import { AddGiftModal } from './components/AddGiftModal'
import { PledgeModal } from './components/PledgeModal'
import { EditProfileModal } from './components/EditProfileModal'
import { StickyActionBar } from './components/StickyActionBar'
import { DevToolsBar } from './components/DevToolsBar'
import { Loader2, Gift as GiftIcon, Plus, CheckCircle2 } from 'lucide-react'

export function App() {
  const {
    tg,
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [pledgingGift, setPledgingGift] = useState<Gift | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Determine target owner ID from start_param or caller
  const targetOwnerId = useMemo(() => {
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
  }, [startParam, user])

  // Load wishlist data from serverless
  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true)
      const input = targetOwnerId ? { ownerId: targetOwnerId } : {}
      const res = await serverlessCall<WishlistData>('getWishlist', input)
      setData(res)
    } catch (err: any) {
      console.error('Failed to load wishlist:', err)
      showToast(err.message || 'Ошибка загрузки вишлиста')
    } finally {
      setLoading(false)
    }
  }, [targetOwnerId, showToast])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  // Category filter
  const handleSelectCategory = (cat: CategoryId) => {
    haptics.selection()
    setSelectedCategory(cat)
  }

  // Filter gifts by category
  const filteredGifts = useMemo(() => {
    if (!data?.gifts) return []
    if (selectedCategory === 'all') return data.gifts
    return data.gifts.filter((g) => g.categoryId === selectedCategory)
  }, [data?.gifts, selectedCategory])

  // Gift actions
  const handleOpenAddModal = () => {
    haptics.impact('light')
    setEditingGift(null)
    setIsAddModalOpen(true)
  }

  const handleEditGift = (gift: Gift) => {
    haptics.impact('light')
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
    setPledgingGift(gift)
  }

  const handleConfirmPledge = async (giftId: string, amount: number) => {
    await serverlessCall('pledgeGift', { giftId, amount })
    haptics.notification('success')
    showToast(`Вы внесли ${amount.toLocaleString('ru-RU')} ₽! Спасибо 🤝`)
    await loadWishlist()
  }

  const handleParseUrl = async (targetUrl: string) => {
    return await serverlessCall('parseUrl', { url: targetUrl })
  }

  const handleSaveProfile = async (eventTitle: string, eventDate: string | null) => {
    await serverlessCall('updateProfile', { eventTitle, eventDate })
    haptics.notification('success')
    showToast('Настройки праздника сохранены ✨')
    await loadWishlist()
  }

  const handleShareWishlist = () => {
    haptics.impact('medium')
    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'yamload_bot'
    const ownerId = data?.profile.id || user?.id || 10001
    const shareLink = `https://t.me/${botUsername}?start=wish_${ownerId}`
    const shareText = `Привет! Вот мой список желаний на грядущий праздник: ${shareLink} 🎂`
    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent('Мой вишлист 🎁')}`

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(tgShareUrl)
    } else {
      navigator.clipboard?.writeText(shareText)
      showToast('Ссылка скопирована в буфер обмена!')
    }
  }

  const handleCreateOwn = () => {
    haptics.impact('medium')
    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'yamload_bot'
    openTelegramLink(`https://t.me/${botUsername}?start=start`)
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

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-ink-light dark:text-ink-dark flex flex-col font-manrope selection:bg-surface-soft selection:text-accent-rose">
      {/* Dev Tools Bar in standalone browser */}
      {!isTelegramServerlessAvailable() && !isInsideTelegram && (
        <DevToolsBar
          isOwner={data?.isOwner ?? true}
          colorScheme={colorScheme}
          onToggleOwner={handleToggleOwner}
          onResetData={handleResetData}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-md mx-auto w-full pb-28">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <Loader2 size={36} className="animate-spin text-accent-rose" />
            <p className="text-xs font-bold text-ink-muted">Загрузка вишлиста...</p>
          </div>
        ) : data ? (
          <>
            {/* Hero Profile */}
            <HeroProfile
              profile={data.profile}
              isOwner={data.isOwner}
              stats={data.stats}
              onEditProfile={() => setIsProfileModalOpen(true)}
            />

            {/* Category Filter */}
            <div className="sticky top-0 z-30 bg-bg-light/80 dark:bg-bg-dark/80 backdrop-blur-md pt-1 pb-2">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
              />
            </div>

            {/* Gifts Grid */}
            <div className="px-4 mt-3">
              {filteredGifts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredGifts.map((gift) => (
                    <GiftCard
                      key={gift.id}
                      gift={gift}
                      isOwner={data.isOwner}
                      onBook={handleBookGift}
                      onUnbook={handleUnbookGift}
                      onPledge={handleOpenPledge}
                      onEdit={handleEditGift}
                      onDelete={handleDeleteGift}
                      onOpenLink={openLink}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="p-8 text-center bg-surface-card dark:bg-surface-card-dark rounded-32 border border-border-soft dark:border-border-soft-dark mt-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-accent-rose/10 text-accent-rose flex items-center justify-center mb-3">
                    <GiftIcon size={28} />
                  </div>
                  <h3 className="font-extrabold text-base text-ink-light dark:text-ink-dark">
                    В этой категории пока пусто
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                    {data.isOwner
                      ? 'Добавьте первое желание, чтобы друзья знали, что подарить!'
                      : 'Владелец пока не добавил желания в этот раздел.'}
                  </p>
                  {data.isOwner && (
                    <button
                      onClick={handleOpenAddModal}
                      className="mt-4 px-5 py-2.5 rounded-full bg-accent-rose text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-md shadow-accent-rose/20 active-press"
                    >
                      <Plus size={15} />
                      Добавить подарок
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>

      {/* Sticky Bottom Action Bar */}
      {data && (
        <StickyActionBar
          isOwner={data.isOwner}
          onAddGift={handleOpenAddModal}
          onShare={handleShareWishlist}
          onCreateOwn={handleCreateOwn}
        />
      )}

      {/* Modals */}
      <AddGiftModal
        isOpen={isAddModalOpen}
        initialGift={editingGift}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingGift(null)
        }}
        onSave={handleSaveGift}
        onParseUrl={handleParseUrl}
        onHaptic={() => haptics.impact('light')}
      />

      <PledgeModal
        isOpen={Boolean(pledgingGift)}
        gift={pledgingGift}
        onClose={() => setPledgingGift(null)}
        onConfirmPledge={handleConfirmPledge}
        onOpenTelegramLink={openTelegramLink}
        onHaptic={() => haptics.impact('light')}
      />

      {data && (
        <EditProfileModal
          isOpen={isProfileModalOpen}
          profile={data.profile}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={handleSaveProfile}
          onHaptic={() => haptics.impact('light')}
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
