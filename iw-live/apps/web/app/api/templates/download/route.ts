import { type NextRequest, NextResponse } from "next/server"

// Template JSON definitions (in production, these would be stored in DB or S3)
const templateData: Record<string, object> = {
  "weekly-report": {
    name: "Automated Weekly Reports",
    nodes: [
      { type: "schedule", cron: "0 9 * * 1" },
      { type: "googleSheets", action: "read" },
      { type: "aggregate", operation: "summarize" },
      { type: "slack", action: "postMessage" },
    ],
  },
  "notion-crm": {
    name: "Notion CRM Sync",
    nodes: [
      { type: "webhook", path: "/notion-sync" },
      { type: "hubspot", action: "getContacts" },
      { type: "notion", action: "createPage" },
    ],
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const templateId = searchParams.get("id")

  if (!templateId || !templateData[templateId]) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }

  const template = templateData[templateId]

  // Return as downloadable JSON
  return new NextResponse(JSON.stringify(template, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${templateId}.json"`,
    },
  })
}
