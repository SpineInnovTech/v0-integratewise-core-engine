/**
 * Universal Renderer API
 * POST /api/loader/render
 * 
 * Renders normalized data to Notion/Confluence using template schema
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Client } from "@notionhq/client"
import { loadBYOTTemplate, mapCanonicalToTemplate, renderToPlatform } from "@/lib/byot/template-loader"

interface RenderRequest {
  workspaceId: string
  templateId: string
  data: Record<string, any>
  targetDatabaseId?: string // For Notion databases
  auth?: {
    notionToken?: string
  }
}

// Simple JSON Schema validator (basic implementation)
function validateSchema(schema: any, data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (schema.type === "object" && typeof data !== "object") {
    errors.push(`Expected object, got ${typeof data}`)
    return { valid: false, errors }
  }
  
  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const value = data[key]
      
      if (schema.required?.includes(key) && (value === undefined || value === null)) {
        errors.push(`Required property '${key}' is missing`)
        continue
      }
      
      if (value !== undefined && propSchema) {
        const ps = propSchema as any
        if (ps.type === "string" && typeof value !== "string") {
          errors.push(`Property '${key}' must be a string`)
        } else if (ps.type === "number" && typeof value !== "number") {
          errors.push(`Property '${key}' must be a number`)
        } else if (ps.type === "boolean" && typeof value !== "boolean") {
          errors.push(`Property '${key}' must be a boolean`)
        } else if (ps.type === "array" && !Array.isArray(value)) {
          errors.push(`Property '${key}' must be an array`)
        } else if (ps.enum && !ps.enum.includes(value)) {
          errors.push(`Property '${key}' must be one of: ${ps.enum.join(", ")}`)
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: RenderRequest = await request.json()
    const { workspaceId, templateId, data, targetDatabaseId } = body
    let auth = body.auth || {}

    if (!workspaceId || !templateId || !data) {
      return NextResponse.json(
        { error: "workspaceId, templateId, and data are required" },
        { status: 400 }
      )
    }

    // Get template schema
    const { data: templateSchema, error: schemaError } = await supabase
      .from("template_schemas")
      .select("json_schema, template_structure")
      .eq("workspace_id", workspaceId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single()

    if (schemaError || !templateSchema) {
      return NextResponse.json(
        { error: "Template schema not found. Please analyze template first." },
        { status: 404 }
      )
    }

    // Validate data against schema
    const validation = validateSchema(templateSchema.json_schema, data)

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Data validation failed",
          errors: validation.errors,
        },
        { status: 400 }
      )
    }

    // Try to load BYOT template first (new system)
    const templateCode = body.templateCode || "os_starter_notion"
    const byotTemplate = await loadBYOTTemplate(supabase, templateCode, workspaceId)

    let result: { success: boolean; pageId?: string; url?: string; error?: string }

    if (byotTemplate) {
      // Use new BYOT template system
      const mappedData = mapCanonicalToTemplate(byotTemplate, data)
      const renderResult = await renderToPlatform(
        byotTemplate,
        mappedData,
        body.byotConfig || {}
      )

      if (!renderResult.success) {
        return NextResponse.json(
          { error: renderResult.errors.join(", ") },
          { status: 500 }
        )
      }

      result = {
        success: true,
        pageId: renderResult.recordIds[0],
        url: renderResult.recordIds[0] ? `https://notion.so/${renderResult.recordIds[0]}` : undefined,
      }
    } else {
      // Fallback to old template analysis system
      const { data: templateAnalysis } = await supabase
        .from("template_analyses")
        .select("template_type, structure")
        .eq("workspace_id", workspaceId)
        .order("analyzed_at", { ascending: false })
        .limit(1)
        .single()

      if (!templateAnalysis) {
        return NextResponse.json(
          { error: "Template not found. Please analyze template first or provide templateCode." },
          { status: 404 }
        )
      }

      if (templateAnalysis.template_type === "notion") {
      if (!auth.notionToken) {
        // Try to get from integrations
        const { data: integration } = await supabase
          .from("integrations")
          .select("config")
          .eq("workspace_id", workspaceId)
          .eq("type", "notion")
          .eq("status", "active")
          .single()

        if (!integration?.config?.notion_token) {
          return NextResponse.json(
            { error: "Notion token required" },
            { status: 400 }
          )
        }
        auth.notionToken = integration.config.notion_token
      }

      result = await renderToNotion(
        data,
        templateSchema.template_structure,
        targetDatabaseId || templateAnalysis.structure.databaseId,
        auth.notionToken
      )
      } else {
        return NextResponse.json(
          { error: "Confluence rendering coming soon" },
          { status: 501 }
        )
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to render" },
        { status: 500 }
      )
    }

    // Store render result
    await supabase.from("template_renders").insert({
      workspace_id: workspaceId,
      template_id: templateId,
      rendered_data: data,
      result: result,
      rendered_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      pageId: result.pageId,
      url: result.url,
    })
  } catch (error: any) {
    console.error("Renderer error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to render" },
      { status: 500 }
    )
  }
}

async function renderToNotion(
  data: Record<string, any>,
  templateStructure: any,
  databaseId: string | undefined,
  notionToken: string
): Promise<{ success: boolean; pageId?: string; url?: string; error?: string }> {
  const notion = new Client({ auth: notionToken })

  try {
    // Map data to Notion properties format
    const properties: Record<string, any> = {}

    for (const prop of templateStructure.properties || []) {
      const value = data[prop.name]

      if (value === undefined || value === null) {
        continue
      }

      switch (prop.type) {
        case "title":
          properties[prop.name] = {
            title: [{ text: { content: String(value) } }],
          }
          break
        case "rich_text":
        case "text":
          properties[prop.name] = {
            rich_text: [{ text: { content: String(value) } }],
          }
          break
        case "number":
          properties[prop.name] = {
            number: Number(value),
          }
          break
        case "date":
          properties[prop.name] = {
            date: {
              start: new Date(value).toISOString(),
            },
          }
          break
        case "checkbox":
          properties[prop.name] = {
            checkbox: Boolean(value),
          }
          break
        case "select":
        case "status":
          properties[prop.name] = {
            [prop.type]: {
              name: String(value),
            },
          }
          break
        case "multi_select":
          properties[prop.name] = {
            multi_select: Array.isArray(value)
              ? value.map((v) => ({ name: String(v) }))
              : [{ name: String(value) }],
          }
          break
        case "people":
          // For people, we'd need user IDs - simplified for now
          properties[prop.name] = {
            people: Array.isArray(value)
              ? value.map((v) => ({ id: String(v) }))
              : [],
          }
          break
        default:
          // Fallback to rich_text
          properties[prop.name] = {
            rich_text: [{ text: { content: String(value) } }],
          }
      }
    }

    // Create page in database or as standalone page
    if (databaseId) {
      const page = await notion.pages.create({
        parent: { database_id: databaseId },
        properties,
      })

      return {
        success: true,
        pageId: page.id,
        url: `https://notion.so/${page.id.replace(/-/g, "")}`,
      }
    } else {
      // Create standalone page (requires parent page ID)
      // For now, return error - user should specify database
      return {
        success: false,
        error: "Database ID required for Notion rendering",
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create Notion page",
    }
  }
}
