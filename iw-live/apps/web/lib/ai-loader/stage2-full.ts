/**
 * Stage 2: Full Extraction Processing
 * Deep extraction, identity mapping, governance, and rendering
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { mapEntity, createIdentityMap, type ExtractedEntity } from "./identity-mapper"
import { applyGovernance, type EntityData } from "./governance-engine"

export interface Stage2Config {
  workspaceId: string
  extractionJobId: string
  inputSourceId: string
  creamyExtractId: string
  extractionConfig: {
    scope: {
      accounts?: { enabled: boolean; merge_existing: boolean }
      contacts?: { enabled: boolean; merge_existing: boolean }
      deals?: { enabled: boolean; merge_existing: boolean }
      tasks?: { enabled: boolean; merge_existing: boolean }
    }
    dateRange?: {
      start?: string
      end?: string
    }
    identityMapping?: {
      enabled: boolean
      confidenceThreshold: number
      autoMerge: boolean
    }
    governance?: {
      piiDetection: boolean
      piiAction: "redact" | "flag" | "ignore"
      qualityRules: Record<string, any>
    }
    rendering?: {
      targetTemplate?: string
      byotDestination?: string
      byotConfig?: Record<string, any>
    }
  }
}

export interface Stage2Result {
  success: boolean
  extractionJobId: string
  results: {
    entitiesCreated: {
      accounts: number
      contacts: number
      deals: number
      tasks: number
    }
    entitiesMerged: {
      contacts: number
      accounts: number
    }
    entitiesSkipped: {
      contacts: number
      accounts: number
    }
    governanceActions: {
      piiRedacted: number
      qualityFailed: number
    }
    byotSync?: {
      recordsCreated: number
      recordsUpdated: number
      syncTimeMs: number
    }
    totalTimeMs: number
  }
  errors: Array<{ phase: string; error: string; timestamp: string }>
}

/**
 * Main Stage 2 processing function
 */
export async function processStage2Full(
  supabase: SupabaseClient,
  config: Stage2Config
): Promise<Stage2Result> {
  const startTime = Date.now()
  const errors: Array<{ phase: string; error: string; timestamp: string }> = []

  try {
    // Update job status
    await updateJobStatus(supabase, config.extractionJobId, "initializing", {
      current_phase: "initializing",
      overall_percent: 0,
    })

    // Phase 1: Deep Extraction
    await updateJobStatus(supabase, config.extractionJobId, "extracting", {
      current_phase: "extracting",
      overall_percent: 10,
    })

    const extractedEntities = await performDeepExtraction(supabase, config)
    await updateJobStatus(supabase, config.extractionJobId, "extracting", {
      current_phase: "extracting",
      overall_percent: 30,
      files_processed: extractedEntities.length,
    })

    // Phase 2: Identity Mapping
    await updateJobStatus(supabase, config.extractionJobId, "mapping_identities", {
      current_phase: "mapping_identities",
      overall_percent: 40,
    })

    const mappingResults = await performIdentityMapping(supabase, config, extractedEntities)
    await updateJobStatus(supabase, config.extractionJobId, "mapping_identities", {
      current_phase: "mapping_identities",
      overall_percent: 50,
    })

    // Phase 3: Governance
    await updateJobStatus(supabase, config.extractionJobId, "applying_governance", {
      current_phase: "applying_governance",
      overall_percent: 60,
    })

    const governanceResults = await applyGovernanceRules(supabase, config, mappingResults)
    await updateJobStatus(supabase, config.extractionJobId, "applying_governance", {
      current_phase: "applying_governance",
      overall_percent: 70,
    })

    // Phase 4: Spine Insertion
    await updateJobStatus(supabase, config.extractionJobId, "rendering", {
      current_phase: "rendering",
      overall_percent: 80,
    })

    const spineResults = await insertToSpine(supabase, config, governanceResults)
    await updateJobStatus(supabase, config.extractionJobId, "rendering", {
      current_phase: "rendering",
      overall_percent: 90,
    })

    // Phase 5: BYOT Rendering
    let byotResults
    if (config.extractionConfig.rendering?.byotDestination) {
      await updateJobStatus(supabase, config.extractionJobId, "syncing_byot", {
        current_phase: "syncing_byot",
        overall_percent: 95,
      })

      byotResults = await renderToBYOT(supabase, config, spineResults)
    }

    // Phase 6: Completion
    const totalTimeMs = Date.now() - startTime
    const results = {
      entitiesCreated: spineResults.created,
      entitiesMerged: mappingResults.merged,
      entitiesSkipped: governanceResults.skipped,
      governanceActions: governanceResults.actions,
      byotSync: byotResults,
      totalTimeMs,
    }

    await updateJobStatus(supabase, config.extractionJobId, "completed", {
      current_phase: "completed",
      overall_percent: 100,
    })

    await supabase
      .from("extraction_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        results,
      })
      .eq("extraction_job_id", config.extractionJobId)

    return {
      success: true,
      extractionJobId: config.extractionJobId,
      results,
      errors,
    }
  } catch (error: any) {
    errors.push({
      phase: "processing",
      error: error.message,
      timestamp: new Date().toISOString(),
    })

    await supabase
      .from("extraction_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        errors: errors,
      })
      .eq("extraction_job_id", config.extractionJobId)

    return {
      success: false,
      extractionJobId: config.extractionJobId,
      results: {
        entitiesCreated: { accounts: 0, contacts: 0, deals: 0, tasks: 0 },
        entitiesMerged: { contacts: 0, accounts: 0 },
        entitiesSkipped: { contacts: 0, accounts: 0 },
        governanceActions: { piiRedacted: 0, qualityFailed: 0 },
        totalTimeMs: Date.now() - startTime,
      },
      errors,
    }
  }
}

