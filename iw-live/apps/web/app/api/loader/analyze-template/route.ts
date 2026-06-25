/**
 * Template Analyzer API
 * POST /api/loader/analyze-template
 * 
 * Analyzes a Notion/Confluence template URL and extracts its structure
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Client } from "@notionhq/client"

interface AnalyzeTemplateRequest {
  templateUrl: string
  workspaceId: string
  auth?: {
    notionToken?: string
  }
}

interface TemplateStructure {
  type: "notion" | "confluence"
  pageId: string
  databaseId?: string
  properties: Array<{
    name: string
    type: string
    options?: string[]
    required?: boolean
  }>
  title: string
  description?: string
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

    const body: AnalyzeTemplateRequest = await request.json()
    const { templateUrl, workspaceId } = body
    let auth = body.auth || {}

    if (!templateUrl || !workspaceId) {
      return NextResponse.json(
        { error: "templateUrl and workspaceId are required" },
        { status: 400 }
      )
    }

    // Parse URL to determine type
    const url = new URL(templateUrl)
    let templateType: "notion" | "confluence"
    let pageId: string
    let databaseId: string | undefined

    if (url.hostname.includes("notion.so") || url.hostname.includes("notion.site")) {
      templateType = "notion"
      // Extract page/database ID from Notion URL
      const match = templateUrl.match(/notion\.(?:so|site)\/(?:[^/]+\/)?([a-f0-9]{32})/)
      if (!match) {
        return NextResponse.json({ error: "Invalid Notion URL format" }, { status: 400 })
      }
      pageId = match[1].replace(/-/g, "")
    } else if (url.hostname.includes("atlassian.net")) {
      templateType = "confluence"
      // Extract page ID from Confluence URL
      const match = templateUrl.match(/\/pages\/viewpage\.action\?pageId=(\d+)/)
      if (!match) {
        return NextResponse.json({ error: "Invalid Confluence URL format" }, { status: 400 })
      }
      pageId = match[1]
    } else {
      return NextResponse.json(
        { error: "Unsupported template source. Only Notion and Confluence are supported." },
        { status: 400 }
      )
    }

    // Fetch template structure
    let structure: TemplateStructure

    if (templateType === "notion") {
      if (!auth.notionToken) {
        // Try to get from integrations table
        const { data: integration } = await supabase
          .from("integrations")
          .select("config")
          .eq("workspace_id", workspaceId)
          .eq("type", "notion")
          .eq("status", "active")
          .single()

        if (!integration?.config?.notion_token) {
          return NextResponse.json(
            { error: "Notion token required. Please connect Notion integration first." },
            { status: 400 }
          )
        }
        auth.notionToken = integration.config.notion_token
      }

      structure = await analyzeNotionTemplate(pageId, auth.notionToken)
    } else {
      // Confluence support - placeholder for now
      return NextResponse.json(
        { error: "Confluence template analysis coming soon" },
        { status: 501 }
      )
    }

    // Store template analysis in database for later use
    const { data: templateRecord, error: insertError } = await supabase
      .from("template_analyses")
      .insert({
        workspace_id: workspaceId,
        template_url: templateUrl,
        template_type: templateType,
        structure: structure,
        analyzed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error storing template analysis:", insertError)
      // Continue anyway - analysis is still valid
    }

    return NextResponse.json({
      success: true,
      structure,
      templateId: templateRecord?.id,
    })
  } catch (error: any) {
    console.error("Template analyzer error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to analyze template" },
      { status: 500 }
    )
  }
}

async function analyzeNotionTemplate(
  pageId: string,
  notionToken: string
): Promise<TemplateStructure> {
  const notion = new Client({ auth: notionToken })

  try {
    // Try to fetch as database first
    let database: any
    try {
      database = await notion.databases.retrieve({ database_id: pageId })
    } catch {
      // Not a database, try as page
      const page = await notion.pages.retrieve({ page_id: pageId })
      
      // Check if page has a database as a child
      const children = await notion.blocks.children.list({ block_id: pageId })
      const databaseBlock = children.results.find(
        (block: any) => block.type === "child_database"
      )

      if (databaseBlock) {
        database = await notion.databases.retrieve({
          database_id: databaseBlock.id,
        })
      } else {
        // It's a regular page template
        return {
          type: "notion",
          pageId,
          properties: [],
          title: extractNotionTitle(page),
        }
      }
    }

    // Extract properties from database
    const properties = Object.entries(database.properties).map(([name, prop]: [string, any]) => {
      const propInfo: TemplateStructure["properties"][0] = {
        name,
        type: prop.type,
      }

      // Add type-specific options
      if (prop.type === "select" && prop.select?.options) {
        propInfo.options = prop.select.options.map((opt: any) => opt.name)
      } else if (prop.type === "multi_select" && prop.multi_select?.options) {
        propInfo.options = prop.multi_select.options.map((opt: any) => opt.name)
      } else if (prop.type === "status" && prop.status?.options) {
        propInfo.options = prop.status.options.map((opt: any) => opt.name)
      }

      return propInfo
    })

    return {
      type: "notion",
      pageId,
      databaseId: database.id,
      properties,
      title: extractNotionTitle(database),
      description: database.description?.[0]?.plain_text,
    }
  } catch (error: any) {
    throw new Error(`Failed to analyze Notion template: ${error.message}`)
  }
}

function extractNotionTitle(obj: any): string {
  if (obj.title) {
    return obj.title.map((t: any) => t.plain_text).join("")
  }
  if (obj.properties?.Name?.title) {
    return obj.properties.Name.title.map((t: any) => t.plain_text).join("")
  }
  if (obj.properties?.Title?.title) {
    return obj.properties.Title.title.map((t: any) => t.plain_text).join("")
  }
  return "Untitled Template"
}
