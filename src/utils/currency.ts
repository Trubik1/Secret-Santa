export type CurrencyMode = 'both' | 'rub' | 'byn'

export const RUB_TO_BYN_RATE = 29.5

/**
 * Converts Russian Rubles (RUB) to Belarusian Rubles (BYN)
 */
export function rubToByn(rub: number): number {
  if (!rub || rub <= 0) return 0
  const val = rub / RUB_TO_BYN_RATE
  return val < 10 ? Number(val.toFixed(2)) : Number(val.toFixed(1))
}

/**
 * Converts Belarusian Rubles (BYN) to Russian Rubles (RUB)
 */
export function bynToRub(byn: number): number {
  if (!byn || byn <= 0) return 0
  return Math.round(byn * RUB_TO_BYN_RATE)
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
 * Formats dual price based on active currency preference
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

  if (mode === 'rub') {
    return {
      primary: rubText,
      secondary: bynText,
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

  // mode === 'both' (default)
  return {
    primary: rubText,
    secondary: bynText,
    fullText: `${rubText} · ${bynText}`,
  }
}
