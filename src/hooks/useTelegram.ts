import { useEffect, useMemo, useState, useCallback } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: any
    }
  }
}

export function useTelegram() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return Boolean(tg?.isFullscreen)
  })

  // Enforce dark mode as requested
  const [colorScheme, setColorSchemeState] = useState<'light' | 'dark'>('dark')

  const setColorScheme = (_scheme: 'light' | 'dark') => {
    setColorSchemeState('dark')
    try {
      localStorage.setItem('wishlist_color_scheme', 'dark')
    } catch (_) {}
  }

  useEffect(() => {
    // Always enforce dark theme
    document.documentElement.classList.add('dark')
    try {
      localStorage.setItem('wishlist_color_scheme', 'dark')
    } catch (_) {}
  }, [])

  const requestFullscreen = useCallback(() => {
    if (typeof tg?.requestFullscreen === 'function') {
      try {
        tg.requestFullscreen()
      } catch (e) {
        console.warn('requestFullscreen error:', e)
      }
    }
  }, [tg])

  const exitFullscreen = useCallback(() => {
    if (typeof tg?.exitFullscreen === 'function') {
      try {
        tg.exitFullscreen()
      } catch (e) {
        console.warn('exitFullscreen error:', e)
      }
    }
  }, [tg])

  const toggleFullscreen = useCallback(() => {
    if (tg?.isFullscreen) {
      exitFullscreen()
    } else {
      requestFullscreen()
    }
  }, [tg, exitFullscreen, requestFullscreen])

  useEffect(() => {
    if (!tg) return

    // 1. Mark WebApp ready
    tg.ready()

    // 2. Expand viewport
    tg.expand()

    // 3. Request true fullscreen (Telegram Bot API 8.0+)
    // Expands to 100% monitor screen on Desktop and native full screen on Mobile
    if (typeof tg.requestFullscreen === 'function') {
      try {
        tg.requestFullscreen()
      } catch (err) {
        console.warn('Auto requestFullscreen error:', err)
      }
    }

    // 4. Track fullscreen status changes
    const handleFullscreenChanged = () => {
      setIsFullscreen(Boolean(tg.isFullscreen))
    }

    if (typeof tg.onEvent === 'function') {
      tg.onEvent('fullscreenChanged', handleFullscreenChanged)
    }

    document.documentElement.classList.add('dark')

    return () => {
      if (typeof tg.offEvent === 'function') {
        tg.offEvent('fullscreenChanged', handleFullscreenChanged)
      }
    }
  }, [tg])

  const haptics = useMemo(() => ({
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      try {
        tg?.HapticFeedback?.impactOccurred(style)
      } catch (_) {}
    },
    notification: (type: 'error' | 'success' | 'warning' = 'success') => {
      try {
        tg?.HapticFeedback?.notificationOccurred(type)
      } catch (_) {}
    },
    selection: () => {
      try {
        tg?.HapticFeedback?.selectionChanged()
      } catch (_) {}
    },
  }), [tg])

  const openTelegramLink = (url: string) => {
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url)
    } else {
      window.open(url, '_blank')
    }
  }

  const openLink = (url: string) => {
    if (tg?.openLink) {
      tg.openLink(url)
    } else {
      window.open(url, '_blank')
    }
  }

  const isInsideTelegram = Boolean(tg?.initData && tg.initData.length > 0)
  const canFullscreen = typeof tg?.requestFullscreen === 'function'

  return {
    tg,
    user: tg?.initDataUnsafe?.user,
    initData: tg?.initData,
    startParam: tg?.initDataUnsafe?.start_param,
    colorScheme,
    setColorScheme,
    isInsideTelegram,
    isFullscreen,
    canFullscreen,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen,
    haptics,
    openTelegramLink,
    openLink,
  }
}
