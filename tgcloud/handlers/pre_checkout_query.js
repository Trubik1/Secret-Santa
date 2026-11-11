import { api } from 'sdk'

export default async function (preCheckoutQuery, ctx) {
  try {
    await api.answerPreCheckoutQuery({
      pre_checkout_query_id: preCheckoutQuery.id,
      ok: true,
    })
  } catch (err) {
    console.error('Failed to answer pre_checkout_query:', err)
  }
}
