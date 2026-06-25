/**
 * Synthesis Pipeline — Index
 *
 * Exports the four stages of the knowledge synthesis pipeline:
 * 1. Triage Bot — classifies raw conversations
 * 2. Continuity Object Factory — creates Understanding Objects
 * 3. Promotion Gate — HITL or auto-approve
 * 4. Lineage Tracker — records provenance
 *
 * Usage:
 *   import { classifySession, createUnderstandingObject, evaluatePromotion, recordPromotion } from "./synthesis";
 *
 * Pipeline flow:
 *   CouchDB Session → TriageBot.classifySession() → ContinuityObjectFactory.createUnderstandingObject()
 *   → PromotionGate.evaluatePromotion() → [auto_approved | hitl_required]
 *   → LineageTracker.recordPromotion() → Knowledge Persisted Layer
 */

export * from "./triage-bot";
export * from "./continuity-object-factory";
export * from "./promotion-gate";
export * from "./lineage-tracker";
