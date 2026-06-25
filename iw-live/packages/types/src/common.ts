import { z } from "zod";

/**
 * Structured error envelope for all services (HARDENING §37, SPINE_AS_FOUNDATION guardrails).
 * Use this shape so clients and logs get consistent correlation_id, error_code, message, details.
 */
export interface StructuredErrorEnvelope {
  correlation_id: string;
  error_code: string;
  message: string;
  details?: unknown;
}

export const StructuredErrorEnvelopeSchema = z.object({
  correlation_id: z.string(),
  error_code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

/** Build a StructuredErrorEnvelope for JSON responses. */
export function createErrorEnvelope(
  correlationId: string,
  errorCode: string,
  message: string,
  details?: unknown
): StructuredErrorEnvelope {
  return { correlation_id: correlationId, error_code: errorCode, message, details };
}

// API Response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .optional(),
  });

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  total: z.number().int().nonnegative().optional(),
  hasMore: z.boolean().optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// User
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// Workspace
export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  owner_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
