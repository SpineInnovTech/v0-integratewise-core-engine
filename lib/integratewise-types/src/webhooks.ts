import { z } from "zod";

// Stripe webhook event
export const StripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
  created: z.number(),
});

export type StripeWebhook = z.infer<typeof StripeWebhookSchema>;

// Slack webhook event
export const SlackWebhookSchema = z.object({
  type: z.string(),
  token: z.string().optional(),
  team_id: z.string().optional(),
  event: z.record(z.unknown()).optional(),
  challenge: z.string().optional(),
});

export type SlackWebhook = z.infer<typeof SlackWebhookSchema>;

// Discord interaction
export const DiscordInteractionSchema = z.object({
  id: z.string(),
  type: z.number(),
  application_id: z.string(),
  token: z.string(),
  data: z.record(z.unknown()).optional(),
});

export type DiscordInteraction = z.infer<typeof DiscordInteractionSchema>;

// Notion webhook
export const NotionWebhookSchema = z.object({
  type: z.string(),
  workspace_id: z.string(),
  data: z.record(z.unknown()),
});

export type NotionWebhook = z.infer<typeof NotionWebhookSchema>;

// Asana webhook
export const AsanaWebhookSchema = z.object({
  events: z
    .array(
      z.object({
        action: z.string().optional(),
        created_at: z.string().optional(),
        parent: z
          .object({
            id: z.string().optional(),
            type: z.string().optional(),
          })
          .optional(),
        resource: z
          .object({
            id: z.string().optional(),
            type: z.string().optional(),
            name: z.string().optional(),
          })
          .optional(),
        type: z.string().optional(),
        user: z
          .object({
            id: z.string().optional(),
            name: z.string().optional(),
          })
          .optional(),
      })
    )
    .optional(),
});

export type AsanaWebhook = z.infer<typeof AsanaWebhookSchema>;

// GitHub webhook
export const GitHubWebhookSchema = z.object({
  action: z.string().optional(),
  number: z.number().optional(),
  pull_request: z.record(z.unknown()).optional(),
  issue: z.record(z.unknown()).optional(),
  commit: z.string().optional(),
  commits: z.array(z.record(z.unknown())).optional(),
  push: z.boolean().optional(),
  ref: z.string().optional(),
  repository: z
    .object({
      id: z.number().optional(),
      name: z.string().optional(),
      full_name: z.string().optional(),
      owner: z
        .object({
          login: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  sender: z
    .object({
      login: z.string().optional(),
      id: z.number().optional(),
    })
    .optional(),
  installation: z
    .object({
      id: z.number().optional(),
    })
    .optional(),
});

export type GitHubWebhook = z.infer<typeof GitHubWebhookSchema>;
