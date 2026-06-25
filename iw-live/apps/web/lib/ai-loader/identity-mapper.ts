/**
 * Identity Mapping Service
 * Maps extracted entities to canonical Spine records
 * Handles deduplication and fuzzy matching
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { createHash } from "crypto"

export interface ExtractedEntity {
  type: "account" | "contact" | "deal" | "task" | "event" | "note"
  data: Record<string, any>
  sourceRef: string
}

export interface IdentityMatch {
  action: "created_new" | "matched_exact" | "matched_fuzzy" | "merged" | "skipped" | "pending_review"
  targetSpineId?: string
  confidence: number
  matchDetails: {
    matchedFields: Array<{
      field: string
      sourceValue: any
      targetValue: any
      matchType: "exact" | "fuzzy"
      similarity?: number
    }>
    algorithm: string
  }
}

/**
 * Generate signature from identifying fields
 */
export function generateSignature(entity: ExtractedEntity): string {
  const identifyingFields = getIdentifyingFields(entity.type)
  const values = identifyingFields
    .map((field) => {
      const value = entity.data[field]
      return value ? String(value).toLowerCase().trim() : ""
    })
    .filter(Boolean)
    .join("|")

  return createHash("sha256").update(values).digest("hex")
}

/**
 * Get identifying fields for each entity type
 */
function getIdentifyingFields(entityType: ExtractedEntity["type"]): string[] {
  switch (entityType) {
    case "contact":
      return ["email", "name", "phone"]
    case "account":
      return ["account_name", "domain", "company_name"]
    case "deal":
      return ["title", "account_id", "amount"]
    case "task":
      return ["title", "due_date", "assignee"]
    default:
      return ["name", "title"]
  }
}

/**
 * Find exact match by signature
 */
export async function findExactMatch(
  supabase: SupabaseClient,
  workspaceId: string,
  signature: string
): Promise<string | null> {
  const { data } = await supabase
    .from("identity_maps")
    .select("target_spine_id")
    .eq("workspace_id", workspaceId)
    .eq("source_signature", signature)
    .eq("mapping_action", "created_new")
    .limit(1)
    .single()

  return data?.target_spine_id || null
}

/**
 * Find fuzzy matches
 */
export async function findFuzzyMatches(
  supabase: SupabaseClient,
  workspaceId: string,
  entity: ExtractedEntity,
  threshold: number = 0.75
): Promise<Array<{ spineId: string; confidence: number; details: any }>> {
  const identifyingFields = getIdentifyingFields(entity.type)
  const matches: Array<{ spineId: string; confidence: number; details: any }> = []

  // For contacts: match by email domain or name similarity
  if (entity.type === "contact") {
    const email = entity.data.email
    const name = entity.data.name

    if (email) {
      // Try to find by email domain
      const domain = email.split("@")[1]
      if (domain) {
        // Query existing contacts with same domain
        // This is a simplified version - in production, you'd query the actual Spine tables
        const { data: existing } = await supabase
          .from("identity_maps")
          .select("target_spine_id, source_entity_data")
          .eq("workspace_id", workspaceId)
          .eq("source_entity_type", "contact")
          .limit(100)

        if (existing) {
          for (const record of existing) {
            const existingEmail = record.source_entity_data?.email
            if (existingEmail && existingEmail.split("@")[1] === domain) {
              const nameSimilarity = name
                ? calculateNameSimilarity(name, record.source_entity_data?.name || "")
                : 0.5

              const confidence = nameSimilarity * 0.7 + 0.3 // Email domain match = 30% base

              if (confidence >= threshold) {
                matches.push({
                  spineId: record.target_spine_id,
                  confidence,
                  details: {
                    matchedFields: [
                      {
                        field: "email_domain",
                        sourceValue: domain,
                        targetValue: existingEmail.split("@")[1],
                        matchType: "exact",
                      },
                      {
                        field: "name",
                        sourceValue: name,
                        targetValue: record.source_entity_data?.name,
                        matchType: "fuzzy",
                        similarity: nameSimilarity,
                      },
                    ],
                  },
                })
              }
            }
          }
        }
      }
    }

    // Also try name-only matching
    if (name) {
      const { data: existing } = await supabase
        .from("identity_maps")
        .select("target_spine_id, source_entity_data")
        .eq("workspace_id", workspaceId)
        .eq("source_entity_type", "contact")
        .limit(100)

      if (existing) {
        for (const record of existing) {
          const existingName = record.source_entity_data?.name
          if (existingName) {
            const similarity = calculateNameSimilarity(name, existingName)
            if (similarity >= threshold) {
              // Check if not already added
              if (!matches.find((m) => m.spineId === record.target_spine_id)) {
                matches.push({
                  spineId: record.target_spine_id,
                  confidence: similarity * 0.8, // Lower confidence for name-only
                  details: {
                    matchedFields: [
                      {
                        field: "name",
                        sourceValue: name,
                        targetValue: existingName,
                        matchType: "fuzzy",
                        similarity,
                      },
                    ],
                  },
                })
              }
            }
          }
        }
      }
    }
  }

  // For accounts: match by name similarity
  if (entity.type === "account") {
    const accountName = entity.data.account_name || entity.data.company_name || entity.data.name

    if (accountName) {
      const { data: existing } = await supabase
        .from("identity_maps")
        .select("target_spine_id, source_entity_data")
        .eq("workspace_id", workspaceId)
        .eq("source_entity_type", "account")
        .limit(100)

      if (existing) {
        for (const record of existing) {
          const existingName =
            record.source_entity_data?.account_name ||
            record.source_entity_data?.company_name ||
            record.source_entity_data?.name

          if (existingName) {
            const similarity = calculateNameSimilarity(accountName, existingName)
            if (similarity >= threshold) {
              matches.push({
                spineId: record.target_spine_id,
                confidence: similarity,
                details: {
                  matchedFields: [
                    {
                      field: "account_name",
                      sourceValue: accountName,
                      targetValue: existingName,
                      matchType: "fuzzy",
                      similarity,
                    },
                  ],
                },
              })
            }
          }
        }
      }
    }
  }

  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Calculate name similarity using Levenshtein distance
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const s1 = name1.toLowerCase().trim()
  const s2 = name2.toLowerCase().trim()

  if (s1 === s2) return 1.0

  // Check for substring matches
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.85
  }

  // Levenshtein distance
  const distance = levenshteinDistance(s1, s2)
  const maxLength = Math.max(s1.length, s2.length)
  const similarity = 1 - distance / maxLength

  return Math.max(0, similarity)
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Map entity to Spine record
 */
