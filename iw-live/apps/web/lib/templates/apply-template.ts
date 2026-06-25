/**
 * Template Application Logic
 *
 * Applies an industry template to a new organization,
 * creating all the pre-configured data in Supabase.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { IndustryTemplate } from "./industry-templates"

interface ApplyTemplateResult {
  success: boolean
  error?: string
  data?: {
    pipelineStagesCreated: number
    accountsCreated: number
    servicesCreated: number
    productsCreated: number
  }
}

export async function applyTemplate(
  supabase: SupabaseClient,
  orgId: string,
  template: IndustryTemplate
): Promise<ApplyTemplateResult> {
  try {
    // 1. Update organization with template settings
    const { error: orgError } = await supabase
      .from("organizations")
      .update({
        industry: template.id,
        default_currency: template.defaultCurrency,
        fiscal_year_start: template.fiscalYearStart,
        tax_system: template.taxConfig.taxType,
        default_tax_rate: template.taxConfig.defaultTaxRate,
        template_applied: template.id,
        onboarding_step: "template_applied",
      })
      .eq("id", orgId)

    if (orgError) {
      console.error("Error updating organization:", orgError)
      // Continue anyway - org might not have all these columns yet
    }

    // 2. Create pipeline stages
    let pipelineStagesCreated = 0
    if (template.pipeline.length > 0) {
      const pipelineData = template.pipeline.map((stage, index) => ({
        org_id: orgId,
        name: stage.name,
        probability: stage.probability,
        days_in_stage: stage.daysInStage,
        color: stage.color,
        sort_order: index,
        is_active: true,
      }))

      const { data: pipelineResult, error: pipelineError } = await supabase
        .from("pipeline_stages")
        .insert(pipelineData)
        .select()

      if (pipelineError) {
        console.error("Error creating pipeline stages:", pipelineError)
      } else {
        pipelineStagesCreated = pipelineResult?.length || 0
      }
    }

    // 3. Create chart of accounts
    let accountsCreated = 0
    if (template.chartOfAccounts.length > 0) {
      const accountsData = template.chartOfAccounts.map((acc) => ({
        org_id: orgId,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
        is_active: true,
      }))

      const { data: accountsResult, error: accountsError } = await supabase
        .from("chart_of_accounts")
        .insert(accountsData)
        .select()

      if (accountsError) {
        console.error("Error creating chart of accounts:", accountsError)
      } else {
        accountsCreated = accountsResult?.length || 0
      }
    }

    // 4. Create services
    let servicesCreated = 0
    if (template.services.length > 0) {
      const servicesData = template.services.map((svc) => ({
        org_id: orgId,
        name: svc.name,
        description: svc.description,
        category: svc.category,
        hourly_rate: svc.hourlyRate || null,
        fixed_price: svc.fixedPrice || null,
        is_taxable: svc.taxable,
        is_active: true,
      }))

      const { data: servicesResult, error: servicesError } = await supabase
        .from("services")
        .insert(servicesData)
        .select()

      if (servicesError) {
        console.error("Error creating services:", servicesError)
      } else {
        servicesCreated = servicesResult?.length || 0
      }
    }

    // 5. Create products
    let productsCreated = 0
    if (template.products.length > 0) {
      const productsData = template.products.map((prod) => ({
        org_id: orgId,
        name: prod.name,
        description: prod.description,
        category: prod.category,
        price: prod.defaultPrice || 0,
        is_taxable: prod.taxable,
        is_active: true,
      }))

      const { data: productsResult, error: productsError } = await supabase
        .from("products")
        .insert(productsData)
        .select()

      if (productsError) {
        console.error("Error creating products:", productsError)
      } else {
        productsCreated = productsResult?.length || 0
      }
    }

    // 6. Create KPIs
    if (template.kpis.length > 0) {
      const kpisData = template.kpis.map((kpi) => ({
        org_id: orgId,
        name: kpi.name,
        metric: kpi.metric,
        target_value: kpi.target,
        unit: kpi.unit,
        is_active: true,
      }))

      const { error: kpisError } = await supabase
        .from("kpis")
        .insert(kpisData)

      if (kpisError) {
        console.error("Error creating KPIs:", kpisError)
      }
    }

    // 7. Create dashboard widget preferences
    if (template.dashboardWidgets.length > 0) {
      const widgetsData = template.dashboardWidgets.map((widget) => ({
        org_id: orgId,
        widget_type: widget.type,
        title: widget.title,
        size: widget.size,
        position: widget.position,
        is_visible: true,
      }))

      const { error: widgetsError } = await supabase
        .from("dashboard_widgets")
        .insert(widgetsData)

      if (widgetsError) {
        console.error("Error creating dashboard widgets:", widgetsError)
      }
    }

    // 8. Create tax settings
    const { error: taxError } = await supabase
      .from("org_tax_settings")
      .insert({
        org_id: orgId,
        tax_type: template.taxConfig.taxType,
        default_rate: template.taxConfig.defaultTaxRate,
        includes_in_price: template.taxConfig.includesInPrice,
      })

    if (taxError) {
      console.error("Error creating tax settings:", taxError)
    }

    return {
      success: true,
      data: {
        pipelineStagesCreated,
        accountsCreated,
        servicesCreated,
        productsCreated,
      },
    }
  } catch (error) {
    console.error("Error applying template:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Check if organization has already applied a template
 */
export async function hasAppliedTemplate(
  supabase: SupabaseClient,
  orgId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("organizations")
    .select("template_applied")
    .eq("id", orgId)
    .single()

  return Boolean(data?.template_applied)
}

/**
 * Reset template data (for re-applying or starting fresh)
 */
export async function resetTemplateData(
  supabase: SupabaseClient,
  orgId: string
): Promise<void> {
  // Delete in order due to foreign key constraints
  await supabase.from("dashboard_widgets").delete().eq("org_id", orgId)
  await supabase.from("kpis").delete().eq("org_id", orgId)
  await supabase.from("org_tax_settings").delete().eq("org_id", orgId)
  await supabase.from("products").delete().eq("org_id", orgId)
  await supabase.from("services").delete().eq("org_id", orgId)
  await supabase.from("chart_of_accounts").delete().eq("org_id", orgId)
  await supabase.from("pipeline_stages").delete().eq("org_id", orgId)

  // Reset org template status
  await supabase
    .from("organizations")
    .update({ template_applied: null, onboarding_step: null })
    .eq("id", orgId)
}
