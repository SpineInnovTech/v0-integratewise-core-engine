import Stripe from "stripe"

// Singleton Stripe client instance
let stripeClient: Stripe | null = null

/**
 * Get Stripe client instance (singleton pattern)
 * Uses STRIPE_SECRET_KEY from environment
 */
export function getStripe(): Stripe | null {
  if (stripeClient) return stripeClient

  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    console.warn("[Stripe] STRIPE_SECRET_KEY not configured")
    return null
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
    typescript: true,
  })

  return stripeClient
}

/**
 * Verify Stripe webhook signature
 * @param payload - Raw request body as string
 * @param signature - Stripe-Signature header value
 * @returns Stripe.Event if valid, null if invalid
 */
export async function verifyWebhookSignature(payload: string, signature: string): Promise<Stripe.Event | null> {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    console.error("[Stripe] Missing Stripe client or webhook secret")
    return null
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    return event
  } catch (err) {
    console.error("[Stripe] Webhook signature verification failed:", err)
    return null
  }
}

/**
 * Helper to create a checkout session
 */
export async function createCheckoutSession(params: {
  customerId?: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session | null> {
  const stripe = getStripe()
  if (!stripe) return null

  try {
    const session = await stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    })
    return session
  } catch (err) {
    console.error("[Stripe] Failed to create checkout session:", err)
    return null
  }
}

/**
 * Helper to create a customer portal session
 */
export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<Stripe.BillingPortal.Session | null> {
  const stripe = getStripe()
  if (!stripe) return null

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    })
    return session
  } catch (err) {
    console.error("[Stripe] Failed to create portal session:", err)
    return null
  }
}
