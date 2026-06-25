/**
 * Stage 1: Creamy Layer Processing
 * Fast 60-second preview extraction
 * 
 * Goal: Show user meaningful data within 60 seconds
 */

import { generateText } from "ai"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface Stage1Config {
  workspaceId: string
  userId: string
  inputSourceId: string
  sourceType: string
  sourceUri: string
  sourceMetadata: Record<string, any>
}

export interface Stage1Result {
  success: boolean
  creamyExtractId?: string
  extractionTimeMs: number
  entitiesPreview: {
    accounts: Array<{
      name: string
      confidence: number
      industry?: string
      size?: string
      sourceRefs: string[]
    }>
    contacts: Array<{
      name: string
      email?: string
      company?: string
      role?: string
      confidence: number
      sourceRefs: string[]
    }>
    deals: Array<{
      title: string
      amount?: number
      stage?: string
      confidence: number
      sourceRefs: string[]
    }>
  }
  tasksPreview: Array<{
    title: string
    dueDate?: string
    priority: "low" | "medium" | "high" | "urgent"
    assignee?: string
    confidence: number
    sourceRef: string
  }>
  threadsPreview: Array<{
    subject: string
    participants: string[]
    messageCount: number
    sentiment: "positive" | "neutral" | "negative"
    keyTopics: string[]
    urgency: "low" | "medium" | "high"
  }>
  highlights: Array<{
    type: "revenue_opportunity" | "risk_signal" | "action_required" | "pattern"
    title: string
    detail: string
    confidence: number
    sourceRefs: string[]
  }>
  sourceSummary: {
    totalFiles: number
    filesAnalyzed: number
    fileTypes: Record<string, number>
    dateRange?: {
      earliest: string
      latest: string
    }
    detectedContext: string[]
    confidenceScore: number
  }
  provenance: {
    sourceFiles: Array<{
      fileId: string
      originalPath: string
      processed: boolean
      entitiesExtracted: number
    }>
    totalSources: number
    processedSources: number
    skippedSources: number
    skipReasons: Record<string, number>
  }
  error?: string
}

const STAGE1_TIME_LIMIT_MS = 60000 // 60 seconds
const MAX_TEXT_PER_FILE = 100000 // 100KB text per file

/**
 * Main Stage 1 processing function
 */
