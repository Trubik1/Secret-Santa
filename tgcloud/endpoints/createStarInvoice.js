import { api, EndpointError } from 'sdk'

export default async function (input, ctx) {
  const caller = ctx.initData?.user
  if (!caller?.id) {
    throw new EndpointError('Unauthorized: missing user in initData', { code: 'UNAUTHORIZED' })
  }

  const { giftId, amount, title, description } = input || {}
  const starsAmount = parseInt(amount, 10)

  if (!starsAmount || starsAmount <= 0) {
    throw new EndpointError('Сумма в звёздах должна быть больше нуля', { code: 'INVALID_AMOUNT' })
  }

  const invoiceTitle = (title || 'Сбор на подарок 🎁').slice(0, 32)
  const invoiceDesc = (description || `Взнос ${starsAmount} ⭐ Telegram Stars в вишлист`).slice(0, 255)

  try {
    const invoiceLink = await api.createInvoiceLink({
      title: invoiceTitle,
      description: invoiceDesc,
      payload: JSON.stringify({
        userId: caller.id,
        giftId: giftId || '',
        stars: starsAmount,
        timestamp: Date.now(),
      }),
      provider_token: '', // MUST be empty for Telegram Stars
      currency: 'XTR',    // XTR = Telegram Stars
      prices: [
        { label: `${starsAmount} ⭐ Stars`, amount: starsAmount }
      ]
    })

    return { ok: true, invoiceLink }
  } catch (err) {
    console.error('Failed to create Star invoice link:', err)
    throw new EndpointError('Не удалось создать инвойс в Stars: ' + (err.message || err), { code: 'INVOICE_FAILED' })
  }
}
