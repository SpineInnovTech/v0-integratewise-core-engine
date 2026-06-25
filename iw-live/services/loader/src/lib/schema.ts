import { z } from "zod";

export const MemorySchema = z.object({
  memory_type: z.string(),
  related_entity_type: z.string().nullable().optional(),
  related_entity_id: z.string().nullable().optional(),
  text: z.string().max(4000),
  confidence_score: z.number().min(0).max(1).nullable().optional(),
  source_turn_ids: z.array(z.string()).optional(),
});

export const SaveSessionMemorySchema = z.object({
  tenant_id: z.string(),
  session_id: z.string(),
  tool_source: z.string(),
  user_label: z.string().optional(),
  summary: z.string(),
  memories: z.array(MemorySchema).max(50),
});

export type Memory = z.infer<typeof MemorySchema>;
export type SaveSessionMemoryRequest = z.infer<typeof SaveSessionMemorySchema>;
