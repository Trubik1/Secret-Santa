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

function parseUrlString(urlString) {
  if (!urlString || typeof urlString !== 'string') return null
  const match = urlString.trim().match(/^(https?):\/\/([^/?#:]+)(?::(\d+))?([^?#]*)(\?[^#]*)?(#.*)?$/i)
  if (!match) return null
  return {
    protocol: match[1].toLowerCase() + ':',
    hostname: match[2].toLowerCase(),
    host: match[2].toLowerCase() + (match[3] ? ':' + match[3] : ''),
    port: match[3] || '',
    pathname: match[4] || '/',
    search: match[5] || '',
    hash: match[6] || '',
  }
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

  let extractedTitle = ''
  if (ogTitleMatch && ogTitleMatch[1]) {
    extractedTitle = decodeHtmlEntities(ogTitleMatch[1].trim())
  }
  // Yandex Market fallback: og:title is often just "Яндекс"
  if ((!extractedTitle || extractedTitle === 'Яндекс' || extractedTitle === 'Яндекс Маркет') && titleTagMatch && titleTagMatch[1]) {
    extractedTitle = decodeHtmlEntities(titleTagMatch[1].trim())
  }

  // Clean marketplace suffixes
  if (extractedTitle) {
    result.title = extractedTitle
      .replace(/\s*—\s*купить (?:по выгодной цене )?в интернет-магазине.*$/i, '')
      .replace(/\s*—\s*Яндекс\s*Маркет.*$/i, '')
      .replace(/\s*на Яндекс\s*Маркете.*$/i, '')
      .replace(/\s*—\s*интернет-магазин OZON.*$/i, '')
      .replace(/\s*—\s*Wildberries.*$/i, '')
      .trim()
  }

  // 2. Image
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                       html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
  if (ogImageMatch && ogImageMatch[1]) {
    let img = ogImageMatch[1].trim()
    if (!img.includes('home-static') && !img.includes('favicon')) {
      if (img.startsWith('//')) {
        img = 'https:' + img
      } else if (img.startsWith('/')) {
        try {
          const u = parseUrlString(originalUrl)
          if (u) img = `${u.protocol}//${u.host}${img}`
        } catch (_) {}
      }
      result.imageUrl = img
    }
  }

  // Yandex Market image fallback
  if (!result.imageUrl) {
    const ymPicMatch = html.match(/https:\/\/avatars\.mds\.yandex\.net\/get-mpic\/[^"'\s<>]+\/(?:orig|optimize|x\d+)/i) ||
                       html.match(/https:\/\/avatars\.mds\.yandex\.net\/get-mpic\/[^"'\s<>]+/i)
    if (ymPicMatch && ymPicMatch[0]) {
      result.imageUrl = ymPicMatch[0]
    }
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

  // Yandex Market price fallback from data-zone-data
  if (!result.price) {
    const ymPriceMatch = html.match(/(?:&quot;|")price(?:&quot;|"):\s*\{(?:&quot;|")currency(?:&quot;|"):\s*(?:&quot;|")(?:RUR|RUB)(?:&quot;|"),\s*(?:&quot;|")value(?:&quot;|"):\s*(?:&quot;|")(\d+)(?:&quot;|")/i) ||
                         html.match(/(?:&quot;|")value(?:&quot;|"):\s*(?:&quot;|")(\d+)(?:&quot;|"),\s*(?:&quot;|")currency(?:&quot;|"):\s*(?:&quot;|")(?:RUR|RUB)(?:&quot;|")/i)
    if (ymPriceMatch && ymPriceMatch[1]) {
      const p = parseInt(ymPriceMatch[1], 10)
      if (!isNaN(p) && p > 0) result.price = p
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

  // Category mapping based on title keywords
  const titleLower = (result.title || '').toLowerCase()
  if (titleLower.includes('телефон') || titleLower.includes('смартфон') || titleLower.includes('наушник') || titleLower.includes('ноутбук') || titleLower.includes('электрон') || titleLower.includes('часы')) {
    result.categoryId = 'gadgets'
  } else if (titleLower.includes('платье') || titleLower.includes('куртк') || titleLower.includes('кроссовк') || titleLower.includes('одежд') || titleLower.includes('обув')) {
    result.categoryId = 'clothes'
  } else if (titleLower.includes('посуд') || titleLower.includes('мебель') || titleLower.includes('дом') || titleLower.includes('интерьер')) {
    result.categoryId = 'home'
  } else if (titleLower.includes('книг')) {
    result.categoryId = 'books'
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
  'ozon.by',
  'ozon.kz',
  // Yandex Market & Shop
  'market.yandex.ru',
  'market.yandex.by',
  'market.yandex.kz',
  'm.market.yandex.ru',
  'yandex.ru',
  'yandex.by',
  'ya.ru',
  // Onlíner
  'onliner.by',
  'catalog.onliner.by',
  // AliExpress
  'aliexpress.ru',
  'aliexpress.com',
  'm.aliexpress.ru',
  'm.aliexpress.com',
  // Popular stores
  'goldapple.ru',
  'goldapple.by',
  'megamarket.ru',
  'dns-shop.ru',
  'mvideo.ru',
  'eldorado.ru',
]

function isHostAllowed(hostname) {
  if (!hostname) return false
  const host = hostname.toLowerCase().trim()
  return ALLOWED_MARKETPLACE_HOSTS.some(allowed => host === allowed || host.endsWith('.' + allowed))
}

function createTimeoutSignal(ms) {
  try {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(ms)
    }
    if (typeof AbortController !== 'undefined') {
      const controller = new AbortController()
      setTimeout(() => controller.abort(new Error('Timeout')), ms)
      return controller.signal
    }
  } catch (_) {}
  return undefined
}

async function safeFetch(url, options = {}, timeoutMs = 4000) {
  const signal = createTimeoutSignal(timeoutMs)
  const fetchOpts = { ...options }
  if (signal) fetchOpts.signal = signal
  return fetch(url, fetchOpts)
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

  const parsedUrl = parseUrlString(cleanUrl)
  if (!parsedUrl) {
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
          return safeFetch(cardUrl, {}, 3500).then(async (cardRes) => {
            if (!cardRes.ok) throw new Error('Not ok')
            const card = await cardRes.json()
            return { num, card }
          })
        })

        const { num, card } = await Promise.any(checks)

        let price = 0
        try {
          const prRes = await safeFetch(
            `https://basket-${num}.wbbasket.ru/vol${vol}/part${part}/${nmId}/info/price-history.json`,
            {},
            1800
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

    // 2. Onlíner dedicated resolver (catalog.onliner.by, onliner.by)
    if (parsedUrl.hostname.includes('onliner.by')) {
      try {
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean)
        const key = pathParts[pathParts.length - 1]
        if (key) {
          const onlinerApiUrl = `https://catalog.onliner.by/sdapi/catalog.api/search/products?query=${encodeURIComponent(key)}`
          const onlinerRes = await safeFetch(onlinerApiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
            }
          }, 3500)
          if (onlinerRes.ok) {
            const data = await onlinerRes.json()
            const prod = data.products?.[0]
            if (prod) {
              const title = prod.full_name || prod.name || 'Товар Onlíner'
              const imageUrl = prod.images?.header || prod.images?.icon || ''
              let price = 0
              if (prod.prices?.price_min?.amount) {
                const bynAmount = parseFloat(prod.prices.price_min.amount)
                if (!isNaN(bynAmount)) {
                  // Base currency in database is RUB, 1 BYN ≈ 29.5 RUB
                  price = Math.round(bynAmount * 29.5)
                }
              }
              let categoryId = 'other'
              const catName = (prod.micro_description || prod.description || '').toLowerCase()
              if (catName.includes('электрон') || catName.includes('смартфон') || catName.includes('телефон') || catName.includes('ноутбук') || catName.includes('наушник') || parsedUrl.pathname.includes('/mobile/')) {
                categoryId = 'gadgets'
              } else if (catName.includes('одежд') || catName.includes('обув')) {
                categoryId = 'clothes'
              } else if (catName.includes('дом') || catName.includes('мебель') || catName.includes('техник')) {
                categoryId = 'home'
              } else if (catName.includes('книг')) {
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
            }
          }
        }
      } catch (_) {}
    }

    // 3. Generic Fetch + OpenGraph/Schema.org parsing (Ozon, Yandex Market, AliExpress, etc.)
    const response = await safeFetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (TelegramBot/1.0; +https://telegram.org)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    }, 4000)

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