/**
 * Update extraction job progress
 */
async function updateJobStatus(
  supabase: SupabaseClient,
  jobId: string,
  status: string,
  progress: Record<string, any>
) {
  await supabase
    .from("extraction_jobs")
    .update({
      status,
      progress: {
        current_phase: progress.current_phase,
        phases: {
          ...progress,
        },
        overall_percent: progress.overall_percent,
      },
    })
    .eq("extraction_job_id", jobId)
}

/**
 * Phase 1: Deep Extraction
 * TODO: Implement actual file parsing
 */
async function performDeepExtraction(
  supabase: SupabaseClient,
  config: Stage2Config
): Promise<ExtractedEntity[]> {
  // Get input source
  const { data: inputSource } = await supabase
    .from("input_sources")
    .select("*")
    .eq("input_source_id", config.inputSourceId)
    .single()

  if (!inputSource) {
    throw new Error("Input source not found")
  }

  // TODO: Implement actual deep extraction
  // - Process all files (not just sampled)
  // - PDF text extraction
  // - DOCX parsing
  // - CSV/Excel parsing
  // - Email parsing
  // - OCR for images
  // - Transcription for audio/video

  // For now, return empty array (placeholder)
  return []
}

/**
 * Phase 2: Identity Mapping
 */
async function performIdentityMapping(
  supabase: SupabaseClient,
  config: Stage2Config,
  entities: ExtractedEntity[]
): Promise<{
  mapped: Array<{ entity: ExtractedEntity; match: any; spineId: string }>
  merged: { contacts: number; accounts: number }
}> {
  const mapped: Array<{ entity: ExtractedEntity; match: any; spineId: string }> = []
  const merged = { contacts: 0, accounts: 0 }

  const identityConfig = config.extractionConfig.identityMapping || {
    enabled: true,
    confidenceThreshold: 0.75,
    autoMerge: false,
  }

  if (!identityConfig.enabled) {
    // Skip mapping, create new for all
    for (const entity of entities) {
      const spineId = `SPN-${crypto.randomUUID()}`
      mapped.push({ entity, match: { action: "created_new" }, spineId })
    }
    return { mapped, merged }
  }

  for (const entity of entities) {
    try {
      const match = await mapEntity(supabase, config.workspaceId, config.extractionJobId, entity, identityConfig.confidenceThreshold)
      const spineId = match.targetSpineId || `SPN-${crypto.randomUUID()}`

      await createIdentityMap(supabase, config.workspaceId, config.extractionJobId, entity, match, spineId)

      mapped.push({ entity, match, spineId })

      if (match.action === "merged" || match.action === "matched_exact" || match.action === "matched_fuzzy") {
        if (entity.type === "contact") merged.contacts++
        if (entity.type === "account") merged.accounts++
      }
    } catch (error: any) {
      console.error(`Identity mapping failed for ${entity.type}:`, error)
    }
  }

  return { mapped, merged }
}

