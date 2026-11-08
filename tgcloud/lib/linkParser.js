import { fetch } from 'sdk'

/**
 * Extracts OpenGraph, Twitter, and Schema meta data from raw HTML.
 */
function extractMetaFromHtml(html, originalUrl) {
  const result = {
    title: '',
    imageUrl: '',
    price: 0,
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
    } catch (_) {
      // ignore json parse errors
    }
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

/**
 * Main parser entry point.
 */
export async function parseProductUrl(targetUrl) {
  const cleanUrl = targetUrl.trim()
  const fallback = {
    title: '',
    imageUrl: '',
    price: 0,
    url: cleanUrl,
    parsed: false,
  }

  if (!cleanUrl || !cleanUrl.startsWith('http')) {
    return fallback
  }

  try {
    // 1. Wildberries direct API optimization
    const wbArticleMatch = cleanUrl.match(/(?:wildberries\.ru\/catalog\/|wb\.ru\/catalog\/)(\d+)/i)
    if (wbArticleMatch && wbArticleMatch[1]) {
      const nmId = wbArticleMatch[1]
      try {
        const apiUrl = `https://card.wb.ru/cards/v1/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm=${nmId}`
        const res = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          }
        })
        if (res.ok) {
          const data = await res.json()
          const product = data?.data?.products?.[0]
          if (product) {
            // Price in WB is in kopecks / salePriceU
            const price = product.salePriceU ? Math.round(product.salePriceU / 100) : (product.priceU ? Math.round(product.priceU / 100) : 0)
            const title = product.name || product.brand ? `${product.brand ? product.brand + ' / ' : ''}${product.name || ''}`.trim() : ''

            // Calculate WB basket host for image
            const vol = Math.floor(parseInt(nmId, 10) / 100000)
            const part = Math.floor(parseInt(nmId, 10) / 1000)
            let basket = '01'
            if (vol >= 0 && vol <= 143) basket = '01'
            else if (vol <= 287) basket = '02'
            else if (vol <= 431) basket = '03'
            else if (vol <= 719) basket = '04'
            else if (vol <= 1007) basket = '05'
            else if (vol <= 1061) basket = '06'
            else if (vol <= 1115) basket = '07'
            else if (vol <= 1169) basket = '08'
            else if (vol <= 1313) basket = '09'
            else if (vol <= 1601) basket = '10'
            else if (vol <= 1655) basket = '11'
            else if (vol <= 1919) basket = '12'
            else if (vol <= 2045) basket = '13'
            else if (vol <= 2189) basket = '14'
            else if (vol <= 2405) basket = '15'
            else if (vol <= 2621) basket = '16'
            else if (vol <= 2837) basket = '17'
            else basket = '18'

            const imageUrl = `https://basket-${basket}.wbbasket.ru/vol${vol}/part${part}/${nmId}/images/big/1.webp`

            return {
              title: title || 'Товар Wildberries',
              imageUrl,
              price,
              url: cleanUrl,
              parsed: true,
            }
          }
        }
      } catch (wbErr) {
        console.warn('WB direct API failed, falling back to HTML fetch:', wbErr)
      }
    }

    // 2. Generic Fetch + OpenGraph parsing
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (TelegramBot/1.0; +https://telegram.org)',
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
      url: cleanUrl,
      parsed: parsed.parsed,
    }
  } catch (err) {
    console.warn('URL parsing failed:', err)
    return fallback
  }
}
