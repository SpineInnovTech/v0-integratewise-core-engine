import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const templatePrices: Record<string, { name: string; price: number; priceId?: string }> = {
  "health-score": { name: "Health Score Calculator", price: 2499 },
  "churn-detector": { name: "Churn Risk Detector", price: 3499 },
  "lead-router": { name: "Intelligent Lead Router", price: 1999 },
  "lead-enrichment": { name: "Lead Enrichment Pipeline", price: 2999 },
  "data-sync": { name: "Multi-CRM Data Sync", price: 3999 },
  "success-pilot": { name: "SuccessPilot AI Agent", price: 4999 },
  "churn-shield": { name: "ChurnShield AI Agent", price: 5999 },
  "slack-hubspot": { name: "Slack ↔ HubSpot Bridge", price: 1499 },
  "email-sequences": { name: "Smart Email Sequences", price: 2499 },
  "meeting-prep": { name: "Meeting Prep Automator", price: 1999 },
}

const bundlePrices: Record<string, { name: string; price: number; templates: string[] }> = {
  "cs-starter": {
    name: "CS Starter Pack",
    price: 5999,
    templates: ["health-score", "churn-detector", "meeting-prep"],
  },
  "lead-gen": {
    name: "Lead Gen Bundle",
    price: 5499,
    templates: ["lead-router", "lead-enrichment", "email-sequences"],
  },
  "ai-ops": {
    name: "AI Operations Suite",
    price: 8999,
    templates: ["success-pilot", "churn-shield", "weekly-report"],
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const templateId = searchParams.get("template")
  const bundleId = searchParams.get("bundle")

  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://os.integratewise.online"

  try {
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    let metadata: Record<string, string> = {}

    if (templateId && templatePrices[templateId]) {
      const template = templatePrices[templateId]
      lineItems = [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: template.name,
              description: "n8n workflow template - Instant download after purchase",
            },
            unit_amount: template.price * 100, // Stripe uses paise
          },
          quantity: 1,
        },
      ]
      metadata = { type: "template", templateId }
    } else if (bundleId && bundlePrices[bundleId]) {
      const bundle = bundlePrices[bundleId]
      lineItems = [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: bundle.name,
              description: `Bundle includes: ${bundle.templates.length} templates`,
            },
            unit_amount: bundle.price * 100,
          },
          quantity: 1,
        },
      ]
      metadata = { type: "bundle", bundleId, templates: bundle.templates.join(",") }
    } else {
      return NextResponse.redirect(`${baseUrl}/templates?error=invalid_product`)
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/templates/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/templates?canceled=true`,
      metadata,
    })

    return NextResponse.redirect(session.url!)
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.redirect(`${baseUrl}/templates?error=checkout_failed`)
  }
}
