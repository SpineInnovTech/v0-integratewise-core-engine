import { z } from "zod";

// ============================================================================
// Playbook Runtime Validation Schemas (Zod)
// ============================================================================

export const PlaybookStepSchema = z.object({
  step_index: z.number().int().nonnegative(),
  tool: z.string().min(1, "Tool name is required"),
  action: z.string().min(1, "Action name is required"),
  arguments: z.record(z.any()),
  fallback: z.record(z.any()).optional(),
});

export const PlaybookGovernanceSchema = z.object({
  requires_human_signoff: z.boolean(),
  policy_rule_id: z.string().optional(),
});

export const PlaybookSchema = z.object({
  id: z.string().uuid("Playbook ID must be a valid UUID"),
  title: z.string().min(1, "Playbook title is required"),
  steps: z.array(PlaybookStepSchema),
  governance: PlaybookGovernanceSchema,
  generated_by: z.string().optional(),
  source_signal_id: z.string().optional(),
  writeback_url: z.string().url("Writeback URL must be valid").optional(),
});

// ============================================================================
// Playbook Static Type Contracts
// ============================================================================

export type PlaybookStep = z.infer<typeof PlaybookStepSchema>;
export type PlaybookGovernance = z.infer<typeof PlaybookGovernanceSchema>;
export type Playbook = z.infer<typeof PlaybookSchema>;

// ============================================================================
// Canonical JSON Schema 7 Draft Specification (For LLM Output Constraints)
// ============================================================================

export const PLAYBOOK_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Playbook",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    title: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          step_index: { type: "integer", minimum: 0 },
          tool: { type: "string" },
          action: { type: "string" },
          arguments: { type: "object" },
          fallback: { type: "object" },
        },
        required: ["step_index", "tool", "action", "arguments"],
      },
    },
    governance: {
      type: "object",
      properties: {
        requires_human_signoff: { type: "boolean" },
        policy_rule_id: { type: "string" },
      },
      required: ["requires_human_signoff"],
    },
    generated_by: { type: "string" },
    source_signal_id: { type: "string" },
    writeback_url: { type: "string", format: "uri" },
  },
  required: ["id", "title", "steps", "governance"],
} as const;
