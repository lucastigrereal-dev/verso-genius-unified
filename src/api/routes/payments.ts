/**
 * Payment Routes
 * Stripe integration endpoints
 */

import { Hono } from 'hono'
import { PaymentService } from '../services/paymentService'

const router = new Hono()

/**
 * POST /api/v1/payments/create-checkout
 * Criar sessão de checkout
 */
router.post('/create-checkout', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const { productId, successUrl, cancelUrl } = await c.req.json()

    if (!productId || !successUrl || !cancelUrl) {
      return c.json({
        success: false,
        error: 'Parâmetros incompletos'
      }, 400)
    }

    const session = await PaymentService.createCheckoutSession(
      user.id,
      productId,
      successUrl,
      cancelUrl
    )

    return c.json({
      success: true,
      data: session
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400)
  }
})

/**
 * POST /api/v1/payments/webhook
 * Webhook do Stripe (sem autenticação)
 */
router.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('stripe-signature')

    if (!signature) {
      return c.json({ error: 'No signature' }, 400)
    }

    const payload = await c.req.text()

    await PaymentService.handleWebhook(payload, signature)

    return c.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return c.json({
      error: error.message
    }, 400)
  }
})

/**
 * POST /api/v1/payments/cancel-subscription
 * Cancelar assinatura
 */
router.post('/cancel-subscription', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    await PaymentService.cancelSubscription(user.id)

    return c.json({
      success: true,
      message: 'Assinatura cancelada'
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400)
  }
})

/**
 * POST /api/v1/payments/customer-portal
 * Gerar link para portal do cliente
 */
router.post('/customer-portal', async (c) => {
  try {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Não autorizado' }, 401)
    }

    const { returnUrl } = await c.req.json()

    const portalUrl = await PaymentService.createCustomerPortalSession(
      user.id,
      returnUrl || 'https://vercel-app.com/account'
    )

    return c.json({
      success: true,
      data: { url: portalUrl }
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400)
  }
})

/**
 * GET /api/v1/payments/products
 * Listar produtos disponíveis
 */
router.get('/products', async (c) => {
  return c.json({
    success: true,
    data: Object.values(PaymentService.PRODUCTS)
  })
})

export default router
