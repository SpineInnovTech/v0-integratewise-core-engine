/**
 * Schema Generator API
 * POST /api/loader/generate-schema
 * 
 * Uses LLM to generate JSON Schema from template structure
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

interface GenerateSchemaRequest {
  templateStructure: {
    type: "notion" | "confluence"
    properties: Array<{
      name: string
      type: string
      options?: string[]
      required?: boolean
    }>
    title: string
    description?: string
  }
  workspaceId: string
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

    const body: GenerateSchemaRequest = await request.json()
    const { templateStructure, workspaceId } = body

    if (!templateStructure || !workspaceId) {
      return NextResponse.json(
        { error: "templateStructure and workspaceId are required" },
        { status: 400 }
      )
    }

    // Generate JSON Schema using LLM
    const schema = await generateJSONSchema(templateStructure)

    // Store schema for later use
    const { error: insertError } = await supabase
      .from("template_schemas")
      .insert({
        workspace_id: workspaceId,
        template_structure: templateStructure,
        json_schema: schema,
        generated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error("Error storing schema:", insertError)
      // Continue anyway
    }

    return NextResponse.json({
      success: true,
      schema,
    })
  } catch (error: any) {
    console.error("Schema generator error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate schema" },
      { status: 500 }
    )
  }
}

async function generateJSONSchema(templateStructure: GenerateSchemaRequest["templateStructure"]) {
  const propertiesDescription = templateStructure.properties
    .map((prop) => {
      let desc = `- ${prop.name} (${prop.type})`
      if (prop.options) {
        desc += ` - Options: ${prop.options.join(", ")}`
      }
      if (prop.required) {
        desc += " [REQUIRED]"
      }
      return desc
    })
    .join("\n")

  const prompt = `You are a JSON Schema generator. Given a template structure, generate a valid JSON Schema (draft-07) that represents the data structure.

Template Title: ${templateStructure.title}
${templateStructure.description ? `Description: ${templateStructure.description}\n` : ""}
Properties:
${propertiesDescription}

Generate a JSON Schema that:
1. Defines all properties with appropriate types
2. Maps Notion types to JSON Schema types (text -> string, number -> number, date -> string with format: date-time, select -> string with enum, etc.)
3. Includes required fields
4. Adds descriptions for each property
5. Handles nested structures if applicable

Return ONLY valid JSON Schema, no markdown, no explanations.`

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.3,
    })

    // Parse and validate JSON Schema
    let schema
    try {
      schema = JSON.parse(text.trim())
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        schema = JSON.parse(jsonMatch[1])
      } else {
        throw new Error("Could not parse JSON Schema from LLM response")
      }
    }

    // Ensure it's a valid JSON Schema
    if (!schema.type || !schema.properties) {
      throw new Error("Invalid JSON Schema structure")
    }

    return schema
  } catch (error: any) {
    // Fallback: Generate basic schema programmatically
    console.warn("LLM schema generation failed, using fallback:", error.message)
    return generateFallbackSchema(templateStructure)
  }
}

function generateFallbackSchema(templateStructure: GenerateSchemaRequest["templateStructure"]) {
  const properties: Record<string, any> = {}
  const required: string[] = []

  for (const prop of templateStructure.properties) {
    let schemaProp: any = {}

    switch (prop.type) {
      case "title":
      case "rich_text":
      case "text":
        schemaProp = { type: "string" }
        break
      case "number":
        schemaProp = { type: "number" }
        break
      case "date":
        schemaProp = { type: "string", format: "date-time" }
        break
      case "checkbox":
        schemaProp = { type: "boolean" }
        break
      case "select":
      case "status":
        schemaProp = {
          type: "string",
          enum: prop.options || [],
        }
        break
      case "multi_select":
        schemaProp = {
          type: "array",
          items: {
            type: "string",
            enum: prop.options || [],
          },
        }
        break
      case "people":
        schemaProp = {
          type: "array",
          items: { type: "string" },
        }
        break
      default:
        schemaProp = { type: "string" }
    }

    schemaProp.description = `${prop.name} (${prop.type})`
    properties[prop.name] = schemaProp

    if (prop.required) {
      required.push(prop.name)
    }
  }

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    title: templateStructure.title,
    description: templateStructure.description,
    properties,
    required: required.length > 0 ? required : undefined,
  }
}