export async function processStage1Creamy(
  supabase: SupabaseClient,
  config: Stage1Config
): Promise<Stage1Result> {
  const startTime = Date.now()
  
  try {
    // Update status
    await supabase
      .from("input_sources")
      .update({
        status: "stage1_running",
        stage1_started_at: new Date().toISOString(),
      })
      .eq("input_source_id", config.inputSourceId)

    // Step 1: Validation (5 seconds)
    const validation = await validateSource(config)
    if (!validation.valid) {
      throw new Error(validation.error || "Validation failed")
    }

    // Step 2: Inventory Scan (10 seconds)
    const inventory = await scanInventory(config)
    
    // Step 3: Content Extraction (25 seconds)
    const extractedContent = await extractContent(config, inventory)
    
    // Step 4: LLM Analysis (15 seconds)
    const llmResult = await analyzeWithLLM(extractedContent)
    
    // Step 5: Preview Assembly (5 seconds)
    const preview = assemblePreview(llmResult, inventory)
    
    const extractionTimeMs = Date.now() - startTime
    
    // Create CreamyExtract record
    const { data: creamyExtract, error: insertError } = await supabase
      .from("creamy_extracts")
      .insert({
        input_source_id: config.inputSourceId,
        workspace_id: config.workspaceId,
        extracted_at: new Date().toISOString(),
        extraction_time_ms: extractionTimeMs,
        extraction_version: "v1.0.0",
        llm_provider: "openai",
        llm_model: "gpt-4o-mini",
        llm_tokens_used: llmResult.tokensUsed,
        llm_cost_usd: calculateLLMCost(llmResult.tokensUsed),
        source_summary: preview.sourceSummary,
        entities_preview: preview.entitiesPreview,
        tasks_preview: preview.tasksPreview,
        threads_preview: preview.threadsPreview,
        highlights: preview.highlights,
        provenance: preview.provenance,
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create creamy extract: ${insertError.message}`)
    }

    // Update input source status
    await supabase
      .from("input_sources")
      .update({
        status: "stage1_complete",
        stage1_completed_at: new Date().toISOString(),
        stats: {
          extraction_time_ms: extractionTimeMs,
          files_analyzed: inventory.filesToProcess.length,
        },
      })
      .eq("input_source_id", config.inputSourceId)

    return {
      success: true,
      creamyExtractId: creamyExtract.creamy_extract_id,
      extractionTimeMs,
      ...preview,
    }
  } catch (error: any) {
    // Update status to failed
    await supabase
      .from("input_sources")
      .update({
        status: "stage1_failed",
        error_code: "STAGE1_ERROR",
        error_message: error.message,
      })
      .eq("input_source_id", config.inputSourceId)

    return {
      success: false,
      extractionTimeMs: Date.now() - startTime,
      entitiesPreview: { accounts: [], contacts: [], deals: [] },
      tasksPreview: [],
      threadsPreview: [],
      highlights: [],
      sourceSummary: {
        totalFiles: 0,
        filesAnalyzed: 0,
        fileTypes: {},
        detectedContext: [],
        confidenceScore: 0,
      },
      provenance: {
        sourceFiles: [],
        totalSources: 0,
        processedSources: 0,
        skippedSources: 0,
        skipReasons: {},
      },
      error: error.message,
    }
  }
}

/**
 * Step 1: Validate source
 */
async function validateSource(config: Stage1Config): Promise<{ valid: boolean; error?: string }> {
  // Check file size limits
  const maxSize = 2000 * 1024 * 1024 // 2GB total
  const fileSize = config.sourceMetadata.size_bytes || 0
  
  if (fileSize > maxSize) {
    return { valid: false, error: `File size exceeds limit: ${maxSize / 1024 / 1024}MB` }
  }

  // Check file type is supported
  const supportedTypes = [
    "file_upload",
    "folder_upload",
    "email_export",
    "clipboard_paste",
  ]
  
  if (!supportedTypes.includes(config.sourceType)) {
    return { valid: false, error: `Unsupported source type: ${config.sourceType}` }
  }

  return { valid: true }
}

/**
 * Step 2: Scan inventory
 */
async function scanInventory(config: Stage1Config): Promise<{
  filesToProcess: Array<{ path: string; type: string; size: number }>
  filesToSkip: Array<{ path: string; reason: string }>
  totalFiles: number
}> {
  // TODO: Implement actual file scanning based on source type
  // For now, return mock data structure
  
  return {
    filesToProcess: [],
    filesToSkip: [],
    totalFiles: 0,
  }
}

/**
 * Step 3: Extract content
 */
async function extractContent(
  config: Stage1Config,
  inventory: Awaited<ReturnType<typeof scanInventory>>
): Promise<{
  files: Array<{
    fileId: string
    path: string
    content: string
    type: string
  }>
}> {
  // TODO: Implement actual content extraction
  // - PDF text extraction
  // - DOCX parsing
  // - CSV parsing
  // - Email parsing
  // - Sampling per file type rules
  
  return {
    files: [],
  }
}

/**
 * Step 4: LLM Analysis
 */
async function analyzeWithLLM(extractedContent: Awaited<ReturnType<typeof extractContent>>): Promise<{
  entities: any
  tasks: any[]
  threads: any[]
  highlights: any[]
  summary: any
  tokensUsed: number
}> {
  // Combine all extracted content
  const combinedText = extractedContent.files
    .map((f) => f.content)
    .join("\n\n")
    .slice(0, 100000) // Limit to 100KB for LLM

  const prompt = `Analyze the following business data and extract:

1. ENTITIES (accounts, contacts, deals)
   - Company names and details
   - People and their roles
   - Business opportunities

2. TASKS
   - Action items mentioned
   - Deadlines and due dates
   - Assignments

3. KEY THREADS
   - Important conversation topics
   - Urgent matters
   - Sentiment analysis

4. HIGHLIGHTS
   - Revenue opportunities
   - Risk signals
   - Notable patterns

SOURCE DATA:
\`\`\`
${combinedText}
\`\`\`

Respond with valid JSON matching this schema:
{
  "entities": {
    "accounts": [{"name": "string", "confidence": 0.0-1.0, "industry": "string|null", "size": "string|null", "source_refs": ["string"]}],
    "contacts": [{"name": "string", "email": "string|null", "company": "string|null", "role": "string|null", "confidence": 0.0-1.0, "source_refs": ["string"]}],
    "deals": [{"title": "string", "amount": "number|null", "stage": "string|null", "confidence": 0.0-1.0, "source_refs": ["string"]}]
  },
  "tasks": [{"title": "string", "due_date": "YYYY-MM-DD|null", "priority": "low|medium|high|urgent", "assignee": "string|null", "confidence": 0.0-1.0, "source_ref": "string"}],
  "threads": [{"subject": "string", "participants": ["string"], "message_count": "number", "sentiment": "positive|neutral|negative", "key_topics": ["string"], "urgency": "low|medium|high"}],
  "highlights": [{"type": "revenue_opportunity|risk_signal|action_required|pattern", "title": "string", "detail": "string", "confidence": 0.0-1.0, "source_refs": ["string"]}],
  "summary": {"detected_context": ["string"], "total_revenue_detected": "number|null", "date_range": {"earliest": "YYYY-MM-DD", "latest": "YYYY-MM-DD"}}
}`

  try {
    const { text, usage } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.3,
      maxTokens: 4000,
    })

    // Parse JSON response
    let parsed
    try {
      parsed = JSON.parse(text.trim())
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1])
      } else {
        throw new Error("Could not parse LLM response as JSON")
      }
    }

    return {
      entities: parsed.entities || { accounts: [], contacts: [], deals: [] },
      tasks: parsed.tasks || [],
      threads: parsed.threads || [],
      highlights: parsed.highlights || [],
      summary: parsed.summary || {},
      tokensUsed: usage?.totalTokens || 0,
    }
  } catch (error: any) {
    // Return empty structure on error
    return {
      entities: { accounts: [], contacts: [], deals: [] },
      tasks: [],
      threads: [],
      highlights: [],
      summary: {},
      tokensUsed: 0,
    }
  }
}

