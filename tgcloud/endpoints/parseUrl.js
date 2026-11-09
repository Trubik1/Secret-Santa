import { EndpointError } from 'sdk'
import { parseProductUrl } from '../lib/linkParser.js'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  const url = input?.url?.trim()
  if (!url) {
    throw new EndpointError('Ссылка не указана', { code: 'MISSING_URL' })
  }

  const parsed = await parseProductUrl(url)
  return parsed
}
