import { fetch } from 'sdk'

function getWbBasketNumber(vol) {
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

/**
 * Extracts OpenGraph, Twitter, and Schema meta data from raw HTML.
 */
function extractMetaFromHtml(html, originalUrl) {
  const result = {
    title: '',
    imageUrl: '',
    price: 0,
    categoryId: 'other',
    parsed: false,
  }

  if (!html) return result

  // 1. Title
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (ogTitleMatch && ogTitleMatch[1]) {
    result.title = decodeHtmlEntities(ogTitleMatch[1].trim())
  } else if (titleTagMatch && titleTagMatch[1]) {
    result.title = decodeHtmlEntities(titleTagMatch[1].trim())
  }

  // 2. Image
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                       html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
  if (ogImageMatch && ogImageMatch[1]) {
    let img = ogImageMatch[1].trim()
    if (img.startsWith('//')) {
      img = 'https:' + img
    } else if (img.startsWith('/')) {
      try {
        const u = new URL(originalUrl)
        img = `${u.protocol}//${u.host}${img}`
      } catch (_) {}
    }
    result.imageUrl = img
  }

  // 3. Price
  const ogPriceMatch = html.match(/<meta[^>]+property=["'](?:og:price:amount|product:price:amount)["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["'](?:og:price:amount|product:price:amount)["']/i)
  if (ogPriceMatch && ogPriceMatch[1]) {
    const rawPrice = parseFloat(ogPriceMatch[1].replace(/,/g, '.'))
    if (!isNaN(rawPrice)) {
      result.price = Math.round(rawPrice)
    }
  }

  // 4. Try JSON-LD if price or image is missing
  const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1])
      const item = Array.isArray(data) ? data[0] : (data['@graph'] ? data['@graph'][0] : data)
      if (item) {
        if (!result.title && item.name) result.title = item.name
        if (!result.imageUrl && item.image) {
          result.imageUrl = Array.isArray(item.image) ? item.image[0] : (typeof item.image === 'string' ? item.image : item.image?.url)
        }
        if (!result.price && item.offers) {
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers
          const pr = parseFloat(offer.price)
          if (!isNaN(pr)) result.price = Math.round(pr)
        }
      }
    } catch (_) {}
  }

  result.parsed = Boolean(result.title || result.imageUrl || result.price)
  return result
}

function decodeHtmlEntities(str) {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
}

const ALLOWED_MARKETPLACE_HOSTS = [
  // Wildberries
  'wildberries.ru',
  'wb.ru',
  'wildberries.by',
  'wildberries.kz',
  'wildberries.uz',
  'wildberries.am',
  // Ozon
  'ozon.ru',
  // Yandex Market
  'market.yandex.ru',
  // AliExpress
  'aliexpress.ru',
  // Gold Apple, MegaMarket, DNS
  'goldapple.ru',
  'megamarket.ru',
  'dns-shop.ru',
]

function isHostAllowed(hostname) {
  if (!hostname) return false
  const host = hostname.toLowerCase().trim()
  return ALLOWED_MARKETPLACE_HOSTS.some(allowed => host === allowed || host.endsWith('.' + allowed))
}

function createTimeoutSignal(ms) {
  if (typeof AbortSignal?.timeout === 'function') {
    return AbortSignal.timeout(ms)
  }
  const controller = new AbortController()
  setTimeout(() => controller.abort(new Error('Timeout')), ms)
  return controller.signal
}

/**
 * Main parser entry point.
 */
export async function parseProductUrl(targetUrl) {
  const cleanUrl = targetUrl?.trim()
  const fallback = {
    title: '',
    imageUrl: '',
    price: 0,
    categoryId: 'other',
    url: cleanUrl || '',
    parsed: false,
  }

  if (!cleanUrl) {
    return fallback
  }

  let parsedUrl
  try {
    parsedUrl = new URL(cleanUrl)
  } catch (_) {
    return fallback
  }

  // SSRF Protection: strictly enforce HTTPS and trusted marketplace domains
  if (parsedUrl.protocol !== 'https:') {
    return fallback
  }

  if (!isHostAllowed(parsedUrl.hostname)) {
    return fallback
  }

  try {
    // 1. Wildberries multi-domain API (ru, by, kz, uz, etc.)
    const wbMatch = cleanUrl.match(/(?:wildberries\.[a-z.]+|wb\.[a-z.]+)\/catalog\/(\d+)/i) || cleanUrl.match(/\/catalog\/(\d+)/i)
    if (wbMatch && wbMatch[1]) {
      const nmId = parseInt(wbMatch[1], 10)
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
        const checks = uniqueCandidates.map((c) => {
          const num = String(c).padStart(2, '0')
          const cardUrl = `https://basket-${num}.wbbasket.ru/vol${vol}/part${part}/${nmId}/info/ru/card.json`
          return fetch(cardUrl, { signal: createTimeoutSignal(3500) }).then(async (cardRes) => {
            if (!cardRes.ok) throw new Error('Not ok')
            const card = await cardRes.json()
            return { num, card }
          })
        })

        const { num, card } = await Promise.any(checks)

        let price = 0
        try {
          const prRes = await fetch(
            `https://basket-${num}.wbbasket.ru/vol${vol}/part${part}/${nmId}/info/price-history.json`,
            { signal: createTimeoutSignal(1800) }
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
      } catch (_) {}
    }

    // 2. Generic Fetch + OpenGraph parsing (Ozon, other stores)
    const response = await fetch(cleanUrl, {
      signal: createTimeoutSignal(4000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (TelegramBot/1.0; +https://telegram.org)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    })

    if (!response.ok) {
      return fallback
    }

    const html = await response.text()
    const parsed = extractMetaFromHtml(html, cleanUrl)

    return {
      title: parsed.title,
      imageUrl: parsed.imageUrl,
      price: parsed.price,
      categoryId: parsed.categoryId || 'other',
      url: cleanUrl,
      parsed: parsed.parsed,
    }
  } catch (err) {
    console.error('URL parsing failed:', err)
    return fallback
  }
}