/**
 * Step 5: Assemble preview
 */
function assemblePreview(
  llmResult: Awaited<ReturnType<typeof analyzeWithLLM>>,
  inventory: Awaited<ReturnType<typeof scanInventory>>
): Omit<Stage1Result, "success" | "creamyExtractId" | "extractionTimeMs" | "error"> {
  // Take top N items per category
  const topAccounts = llmResult.entities.accounts
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10)
  
  const topContacts = llmResult.entities.contacts
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10)
  
  const topDeals = llmResult.entities.deals
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
  
  const topTasks = llmResult.tasks
    .sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
    .slice(0, 5)
  
  const hotThreads = llmResult.threads
    .filter((t) => t.urgency === "high")
    .slice(0, 5)

  return {
    entitiesPreview: {
      accounts: topAccounts,
      contacts: topContacts,
      deals: topDeals,
    },
    tasksPreview: topTasks,
    threadsPreview: hotThreads,
    highlights: llmResult.highlights,
    sourceSummary: {
      totalFiles: inventory.totalFiles,
      filesAnalyzed: inventory.filesToProcess.length,
      fileTypes: {},
      dateRange: llmResult.summary.date_range,
      detectedContext: llmResult.summary.detected_context || [],
      confidenceScore: 0.85, // TODO: Calculate from entity confidences
    },
    provenance: {
      sourceFiles: [],
      totalSources: inventory.totalFiles,
      processedSources: inventory.filesToProcess.length,
      skippedSources: inventory.filesToSkip.length,
      skipReasons: {},
    },
  }
}

/**
 * Calculate LLM cost (approximate)
 */
function calculateLLMCost(tokens: number): number {
  // GPT-4o-mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens
  // Rough estimate: assume 70% input, 30% output
  const inputTokens = tokens * 0.7
  const outputTokens = tokens * 0.3
  const cost = (inputTokens / 1_000_000) * 0.15 + (outputTokens / 1_000_000) * 0.6
  return cost
}
