/**
 * BYOT Template Loader
 * Loads and applies BYOT templates from database
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export interface BYOTTemplate {
  templateId: string
  templateName: string
  templateCode: string
  product: "os" | "cs" | "business"
  tier: "starter" | "growth" | "scale" | "enterprise"
  platform: "notion" | "coda" | "airtable" | "sheets" | "monday" | "api"
  schema: {
    databases: Array<{
      name: string
      canonicalSource: string
      fields: Array<{
        name: string
        canonicalField: string
        platformType: string
        format?: string
        options?: Array<{ value: string; label: string; color?: string }>
        relation?: string
      }>
    }>
  }
  relations: Array<{
    from: string
    to: string
    type: "many_to_one" | "one_to_many" | "many_to_many"
    field: string
  }>
  views: Array<{
    name: string
    database: string
    type: "table" | "board" | "gallery" | "calendar"
    filter?: Record<string, any>
    sort?: Record<string, any>
    groupBy?: string
  }>
}

/**
 * Load BYOT template by code
 */
export async function loadBYOTTemplate(
  supabase: SupabaseClient,
  templateCode: string,
  workspaceId?: string
): Promise<BYOTTemplate | null> {
  let query = supabase
    .from("byot_templates")
    .select("*")
    .eq("template_code", templateCode)
    .eq("status", "active")

  // Prefer workspace-specific template, fallback to system template
  if (workspaceId) {
    query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
  } else {
    query = query.is("workspace_id", null)
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(1).single()

  if (error || !data) {
    return null
  }

  return {
    templateId: data.template_id,
    templateName: data.template_name,
    templateCode: data.template_code,
    product: data.product,
    tier: data.tier,
    platform: data.platform,
    schema: data.schema,
    relations: data.relations || [],
    views: data.views || [],
  }
}

/**
 * Map canonical data to template schema
 */
export function mapCanonicalToTemplate(
  template: BYOTTemplate,
  canonicalData: Record<string, any>
): Record<string, any> {
  const mapped: Record<string, any> = {}

  for (const database of template.schema.databases) {
    const dbData: Record<string, any> = {}

    for (const field of database.fields) {
      const canonicalValue = canonicalData[field.canonicalField]

      if (canonicalValue !== undefined && canonicalValue !== null) {
        // Apply platform-specific formatting
        if (field.platformType === "number" && field.format === "dollar") {
          dbData[field.name] = typeof canonicalValue === "number" ? canonicalValue : parseFloat(canonicalValue)
        } else if (field.platformType === "date") {
          dbData[field.name] = canonicalValue instanceof Date ? canonicalValue.toISOString() : canonicalValue
        } else if (field.platformType === "select" || field.platformType === "status") {
          // Map to option value
          const option = field.options?.find((opt) => opt.value === canonicalValue || opt.label === canonicalValue)
          dbData[field.name] = option?.value || canonicalValue
        } else {
          dbData[field.name] = canonicalValue
        }
      }
    }

    mapped[database.name] = dbData
  }

  return mapped
}

/**
 * Render mapped data to platform
 */
export async function renderToPlatform(
  template: BYOTTemplate,
  mappedData: Record<string, any>,
  platformConfig: Record<string, any>
): Promise<{ success: boolean; recordIds: string[]; errors: string[] }> {
  const recordIds: string[] = []
  const errors: string[] = []

  switch (template.platform) {
    case "notion":
      return await renderToNotion(template, mappedData, platformConfig)
    case "coda":
      return await renderToCoda(template, mappedData, platformConfig)
    case "airtable":
      return await renderToAirtable(template, mappedData, platformConfig)
    case "sheets":
      return await renderToSheets(template, mappedData, platformConfig)
    case "monday":
      return await renderToMonday(template, mappedData, platformConfig)
    default:
      return { success: false, recordIds: [], errors: ["Unsupported platform"] }
  }
}

/**
 * Render to Notion
 */
async function renderToNotion(
  template: BYOTTemplate,
  mappedData: Record<string, any>,
  config: Record<string, any>
): Promise<{ success: boolean; recordIds: string[]; errors: string[] }> {
  // TODO: Implement Notion API rendering
  // Use existing render logic from /api/loader/render
  return { success: false, recordIds: [], errors: ["Notion rendering not yet implemented"] }
}

/**
 * Render to Coda
 */
async function renderToCoda(
  template: BYOTTemplate,
  mappedData: Record<string, any>,
  config: Record<string, any>
): Promise<{ success: boolean; recordIds: string[]; errors: string[] }> {
  return { success: false, recordIds: [], errors: ["Coda rendering not yet implemented"] }
}

/**
 * Render to Airtable
 */
async function renderToAirtable(
  template: BYOTTemplate,
  mappedData: Record<string, any>,
  config: Record<string, any>
): Promise<{ success: boolean; recordIds: string[]; errors: string[] }> {
  return { success: false, recordIds: [], errors: ["Airtable rendering not yet implemented"] }
}

/**
 * Render to Google Sheets
 */
async function renderToSheets(
  template: BYOTTemplate,
  mappedData: Record<string, any>,
  config: Record<string, any>
): Promise<{ success: boolean; recordIds: string[]; errors: string[] }> {
  return { success: false, recordIds: [], errors: ["Sheets rendering not yet implemented"] }
}

/**
 * Render to Monday.com
 */
async function renderToMonday(
  template: BYOTTemplate,
  mappedData: Record<string, any>,
  config: Record<string, any>
): Promise<{ success: boolean; recordIds: string[]; errors: string[] }> {
  return { success: false, recordIds: [], errors: ["Monday rendering not yet implemented"] }
}
