export type CurrencyMode = 'byn' | 'rub' | 'usd' | 'eur' | 'kzt'

export const RATES_TO_RUB: Record<CurrencyMode, number> = {
  rub: 1,
  byn: 29.5, // 1 BYN ≈ 29.5 RUB
  usd: 92.0, // 1 USD ≈ 92 RUB
  eur: 100.0, // 1 EUR ≈ 100 RUB
  kzt: 0.19, // 1 KZT ≈ 0.19 RUB (1 RUB ≈ 5.26 KZT)
}

export const MAX_LIMITS: Record<CurrencyMode, number> = {
  usd: 5000,
  eur: 4800,
  byn: 16000,
  rub: 500000,
  kzt: 2500000,
}

// Порог, выше которого на подарке автоматически доступна кнопка «Скинуться с друзьями»
export const CROWDFUND_THRESHOLDS_IN_RUB = 3000 // 3 000 ₽ ≈ 100 Br ≈ $30

export interface CurrencyOption {
  id: CurrencyMode
  name: string
  symbol: string
  flag: string
  description: string
}

export const ALL_CURRENCIES: CurrencyOption[] = [
  {
    id: 'byn',
    name: 'Белорусский рубль',
    symbol: 'Br',
    flag: '🇧🇾',
    description: 'Официальная валюта РБ (BYN)',
  },
  {
    id: 'rub',
    name: 'Российский рубль',
    symbol: '₽',
    flag: '🇷🇺',
    description: 'Официальная валюта РФ (RUB)',
  },
  {
    id: 'usd',
    name: 'Доллар США',
    symbol: '$',
    flag: '🇺🇸',
    description: 'Международный доллар (USD)',
  },
  {
    id: 'eur',
    name: 'Евро',
    symbol: '€',
    flag: '🇪🇺',
    description: 'Европейская валюта (EUR)',
  },
  {
    id: 'kzt',
    name: 'Казахстанский тенге',
    symbol: '₸',
    flag: '🇰🇿',
    description: 'Официальная валюта Казахстана (KZT)',
  },
]

export function getCurrencySymbol(mode: CurrencyMode = 'byn'): string {
  switch (mode) {
    case 'byn': return 'Br'
    case 'rub': return '₽'
    case 'usd': return '$'
    case 'eur': return '€'
    case 'kzt': return '₸'
    default: return 'Br'
  }
}

/**
 * Converts Russian Rubles (RUB) to Target Currency
 */
export function convertRubTo(rub: number, target: CurrencyMode): number {
  if (!rub || rub <= 0) return 0
  if (target === 'rub') return rub
  const rate = RATES_TO_RUB[target] || 1
  const converted = rub / rate
  if (target === 'kzt') return Math.round(converted)
  if (converted < 10) return Number(converted.toFixed(2))
  return Number(converted.toFixed(1))
}

/**
 * Converts Target Currency amount back to Russian Rubles (RUB)
 */
export function convertToRub(amount: number, source: CurrencyMode): number {
  if (!amount || amount <= 0) return 0
  if (source === 'rub') return Math.round(amount)
  const rate = RATES_TO_RUB[source] || 1
  return Math.round(amount * rate)
}

/**
 * Formats price in Target Currency (strictly single currency, no secondary brackets)
 */
export function formatPrice(amountInRub: number, mode: CurrencyMode = 'byn'): string {
  if (!amountInRub || amountInRub <= 0) {
    return 'Без цены'
  }

  if (mode === 'rub') {
    return `${amountInRub.toLocaleString('ru-RU')} ₽`
  }

  if (mode === 'byn') {
    const val = amountInRub / RATES_TO_RUB.byn
    const formatted = val.toLocaleString('ru-RU', {
      minimumFractionDigits: val % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 2,
    })
    return `${formatted} Br`
  }

  if (mode === 'usd') {
    const val = (amountInRub / RATES_TO_RUB.usd).toFixed(1)
    return `$${Number(val).toLocaleString('en-US')}`
  }

  if (mode === 'eur') {
    const val = (amountInRub / RATES_TO_RUB.eur).toFixed(1)
    return `€${Number(val).toLocaleString('de-DE')}`
  }

  if (mode === 'kzt') {
    const val = Math.round(amountInRub / RATES_TO_RUB.kzt)
    return `${val.toLocaleString('ru-RU')} ₸`
  }

  return `${amountInRub.toLocaleString('ru-RU')} ₽`
}

/**
 * Compatibility wrapper for components expecting { primary, fullText }
 */
export function formatDualPrice(
  rub: number,
  mode: CurrencyMode = 'byn'
): {
  primary: string
  secondary?: string
  fullText: string
} {
  const text = formatPrice(rub, mode)
  return {
    primary: text,
    fullText: text,
  }
}

/**
 * Formats amount in Russian Rubles
 */
export function formatRub(rub: number): string {
  if (!rub || rub <= 0) return '0 ₽'
  return `${rub.toLocaleString('ru-RU')} ₽`
}

/**
 * Formats amount in Belarusian Rubles
 */
export function formatByn(amount: number, isRubInput = true): string {
  const byn = isRubInput ? amount / RATES_TO_RUB.byn : amount
  if (!byn || byn <= 0) return '0 Br'
  return `${byn.toLocaleString('ru-RU', {
    minimumFractionDigits: byn % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} Br`
}

export function rubToByn(rub: number): number {
  if (!rub || rub <= 0) return 0
  const val = rub / RATES_TO_RUB.byn
  return val < 10 ? Number(val.toFixed(2)) : Number(val.toFixed(1))
}

export function bynToRub(byn: number): number {
  if (!byn || byn <= 0) return 0
  return Math.round(byn * RATES_TO_RUB.byn)
}
