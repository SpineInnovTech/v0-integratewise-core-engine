/**
 * IntegrateWise Normalizer Service - Schema Index (v11.7 Mastering SSOT)
 *
 * Exports all entity schemas for use in validation
 */

import clientSchema from "./client.schema.json";
import dealSchema from "./deal.schema.json";
import ticketSchema from "./ticket.schema.json";
import subscriptionSchema from "./subscription.schema.json";
import eventSchema from "./event.schema.json";

// Mastering SSOT Schemas
import accountMasterSchema from "./account_master.schema.json";
import strategicObjectiveSchema from "./strategic_objective.schema.json";
import insightSchema from "./insight.schema.json";

import type { EntityType, SchemaInfo } from "../types";

// Schema registry mapping
// Note: Some domains share a schema or use basic validation during this phase
export const schemas: Record<string, object> = {
  client: clientSchema,
  account: accountMasterSchema,
  account_contact: accountMasterSchema,
  internal_team_member: accountMasterSchema,
  account_team_assignment: strategicObjectiveSchema,
  deal: dealSchema,
  ticket: ticketSchema,
  subscription: subscriptionSchema,
  event: eventSchema,
  account_master: accountMasterSchema,
  strategic_objective: strategicObjectiveSchema,
  insight: insightSchema,
  // Placeholders for other 11.7 domains
  people_team: accountMasterSchema, // Reuse account master structure for basic validaton
  business_context: accountMasterSchema,
  capability: strategicObjectiveSchema,
  value_stream: strategicObjectiveSchema,
  api_portfolio: strategicObjectiveSchema,
  account_metric: strategicObjectiveSchema,
  initiative: strategicObjectiveSchema,
  risk_register: strategicObjectiveSchema,
  platform_health: strategicObjectiveSchema,
  platform_health_metric: strategicObjectiveSchema,
  metrics_history: strategicObjectiveSchema,
  stakeholder_outcome: strategicObjectiveSchema,
  engagement_log: strategicObjectiveSchema,
  engagement: strategicObjectiveSchema,
  success_plan: strategicObjectiveSchema,
  generated_insight: insightSchema,
  external_integration: strategicObjectiveSchema,
  sync_log: strategicObjectiveSchema,
  technical_asset: strategicObjectiveSchema,
  technical_service: strategicObjectiveSchema,
  environment_health: strategicObjectiveSchema,
  usage_dimension: strategicObjectiveSchema,
  task: strategicObjectiveSchema,
};

// Available types
export const entityTypes = Object.keys(schemas) as EntityType[];

export function getSchemaInfo(entityType: EntityType): SchemaInfo | null {
  const schema = schemas[entityType] as Record<string, any>;
  if (!schema) return null;

  return {
    entity_type: entityType,
    schema_id: schema.$id || "",
    title: schema.title || "",
    description: schema.description || "",
    required_fields: schema.required || [],
    version: "1.7.0",
  };
}

export function getAllSchemaInfos(): SchemaInfo[] {
  return entityTypes.map((type) => getSchemaInfo(type)!).filter(Boolean);
}
