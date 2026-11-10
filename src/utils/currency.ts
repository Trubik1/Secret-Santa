export type CurrencyMode = 'both' | 'rub' | 'byn' | 'usd' | 'eur' | 'kzt'

export const RATES_TO_RUB = {
  rub: 1,
  byn: 29.5, // 1 BYN ≈ 29.5 RUB
  usd: 92.0, // 1 USD ≈ 92 RUB
  eur: 100.0, // 1 EUR ≈ 100 RUB
  kzt: 0.19, // 1 KZT ≈ 0.19 RUB (1 RUB ≈ 5.26 KZT)
}

export interface CurrencyOption {
  id: CurrencyMode
  name: string
  symbol: string
  flag: string
  description: string
}

export const ALL_CURRENCIES: CurrencyOption[] = [
  {
    id: 'both',
    name: 'Две валюты (₽ + Br)',
    symbol: '₽/Br',
    flag: '🇷🇺🇧🇾',
    description: 'Показывать цены в российских и белорусских рублях',
  },
  {
    id: 'rub',
    name: 'Российский рубль',
    symbol: '₽',
    flag: '🇷🇺',
    description: 'Официальная валюта РФ (RUB)',
  },
  {
    id: 'byn',
    name: 'Белорусский рубль',
    symbol: 'Br',
    flag: '🇧🇾',
    description: 'Официальная валюта РБ (BYN)',
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

/**
 * Converts Russian Rubles (RUB) to Belarusian Rubles (BYN)
 */
export function rubToByn(rub: number): number {
  if (!rub || rub <= 0) return 0
  const val = rub / RATES_TO_RUB.byn
  return val < 10 ? Number(val.toFixed(2)) : Number(val.toFixed(1))
}

/**
 * Converts Belarusian Rubles (BYN) to Russian Rubles (RUB)
 */
export function bynToRub(byn: number): number {
  if (!byn || byn <= 0) return 0
  return Math.round(byn * RATES_TO_RUB.byn)
}

/**
 * Converts RUB to target currency
 */
export function convertRubTo(rub: number, target: CurrencyMode): number {
  if (!rub || rub <= 0) return 0
  if (target === 'rub' || target === 'both') return rub
  const rate = RATES_TO_RUB[target] || 1
  const converted = rub / rate
  if (target === 'kzt') return Math.round(converted)
  if (converted < 10) return Number(converted.toFixed(2))
  return Number(converted.toFixed(1))
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
  const byn = isRubInput ? rubToByn(amount) : amount
  if (!byn || byn <= 0) return '0 Br'
  return `${byn.toLocaleString('ru-RU', {
    minimumFractionDigits: byn % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} Br`
}

/**
 * Formats dual or single price based on active currency preference
 */
export function formatDualPrice(
  rub: number,
  mode: CurrencyMode = 'both'
): {
  primary: string
  secondary?: string
  fullText: string
} {
  if (!rub || rub <= 0) {
    return { primary: 'Без цены', fullText: 'Без цены' }
  }

  const rubText = formatRub(rub)
  const bynText = `~${formatByn(rub, true)}`

  if (mode === 'both') {
    return {
      primary: rubText,
      secondary: bynText,
      fullText: `${rubText} · ${bynText}`,
    }
  }

  if (mode === 'rub') {
    return {
      primary: rubText,
      fullText: rubText,
    }
  }

  if (mode === 'byn') {
    const rawByn = formatByn(rub, true)
    return {
      primary: rawByn,
      secondary: `~${rubText}`,
      fullText: `${rawByn} (~${rubText})`,
    }
  }

  if (mode === 'usd') {
    const val = (rub / RATES_TO_RUB.usd).toFixed(1)
    const text = `$${Number(val).toLocaleString('en-US')}`
    return {
      primary: text,
      secondary: `~${rubText}`,
      fullText: `${text} (~${rubText})`,
    }
  }

  if (mode === 'eur') {
    const val = (rub / RATES_TO_RUB.eur).toFixed(1)
    const text = `€${Number(val).toLocaleString('de-DE')}`
    return {
      primary: text,
      secondary: `~${rubText}`,
      fullText: `${text} (~${rubText})`,
    }
  }

  if (mode === 'kzt') {
    const val = Math.round(rub / RATES_TO_RUB.kzt)
    const text = `${val.toLocaleString('ru-RU')} ₸`
    return {
      primary: text,
      secondary: `~${rubText}`,
      fullText: `${text} (~${rubText})`,
    }
  }

  return {
    primary: rubText,
    fullText: rubText,
  }
}
