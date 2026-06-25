/**
 * @integratewise/spend-insights
 * Spend Insights Service - Aggregates billing data from Stripe for real-time insights
 */

import { getStripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export interface SpendInsight {
  id: string
  type: "spend" | "usage" | "forecast" | "anomaly"
  title: string
  description: string
  value: number
  currency: string
  change?: number
  changePercent?: number
  period: "daily" | "weekly" | "monthly" | "yearly"
  source: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface SpendSummary {
  totalSpend: number
  totalSpendFormatted: string
  currency: string
  mrr: number
  arr: number
  activeSubscriptions: number
  churnRate: number
  avgRevenuePerAccount: number
  topSpendCategories: { category: string; amount: number; percent: number }[]
  insights: SpendInsight[]
  period: { start: Date; end: Date }
}

export class SpendInsightsService {
  /**
   * Get comprehensive spend summary for an organization
   */
  static async getSpendSummary(orgId: string, period: "month" | "quarter" | "year" = "month"): Promise<SpendSummary> {
    const stripe = getStripe()
    const supabase = await createClient()

    // Calculate date range
    const now = new Date()
    const start = new Date(now)
    if (period === "month") start.setMonth(start.getMonth() - 1)
    else if (period === "quarter") start.setMonth(start.getMonth() - 3)
    else start.setFullYear(start.getFullYear() - 1)

    // Get subscription data from Supabase
    const { data: subscription } = await supabase
      .from("org_subscriptions")
      .select("*, plan:plans(*)")
      .eq("org_id", orgId)
      .single()

    // Get invoices from Supabase
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("org_id", orgId)
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false })

    // Calculate totals
    const totalSpend =
      (invoices || []).filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + (inv.amount_cents || 0), 0) /
      100

    const plan = subscription?.plan as any
    const mrr = plan?.price_cents ? plan.price_cents / 100 : 0
    const arr = mrr * 12

    // Get Stripe metrics if available
    let stripeMetrics: any = {}
    if (stripe && subscription?.metadata?.stripe_customer_id) {
      try {
        const charges = await stripe.charges.list({
          customer: subscription.metadata.stripe_customer_id,
          created: { gte: Math.floor(start.getTime() / 1000) },
          limit: 100,
        })

        stripeMetrics = {
          totalCharges: charges.data.length,
          totalAmount: charges.data.reduce((sum, c) => sum + c.amount, 0) / 100,
          refunds: charges.data.filter((c) => c.refunded).length,
        }
      } catch (err) {
        console.error("[SpendInsights] Stripe fetch error:", err)
      }
    }

    // Generate insights
    const insights = await this.generateInsights(orgId, {
      totalSpend,
      mrr,
      arr,
      invoices: invoices || [],
      stripeMetrics,
    })

    return {
      totalSpend,
      totalSpendFormatted: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(totalSpend),
      currency: "USD",
      mrr,
      arr,
      activeSubscriptions: subscription ? 1 : 0,
      churnRate: 0, // TODO: Calculate from historical data
      avgRevenuePerAccount: mrr,
      topSpendCategories: [{ category: "Subscription", amount: mrr, percent: 100 }],
      insights,
      period: { start, end: now },
    }
  }

  /**
   * Get MRR trend over time
   */
  static async getMRRTrend(orgId: string, months = 12): Promise<{ date: string; mrr: number }[]> {
    const supabase = await createClient()

    const { data: auditLog } = await supabase
      .from("billing_audit_log")
      .select("*")
      .eq("org_id", orgId)
      .in("event_type", ["subscribe", "change_plan", "cancel"])
      .order("created_at", { ascending: true })

    // Build MRR timeline
    const trend: { date: string; mrr: number }[] = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      // Get subscription state at this point
      const { data: sub } = await supabase
        .from("org_subscriptions")
        .select("*, plan:plans(*)")
        .eq("org_id", orgId)
        .lte("created_at", date.toISOString())
        .single()

      const plan = sub?.plan as any
      trend.push({
        date: monthKey,
        mrr: plan?.price_cents ? plan.price_cents / 100 : 0,
      })
    }

    return trend
  }

  /**
   * Generate AI insights from spend data
   */
  private static async generateInsights(
    orgId: string,
    data: {
      totalSpend: number
      mrr: number
      arr: number
      invoices: any[]
      stripeMetrics: any
    },
  ): Promise<SpendInsight[]> {
    const insights: SpendInsight[] = []
    const now = new Date()

    // MRR insight
    insights.push({
      id: `mrr-${orgId}`,
      type: "spend",
      title: "Monthly Recurring Revenue",
      description: `Your current MRR is $${data.mrr.toLocaleString()}`,
      value: data.mrr,
      currency: "USD",
      period: "monthly",
      source: "Billing",
      createdAt: now,
    })

    // ARR insight
    insights.push({
      id: `arr-${orgId}`,
      type: "spend",
      title: "Annual Recurring Revenue",
      description: `Projected annual revenue based on current subscriptions`,
      value: data.arr,
      currency: "USD",
      period: "yearly",
      source: "Billing",
      createdAt: now,
    })

    // Invoice count insight
    if (data.invoices.length > 0) {
      const paidInvoices = data.invoices.filter((i) => i.status === "paid")
      const openInvoices = data.invoices.filter((i) => i.status === "open")

      if (openInvoices.length > 0) {
        insights.push({
          id: `open-invoices-${orgId}`,
          type: "anomaly",
          title: "Outstanding Invoices",
          description: `You have ${openInvoices.length} unpaid invoice(s) totaling $${(openInvoices.reduce((s, i) => s + i.amount_cents, 0) / 100).toLocaleString()}`,
          value: openInvoices.length,
          currency: "USD",
          period: "monthly",
          source: "Billing",
          createdAt: now,
        })
      }
    }

    // Forecast insight
    const forecastedSpend = data.mrr * 12
    insights.push({
      id: `forecast-${orgId}`,
      type: "forecast",
      title: "Projected Annual Spend",
      description: `Based on current usage, your estimated annual spend is $${forecastedSpend.toLocaleString()}`,
      value: forecastedSpend,
      currency: "USD",
      period: "yearly",
      source: "Analytics",
      createdAt: now,
    })

    return insights
  }

  /**
   * Store spend insights snapshot for historical tracking
   */
  static async storeSnapshot(orgId: string, summary: SpendSummary): Promise<void> {
    const supabase = await createClient()

    await supabase.from("spend_insights_snapshots").insert({
      org_id: orgId,
      total_spend: summary.totalSpend,
      mrr: summary.mrr,
      arr: summary.arr,
      active_subscriptions: summary.activeSubscriptions,
      churn_rate: summary.churnRate,
      insights: summary.insights,
      period_start: summary.period.start.toISOString(),
      period_end: summary.period.end.toISOString(),
    })
  }
}
