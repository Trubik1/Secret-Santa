import { ParsedProduct } from '../types'

function getWbBasketNumber(vol: number): number {
  if (vol <= 143) return 1
  if (vol <= 287) return 2
  if (vol <= 431) return 3
  if (vol <= 719) return 4
  if (vol <= 1007) return 5
  if (vol <= 1061) return 6
  if (vol <= 1115) return 7
  if (vol <= 1169) return 8
  if (vol <= 1313) return 9
  if (vol <= 1601) return 10
  if (vol <= 1655) return 11
  if (vol <= 1919) return 12
  if (vol <= 2045) return 13
  if (vol <= 2189) return 14
  if (vol <= 2405) return 15
  if (vol <= 2621) return 16
  if (vol <= 2837) return 17
  return 18 + Math.floor((vol - 2838) / 262)
}

function createTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal?.timeout === 'function') {
    return AbortSignal.timeout(ms)
  }
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

function promiseAny<T>(promises: Promise<T>[]): Promise<T> {
  if (typeof (Promise as any).any === 'function') {
    return (Promise as any).any(promises)
  }
  return new Promise((resolve, reject) => {
    let rejections = 0
    if (promises.length === 0) return reject(new Error('No promises provided'))
    promises.forEach((p) => {
      p.then(resolve, () => {
        rejections++
        if (rejections === promises.length) {
          reject(new Error('All promises were rejected'))
        }
      })
    })
  })
}

/**
 * Direct client-side parser for Wildberries.
 * wbbasket.ru supports CORS (Access-Control-Allow-Origin: *), allowing instant,
 * unblocked metadata retrieval right from the user's browser/Telegram client!
 */
export async function parseWildberriesClient(cleanUrl: string): Promise<ParsedProduct | null> {
  const wbMatch = cleanUrl.match(/(?:wildberries\.[a-z.]+|wb\.[a-z.]+)\/catalog\/(\d+)/i) || cleanUrl.match(/\/catalog\/(\d+)/i)
  if (!wbMatch || !wbMatch[1]) return null

  const nmId = parseInt(wbMatch[1], 10)
  if (isNaN(nmId) || nmId <= 0) return null

  const vol = Math.floor(nmId / 100000)
  const part = Math.floor(nmId / 1000)

  const targetBasket = getWbBasketNumber(vol)
  const candidateNums = [
    targetBasket,
    targetBasket - 1, targetBasket + 1,
    targetBasket - 2, targetBasket + 2,
    targetBasket - 3, targetBasket + 3,
    targetBasket - 4, targetBasket + 4,
  ].filter((n) => n >= 1 && n <= 45)
  const uniqueCandidates = [...new Set(candidateNums)]

  try {
    // Launch all basket candidates in parallel for sub-second resolution
    const checks = uniqueCandidates.map((c) => {
      const num = String(c).padStart(2, '0')
      const cardUrl = `https://basket-${num}.wbbasket.ru/vol${vol}/part${part}/${nmId}/info/ru/card.json`
      return fetch(cardUrl, { signal: createTimeoutSignal(2500) }).then(async (cardRes) => {
        if (!cardRes.ok) throw new Error('Not ok')
        const card = await cardRes.json()
        return { num, card }
      })
    })

    const { num, card } = await promiseAny(checks)

    let price = 0
    try {
      const prRes = await fetch(
        `https://basket-${num}.wbbasket.ru/vol${vol}/part${part}/${nmId}/info/price-history.json`,
        { signal: createTimeoutSignal(1500) }
      )
      if (prRes.ok) {
        const prData = await prRes.json()
        const lastPr = prData[prData.length - 1]
        if (lastPr?.price?.RUB) {
          price = Math.round(lastPr.price.RUB / 100)
        }
      }
    } catch (_) {}

    const imageUrl = `https://basket-${num}.wbbasket.ru/vol${vol}/part${part}/${nmId}/images/big/1.webp`
    const title = card.imt_name || card.subj_name || 'Товар Wildberries'

    // Category mapping
    const catName = (card.subj_root_name || card.subj_name || '').toLowerCase()
    let categoryId = 'other'
    if (catName.includes('электрон') || catName.includes('бытов') || catName.includes('смарт') || catName.includes('гаджет') || catName.includes('компьютер')) {
      categoryId = 'gadgets'
    } else if (catName.includes('одежд') || catName.includes('обув') || catName.includes('аксессуар') || catName.includes('бель')) {
      categoryId = 'clothes'
    } else if (catName.includes('дом') || catName.includes('интерьер') || catName.includes('мебель') || catName.includes('кухн') || catName.includes('посуд')) {
      categoryId = 'home'
    } else if (catName.includes('книг') || catName.includes('канц')) {
      categoryId = 'books'
    }

    return {
      title,
      imageUrl,
      price,
      categoryId,
      url: cleanUrl,
      parsed: true,
    }
  } catch (_) {
    return null
  }
}
