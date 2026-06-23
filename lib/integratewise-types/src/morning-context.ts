import { z } from "zod";

// ============================================================================
// Morning Context Runtime Validation Schemas (Zod)
// ============================================================================

export const MorningContextSchema = z.object({
  day_overview: z.object({
    schedule: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        time: z.string().optional(),
      })
    ),
    kpis: z.array(
      z.object({
        name: z.string(),
        value: z.union([z.string(), z.number()]),
        target: z.union([z.string(), z.number()]).optional(),
        trend: z.enum(["up", "down", "stable"]).default("stable"),
      })
    ),
  }),
  priorities: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      priority: z.enum(["low", "medium", "high", "critical"]),
    })
  ),
  commitments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      due_date: z.string().optional(),
    })
  ),
  pending_decisions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      status: z.string(),
      score: z.number().min(0).max(1),
    })
  ),
  unresolved_items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      category: z.string(),
      description: z.string(),
    })
  ),
  memory_recall: z.array(
    z.object({
      category: z.string(),
      content: z.string(),
      source_signal_id: z.string().optional(),
    })
  ),
  active_conversations: z.string(), // Compiled recent conversational history
  strategic_focus: z.string(), // Evolutionary morning preferences / directives
});

// ============================================================================
// Morning Context Static Type Contract
// ============================================================================

export type MorningContext = z.infer<typeof MorningContextSchema>;
