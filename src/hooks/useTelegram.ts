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

  // Enforce dark mode as requested ("убери белую тему пока она нам не нужна")
  const [colorScheme, setColorSchemeState] = useState<'light' | 'dark'>('dark')

  const setColorScheme = (_scheme: 'light' | 'dark') => {
    // Keep dark mode enforced
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

  useEffect(() => {
    if (!tg) return

    tg.ready()
    tg.expand()
    document.documentElement.classList.add('dark')
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
