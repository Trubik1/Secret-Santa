import { useEffect, useMemo, useState } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: any
    }
  }
}

export function useTelegram() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

  // 1. Always prioritize persistent user preference in localStorage
  const [colorScheme, setColorSchemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('wishlist_color_scheme') as 'light' | 'dark'
      if (saved === 'light' || saved === 'dark') return saved
    } catch (_) {}

    if (tg?.colorScheme) return tg.colorScheme
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'dark'
  })

  const setColorScheme = (scheme: 'light' | 'dark') => {
    setColorSchemeState(scheme)
    try {
      localStorage.setItem('wishlist_color_scheme', scheme)
    } catch (_) {}
  }

  useEffect(() => {
    if (!tg) return

    tg.ready()
    tg.expand()

    const onThemeChange = () => {
      // Only adopt telegram theme if user has never manually toggled it in localStorage
      try {
        const saved = localStorage.getItem('wishlist_color_scheme')
        if (!saved && tg.colorScheme) {
          setColorSchemeState(tg.colorScheme)
        }
      } catch (_) {}
    }

    tg.onEvent?.('themeChanged', onThemeChange)
    return () => {
      tg.offEvent?.('themeChanged', onThemeChange)
    }
  }, [tg])

  useEffect(() => {
    // Sync dark class on document element immediately
    if (colorScheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [colorScheme])

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

  return {
    tg,
    user: tg?.initDataUnsafe?.user,
    initData: tg?.initData,
    startParam: tg?.initDataUnsafe?.start_param,
    colorScheme,
    setColorScheme,
    isInsideTelegram,
    haptics,
    openTelegramLink,
    openLink,
  }
}