export async function mapEntity(
  supabase: SupabaseClient,
  workspaceId: string,
  extractionJobId: string,
  entity: ExtractedEntity,
  autoMergeThreshold: number = 0.95
): Promise<IdentityMatch> {
  const signature = generateSignature(entity)

  // Check for exact match
  const exactMatch = await findExactMatch(supabase, workspaceId, signature)
  if (exactMatch) {
    return {
      action: "matched_exact",
      targetSpineId: exactMatch,
      confidence: 1.0,
      matchDetails: {
        matchedFields: [
          {
            field: "signature",
            sourceValue: signature,
            targetValue: signature,
            matchType: "exact",
          },
        ],
        algorithm: "signature_match",
      },
    }
  }

  // Try fuzzy matching
  const fuzzyMatches = await findFuzzyMatches(supabase, workspaceId, entity, 0.75)
  if (fuzzyMatches.length > 0) {
    const bestMatch = fuzzyMatches[0]

    if (bestMatch.confidence >= autoMergeThreshold) {
      return {
        action: "matched_fuzzy",
        targetSpineId: bestMatch.spineId,
        confidence: bestMatch.confidence,
        matchDetails: bestMatch.details,
      }
    } else {
      // Needs review
      return {
        action: "pending_review",
        targetSpineId: bestMatch.spineId,
        confidence: bestMatch.confidence,
        matchDetails: bestMatch.details,
      }
    }
  }

  // No match found - create new
  return {
    action: "created_new",
    confidence: 1.0,
    matchDetails: {
      matchedFields: [],
      algorithm: "no_match",
    },
  }
}

/**
 * Create identity map record
 */
export async function createIdentityMap(
  supabase: SupabaseClient,
  workspaceId: string,
  extractionJobId: string,
  entity: ExtractedEntity,
  match: IdentityMatch,
  targetSpineId?: string
): Promise<string> {
  const signature = generateSignature(entity)

  // Generate Spine ID if creating new
  const spineId = targetSpineId || `SPN-${crypto.randomUUID()}`

  const { data, error } = await supabase
    .from("identity_maps")
    .insert({
      extraction_job_id: extractionJobId,
      workspace_id: workspaceId,
      source_entity_type: entity.type,
      source_entity_data: entity.data,
      source_signature: signature,
      target_spine_type: entity.type.charAt(0).toUpperCase() + entity.type.slice(1),
      target_spine_id: spineId,
      mapping_action: match.action,
      confidence: match.confidence,
      match_details: match.matchDetails,
      requires_review: match.action === "pending_review",
    })
    .select("identity_map_id")
    .single()

  if (error) {
    throw new Error(`Failed to create identity map: ${error.message}`)
  }

  return data.identity_map_id
}