/**
 * Phase 3: Apply Governance Rules
 */
async function applyGovernanceRules(
  supabase: SupabaseClient,
  config: Stage2Config,
  mappedEntities: Awaited<ReturnType<typeof performIdentityMapping>>
): Promise<{
  processed: Array<{ entity: ExtractedEntity; governance: any; data: Record<string, any> }>
  skipped: { contacts: number; accounts: number }
  actions: { piiRedacted: number; qualityFailed: number }
}> {
  const processed: Array<{ entity: ExtractedEntity; governance: any; data: Record<string, any> }> = []
  const skipped = { contacts: 0, accounts: 0 }
  const actions = { piiRedacted: 0, qualityFailed: 0 }

  for (const { entity, spineId } of mappedEntities.mapped) {
    try {
      const governance = await applyGovernance(supabase, config.workspaceId, {
        type: entity.type,
        data: entity.data,
      })

      if (governance.action === "reject") {
        if (entity.type === "contact") skipped.contacts++
        if (entity.type === "account") skipped.accounts++
        continue
      }

      if (governance.redactedFields.length > 0) {
        actions.piiRedacted += governance.redactedFields.length
      }

      if (governance.flags.some((f) => f.severity === "high")) {
        actions.qualityFailed++
      }

      processed.push({
        entity,
        governance,
        data: governance.transformedData || entity.data,
      })
    } catch (error: any) {
      console.error(`Governance failed for ${entity.type}:`, error)
    }
  }

  return { processed, skipped, actions }
}

/**
 * Phase 4: Insert to Spine
 */
async function insertToSpine(
  supabase: SupabaseClient,
  config: Stage2Config,
  processedEntities: Awaited<ReturnType<typeof applyGovernanceRules>>
): Promise<{
  created: { accounts: number; contacts: number; deals: number; tasks: number }
}> {
  const created = { accounts: 0, contacts: 0, deals: 0, tasks: 0 }

  // TODO: Insert into actual Spine tables
  // For now, we're just tracking counts
  // In production, you'd insert into:
  // - spine_tasks
  // - spine_notes
  // - spine_events
  // etc.

  for (const { entity, data } of processedEntities.processed) {
    // Insert based on entity type
    switch (entity.type) {
      case "account":
        created.accounts++
        break
      case "contact":
        created.contacts++
        break
      case "deal":
        created.deals++
        break
      case "task":
        created.tasks++
        break
    }
  }

  return { created }
}

/**
 * Phase 5: Render to BYOT
 */
async function renderToBYOT(
  supabase: SupabaseClient,
  config: Stage2Config,
  spineResults: Awaited<ReturnType<typeof insertToSpine>>
): Promise<{ recordsCreated: number; recordsUpdated: number; syncTimeMs: number }> {
  const startTime = Date.now()

  // TODO: Implement BYOT rendering
  // - Load BYOT template
  // - Map canonical data to template schema
  // - Render to destination (Notion, Coda, etc.)

  return {
    recordsCreated: 0,
    recordsUpdated: 0,
    syncTimeMs: Date.now() - startTime,
  }
}
