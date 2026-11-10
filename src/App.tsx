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
import { DesignTheme, THEME_OPTIONS } from './utils/theme'
import { HeroProfile } from './components/HeroProfile'
import { GiftCard } from './components/GiftCard'
import { AddGiftModal } from './components/AddGiftModal'
import { PledgeModal } from './components/PledgeModal'
import { BudgetHelperModal } from './components/BudgetHelperModal'
import { ShareModal } from './components/ShareModal'
import { SettingsModal } from './components/SettingsModal'
import { StickyActionBar } from './components/StickyActionBar'
import { DevToolsBar } from './components/DevToolsBar'
import { Loader2, Plus, CheckCircle2, Sparkles } from 'lucide-react'

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

  // Currency preference (defaults to 'both' dual RUB + BYN)
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>(() => {
    try {
      return (localStorage.getItem('wishlist_curr') as CurrencyMode) || 'both'
    } catch (_) {
      return 'both'
    }
  })

  // 5 Design & Typography Styles (defaults to 'inter')
  const [designTheme, setDesignTheme] = useState<DesignTheme>(() => {
    try {
      return (localStorage.getItem('wishlist_theme') as DesignTheme) || 'inter'
    } catch (_) {
      return 'inter'
    }
  })

  // Modals state
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

  // Active theme object
  const activeTheme = useMemo(() => {
    return THEME_OPTIONS.find((t) => t.id === designTheme) || THEME_OPTIONS[0]
  }, [designTheme])

  const handleSelectCurrency = (c: CurrencyMode) => {
    haptics.selection()
    setCurrencyMode(c)
    try {
      localStorage.setItem('wishlist_curr', c)
    } catch (_) {}
  }

  const handleSelectTheme = (t: DesignTheme) => {
    haptics.selection()
    setDesignTheme(t)
    try {
      localStorage.setItem('wishlist_theme', t)
    } catch (_) {}
  }

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
    setPledgingGift(gift)
  }

  const handleConfirmPledge = async (giftId: string, amount: number) => {
    await serverlessCall('pledgeGift', { giftId, amount })
    haptics.notification('success')
    fireConfetti()
    showToast(`Вы внесли ${amount.toLocaleString('ru-RU')} ₽! Спасибо 🤝`)
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
    showToast('Настройки праздника сохранены ✨')
    await loadWishlist()
  }

  const handleShareWishlist = () => {
    haptics.impact('medium')
    setIsShareModalOpen(true)
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

  const handleSelectGiftFromHelper = (gift: Gift) => {
    if (gift.isCrowdfund) {
      handleOpenPledge(gift)
    } else {
      handleBookGift(gift)
    }
  }

  return (
    <div
      className={`min-h-screen bg-bg-light dark:bg-bg-dark text-ink-light dark:text-ink-dark flex flex-col ${activeTheme.fontClass} selection:bg-surface-soft selection:text-accent-rose overflow-x-hidden`}
    >
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

      {/* Main Container */}
      <main className="flex-1 max-w-md mx-auto w-full pb-36 overflow-x-hidden">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <Loader2 size={36} className="animate-spin text-accent-rose" />
            <p className="text-xs font-bold text-ink-muted">Загрузка вишлиста...</p>
          </div>
        ) : data ? (
          <>
            {/* Sleek Profile Banner */}
            <HeroProfile
              profile={data.profile}
              isOwner={data.isOwner}
              stats={data.stats}
              theme={activeTheme}
              onOpenShare={handleShareWishlist}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onHaptic={() => haptics.impact('light')}
            />

            {/* Direct Gifts Feed Header */}
            {giftsFeed.length > 0 && (
              <div className="px-4 pt-2 pb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                  Список желаний ({giftsFeed.length})
                </span>

                {!data.isOwner && giftsFeed.length > 2 && (
                  <button
                    onClick={() => {
                      haptics.impact('light')
                      setIsBudgetModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-rose hover:underline"
                  >
                    <Sparkles size={12} />
                    <span>Подобрать по бюджету</span>
                  </button>
                )}
              </div>
            )}

            {/* Unified Gifts Grid */}
            <div className="px-4 mt-1">
              {giftsFeed.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {giftsFeed.map((gift) => (
                    <GiftCard
                      key={gift.id}
                      gift={gift}
                      isOwner={data.isOwner}
                      currencyMode={currencyMode}
                      theme={activeTheme}
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
                <div
                  className={`p-8 text-center bg-surface-card dark:bg-surface-card-dark ${activeTheme.cardRadius} border border-border-soft dark:border-border-soft-dark mt-4 relative overflow-hidden`}
                >
                  <div className="w-16 h-16 rounded-full bg-accent-rose/10 text-accent-rose flex items-center justify-center mx-auto mb-3">
                    <Plus size={28} />
                  </div>
                  <h3 className={`font-extrabold text-base text-ink-light dark:text-ink-dark ${activeTheme.headingFont}`}>
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
                      className="mt-4 px-5 py-2.5 rounded-full bg-accent-rose text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-md shadow-accent-rose/20 active-press hover:bg-accent-rose-hover transition-all"
                    >
                      <Plus size={15} />
                      Добавить первое желание
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
        <SettingsModal
          isOpen={isSettingsModalOpen}
          profile={data.profile}
          isOwner={data.isOwner}
          currencyMode={currencyMode}
          designTheme={designTheme}
          colorScheme={colorScheme}
          onClose={() => setIsSettingsModalOpen(false)}
          onSelectCurrency={handleSelectCurrency}
          onSelectTheme={handleSelectTheme}
          onToggleColorScheme={handleToggleTheme}
          onSaveProfile={handleSaveProfile}
          onHaptic={() => haptics.impact('light')}
          onShowToast={showToast}
        />
      )}

      {data && (
        <BudgetHelperModal
          isOpen={isBudgetModalOpen}
          gifts={data.gifts}
          isOwner={data.isOwner}
          onClose={() => setIsBudgetModalOpen(false)}
          onSelectGift={handleSelectGiftFromHelper}
          onHaptic={() => haptics.impact('medium')}
        />
      )}

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
