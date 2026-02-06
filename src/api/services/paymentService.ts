/**
 * Payment Service
 * Integração com Stripe para pagamentos
 */

import Stripe from 'stripe'
import { supabase } from '../../../config/supabase'
import { CurrencyService } from './currencyService'
import type { Purchase, ShopProduct } from '../../types/monetization'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia'
})

export class PaymentService {
  /**
   * Produtos disponíveis para compra
   */
  static readonly PRODUCTS = {
    // Gems
    gems_50: {
      id: 'gems_50',
      name: '50 Gems',
      price_brl: 4.90,
      gems_amount: 50,
      type: 'gems'
    },
    gems_250: {
      id: 'gems_250',
      name: '250 Gems + 50 Bônus',
      price_brl: 19.90,
      gems_amount: 300,
      type: 'gems'
    },
    gems_700: {
      id: 'gems_700',
      name: '700 Gems + 200 Bônus',
      price_brl: 49.90,
      gems_amount: 900,
      type: 'gems'
    },

    // Assinaturas
    subscription_pro_monthly: {
      id: 'subscription_pro_monthly',
      name: 'Pro Mensal',
      price_brl: 19.90,
      type: 'subscription',
      tier: 'pro',
      interval: 'month'
    },
    subscription_elite_monthly: {
      id: 'subscription_elite_monthly',
      name: 'Elite Mensal',
      price_brl: 39.90,
      type: 'subscription',
      tier: 'elite',
      interval: 'month'
    },
    subscription_pro_annual: {
      id: 'subscription_pro_annual',
      name: 'Pro Anual',
      price_brl: 179.90, // 25% desconto
      type: 'subscription',
      tier: 'pro',
      interval: 'year'
    },
    subscription_elite_annual: {
      id: 'subscription_elite_annual',
      name: 'Elite Anual',
      price_brl: 359.90, // 25% desconto
      type: 'subscription',
      tier: 'elite',
      interval: 'year'
    }
  } as const

  /**
   * Criar sessão de checkout do Stripe
   */
  static async createCheckoutSession(
    userId: string,
    productId: keyof typeof PaymentService.PRODUCTS,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    const product = this.PRODUCTS[productId]

    if (!product) {
      throw new Error('Produto inválido')
    }

    // Criar ou obter customer do Stripe
    const customerId = await this.getOrCreateStripeCustomer(userId)

    // Criar purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_type: product.type,
        product_id: productId,
        amount_brl: product.price_brl,
        status: 'pending',
        payment_method: 'stripe'
      })
      .select()
      .single()

    if (purchaseError || !purchase) {
      throw new Error('Erro ao criar compra')
    }

    // Criar sessão do Stripe
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            unit_amount: Math.round(product.price_brl * 100), // centavos
            product_data: {
              name: product.name,
              description: this.getProductDescription(product),
              metadata: {
                product_id: productId,
                purchase_id: purchase.id
              }
            }
          },
          quantity: 1
        }
      ],
      mode: product.type === 'subscription' ? 'subscription' : 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchase.id}`,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        purchase_id: purchase.id,
        product_id: productId
      }
    }

    // Se for assinatura, adicionar trial
    if (product.type === 'subscription') {
      sessionParams.subscription_data = {
        trial_period_days: 7,
        metadata: {
          tier: (product as any).tier,
          user_id: userId
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    // Atualizar purchase com session_id
    await supabase
      .from('purchases')
      .update({ stripe_payment_id: session.id })
      .eq('id', purchase.id)

    return {
      sessionId: session.id,
      url: session.url || ''
    }
  }

  /**
   * Obter ou criar customer do Stripe
   */
  private static async getOrCreateStripeCustomer(userId: string): Promise<string> {
    // Buscar usuário
    const { data: user } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!user) throw new Error('Usuário não encontrado')

    // Se já tem customer_id, retornar
    if (user.stripe_customer_id) {
      return user.stripe_customer_id
    }

    // Criar novo customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: userId
      }
    })

    // Salvar customer_id
    await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId)

    return customer.id
  }

  /**
   * Processar webhook do Stripe
   */
  static async handleWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET não configurado')
    }

    // Verificar assinatura
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

    // Processar evento
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription)
        break

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  }

  /**
   * Checkout completado
   */
  private static async handleCheckoutCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    const purchaseId = session.metadata?.purchase_id
    const userId = session.metadata?.user_id
    const productId = session.metadata?.product_id

    if (!purchaseId || !userId || !productId) {
      console.error('Metadata incompleto no checkout session')
      return
    }

    // Atualizar purchase
    await supabase
      .from('purchases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', purchaseId)

    // Dar recompensa ao usuário
    const product = this.PRODUCTS[productId as keyof typeof this.PRODUCTS]

    if (product.type === 'gems') {
      // Adicionar gems
      await CurrencyService.purchaseGems(
        userId,
        (product as any).gems_amount,
        purchaseId
      )
    } else if (product.type === 'subscription') {
      // Ativar assinatura
      await this.activateSubscription(userId, (product as any).tier, session.subscription as string)
    }
  }

  /**
   * Assinatura criada/atualizada
   */
  private static async handleSubscriptionChange(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const userId = subscription.metadata.user_id
    const tier = subscription.metadata.tier

    if (!userId || !tier) return

    await this.activateSubscription(userId, tier, subscription.id)
  }

  /**
   * Assinatura cancelada
   */
  private static async handleSubscriptionCancelled(
    subscription: Stripe.Subscription
  ): Promise<void> {
    // Desativar assinatura do usuário
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
  }

  /**
   * Pagamento falhou
   */
  private static async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    // Marcar purchase como failed
    await supabase
      .from('purchases')
      .update({ status: 'failed' })
      .eq('stripe_payment_id', paymentIntent.id)
  }

  /**
   * Ativar assinatura premium
   */
  private static async activateSubscription(
    userId: string,
    tier: string,
    stripeSubscriptionId: string
  ): Promise<void> {
    // Calcular data de expiração (30 dias para mensal, 365 para anual)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // TODO: ajustar baseado no interval

    // Criar ou atualizar assinatura
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier: tier as any,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        stripe_subscription_id: stripeSubscriptionId,
        auto_renew: true
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Erro ao ativar assinatura:', error)
    }
  }

  /**
   * Cancelar assinatura
   */
  static async cancelSubscription(userId: string): Promise<void> {
    // Buscar assinatura
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!subscription || !subscription.stripe_subscription_id) {
      throw new Error('Assinatura ativa não encontrada')
    }

    // Cancelar no Stripe
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id)

    // Atualizar no banco
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renew: false
      })
      .eq('user_id', userId)
  }

  /**
   * Descrição do produto
   */
  private static getProductDescription(product: any): string {
    if (product.type === 'gems') {
      return `${product.gems_amount} gems para usar na loja`
    }

    if (product.type === 'subscription') {
      const features = product.tier === 'pro'
        ? 'Exercícios ilimitados, 20 beats, sem anúncios'
        : 'Tudo de Pro + IA + Batalhas + Análise avançada'

      return features
    }

    return ''
  }

  /**
   * Obter portal do cliente (para gerenciar assinatura)
   */
  static async createCustomerPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<string> {
    const customerId = await this.getOrCreateStripeCustomer(userId)

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    })

    return session.url
  }
}
