import { type NextRequest, NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/stripe"

// Disable body parsing for webhook signature verification
export const runtime = "nodejs"

/**
 * Stripe webhook handler
 * POST /api/stripe/webhook
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  // Get raw body for signature verification
  const payload = await request.text()

  // Verify webhook signature
  const event = await verifyWebhookSignature(payload, signature)

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // Handle webhook events
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        console.log("[Stripe Webhook] Checkout completed:", session.id)
        // Handle successful checkout
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object
        console.log("[Stripe Webhook] Subscription update:", subscription.id, subscription.status)
        // Handle subscription changes
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        console.log("[Stripe Webhook] Subscription cancelled:", subscription.id)
        // Handle subscription cancellation
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object
        console.log("[Stripe Webhook] Payment succeeded:", invoice.id)
        // Handle successful payment
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        console.log("[Stripe Webhook] Payment failed:", invoice.id)
        // Handle failed payment
        break
      }

      default:
        console.log("[Stripe Webhook] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true, type: event.type })
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
