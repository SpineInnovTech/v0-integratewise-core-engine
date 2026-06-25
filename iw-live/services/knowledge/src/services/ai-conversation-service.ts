/**
 * AI Conversations Service
 *
 * Handles CRUD operations for AI conversations, messages, memories, and summaries.
 * Includes 30-day retention policy enforcement.
 */

import { z } from "zod";

// ============================================================================
// SCHEMAS
// ============================================================================

export const CreateConversationSchema = z.object({
  tenant_id: z.string().uuid(),
  user_id: z.string(),
  title: z.string().optional(),
  provider: z.enum(["chatgpt", "claude", "system", "mcp", "grok", "gemini"]).default("system"),
  context_type: z.enum(["account", "signal", "document", "general"]).optional(),
  context_id: z.string().optional(),
});

export const AddMessageSchema = z.object({
  conversation_id: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  tool_calls: z.array(z.any()).optional(),
  tool_results: z.array(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  tokens_used: z.number().optional(),
});

export const CreateMemorySchema = z.object({
  tenant_id: z.string().uuid(),
  conversation_id: z.string().optional(),
  memory_type: z.enum(["decision", "preference", "insight", "action", "rule", "fact"]),
  content: z.string(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.8),
  source: z.enum(["ai_extracted", "user_confirmed", "system"]).default("ai_extracted"),
  expires_at: z.string().optional(), // ISO date string or null for permanent
});

export type CreateConversationRequest = z.infer<typeof CreateConversationSchema>;
export type AddMessageRequest = z.infer<typeof AddMessageSchema>;
export type CreateMemoryRequest = z.infer<typeof CreateMemorySchema>;

// ============================================================================
// CONVERSATION SERVICE
// ============================================================================

export class AIConversationService {
  constructor(private db: D1Database) {}

  // Generate unique ID
  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculate expiry date (30 days from now)
  private getExpiryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  }

  // Create a new conversation
  async createConversation(
    data: CreateConversationRequest
  ): Promise<{ id: string; expires_at: string }> {
    const id = this.generateId();
    const started_at = new Date().toISOString();
    const expires_at = this.getExpiryDate();

    await this.db
      .prepare(
        `
      INSERT INTO ai_conversations (id, tenant_id, user_id, title, provider, context_type, context_id, started_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        id,
        data.tenant_id,
        data.user_id,
        data.title || "New Conversation",
        data.provider,
        data.context_type || null,
        data.context_id || null,
        started_at,
        expires_at
      )
      .run();

    return { id, expires_at };
  }

  // Get conversation by ID
  async getConversation(id: string, tenantId: string): Promise<any> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM ai_conversations WHERE id = ? AND tenant_id = ? AND status != 'deleted'
    `
      )
      .bind(id, tenantId)
      .first();

    if (result) {
      result.topics = result.topics ? JSON.parse(result.topics as string) : [];
    }

    return result;
  }

  // List conversations for user
  async listConversations(
    tenantId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      contextType?: string;
      contextId?: string;
    }
  ): Promise<any[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let query = `
      SELECT * FROM ai_conversations 
      WHERE tenant_id = ? AND user_id = ? AND status != 'deleted'
    `;
    const params: any[] = [tenantId, userId];

    if (options?.status) {
      query += ` AND status = ?`;
      params.push(options.status);
    }

    if (options?.contextType) {
      query += ` AND context_type = ?`;
      params.push(options.contextType);
    }

    if (options?.contextId) {
      query += ` AND context_id = ?`;
      params.push(options.contextId);
    }

    query += ` ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all();

    return (result.results || []).map((r: any) => ({
      ...r,
      topics: r.topics ? JSON.parse(r.topics) : [],
    }));
  }

  // Add message to conversation
  async addMessage(data: AddMessageRequest & { tenant_id: string }): Promise<{ id: string }> {
    const id = this.generateMessageId();

    await this.db
      .prepare(
        `
      INSERT INTO ai_messages (id, conversation_id, tenant_id, role, content, tool_calls, tool_results, metadata, tokens_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        id,
        data.conversation_id,
        data.tenant_id,
        data.role,
        data.content,
        data.tool_calls ? JSON.stringify(data.tool_calls) : null,
        data.tool_results ? JSON.stringify(data.tool_results) : null,
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.tokens_used || 0
      )
      .run();

    // Update conversation stats
    await this.db
      .prepare(
        `
      UPDATE ai_conversations 
      SET message_count = message_count + 1, 
          token_count = token_count + ?,
          updated_at = datetime('now')
      WHERE id = ?
    `
      )
      .bind(data.tokens_used || 0, data.conversation_id)
      .run();

    return { id };
  }

  // Get messages for conversation
  async getMessages(conversationId: string, tenantId: string): Promise<any[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM ai_messages 
      WHERE conversation_id = ? AND tenant_id = ?
      ORDER BY created_at ASC
    `
      )
      .bind(conversationId, tenantId)
      .all();

    return (result.results || []).map((m: any) => ({
      ...m,
      tool_calls: m.tool_calls ? JSON.parse(m.tool_calls) : null,
      tool_results: m.tool_results ? JSON.parse(m.tool_results) : null,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
    }));
  }

  // Update conversation
  async updateConversation(
    id: string,
    tenantId: string,
    updates: {
      title?: string;
      summary?: string;
      topics?: string[];
      status?: string;
      ended_at?: string;
    }
  ): Promise<boolean> {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (updates.title !== undefined) {
      setClauses.push("title = ?");
      params.push(updates.title);
    }
    if (updates.summary !== undefined) {
      setClauses.push("summary = ?");
      params.push(updates.summary);
    }
    if (updates.topics !== undefined) {
      setClauses.push("topics = ?");
      params.push(JSON.stringify(updates.topics));
    }
    if (updates.status !== undefined) {
      setClauses.push("status = ?");
      params.push(updates.status);
    }
    if (updates.ended_at !== undefined) {
      setClauses.push("ended_at = ?");
      params.push(updates.ended_at);
    }

    setClauses.push("updated_at = datetime('now')");
    params.push(id, tenantId);

    const result = await this.db
      .prepare(
        `
      UPDATE ai_conversations SET ${setClauses.join(", ")} WHERE id = ? AND tenant_id = ?
    `
      )
      .bind(...params)
      .run();

    return result.meta.changes > 0;
  }

  // Archive conversation
  async archiveConversation(id: string, tenantId: string): Promise<boolean> {
    return this.updateConversation(id, tenantId, { status: "archived" });
  }

  // Delete conversation (soft delete)
  async deleteConversation(id: string, tenantId: string): Promise<boolean> {
    return this.updateConversation(id, tenantId, { status: "deleted" });
  }

  // Cleanup expired conversations (30-day retention)
  async cleanupExpired(): Promise<{ deleted: number }> {
    const now = new Date().toISOString();

    // First, delete messages for expired conversations
    await this.db
      .prepare(
        `
      DELETE FROM ai_messages WHERE conversation_id IN (
        SELECT id FROM ai_conversations WHERE expires_at < ? AND status != 'deleted'
      )
    `
      )
      .bind(now)
      .run();

    // Then soft-delete the conversations
    const result = await this.db
      .prepare(
        `
      UPDATE ai_conversations SET status = 'deleted' WHERE expires_at < ? AND status != 'deleted'
    `
      )
      .bind(now)
      .run();

    return { deleted: result.meta.changes };
  }

  // Search conversations
  async searchConversations(
    tenantId: string,
    query: string,
    options?: {
      userId?: string;
      limit?: number;
    }
  ): Promise<any[]> {
    const limit = options?.limit || 20;
    let sql = `
      SELECT c.* FROM ai_conversations c
      WHERE c.tenant_id = ? AND c.status != 'deleted'
      AND (c.title LIKE ? OR c.summary LIKE ? OR c.topics LIKE ?)
    `;
    const params: any[] = [tenantId, `%${query}%`, `%${query}%`, `%${query}%`];

    if (options?.userId) {
      sql += ` AND c.user_id = ?`;
      params.push(options.userId);
    }

    sql += ` ORDER BY c.updated_at DESC LIMIT ?`;
    params.push(limit);

    const result = await this.db
      .prepare(sql)
      .bind(...params)
      .all();
    return result.results || [];
  }
}

// ============================================================================
// MEMORY SERVICE
// ============================================================================

export class AIMemoryService {
  constructor(private db: D1Database) {}

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create a new memory
  async createMemory(data: CreateMemoryRequest): Promise<{ id: string }> {
    const id = this.generateId();

    await this.db
      .prepare(
        `
      INSERT INTO ai_memories (id, tenant_id, conversation_id, memory_type, content, entity_type, entity_id, confidence, source, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        id,
        data.tenant_id,
        data.conversation_id || null,
        data.memory_type,
        data.content,
        data.entity_type || null,
        data.entity_id || null,
        data.confidence,
        data.source,
        data.expires_at || null
      )
      .run();

    return { id };
  }

  // Get memories for entity
  async getMemoriesForEntity(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<any[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM ai_memories 
      WHERE tenant_id = ? AND entity_type = ? AND entity_id = ?
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY created_at DESC
    `
      )
      .bind(tenantId, entityType, entityId)
      .all();

    return result.results || [];
  }

  // Get all memories for tenant
  async listMemories(
    tenantId: string,
    options?: {
      memoryType?: string;
      limit?: number;
      offset?: number;
      includeExpired?: boolean;
    }
  ): Promise<any[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let query = `SELECT * FROM ai_memories WHERE tenant_id = ?`;
    const params: any[] = [tenantId];

    if (!options?.includeExpired) {
      query += ` AND (expires_at IS NULL OR expires_at > datetime('now'))`;
    }

    if (options?.memoryType) {
      query += ` AND memory_type = ?`;
      params.push(options.memoryType);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all();
    return result.results || [];
  }

  // Confirm a memory (user validation)
  async confirmMemory(id: string, tenantId: string, confirmedBy: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        `
      UPDATE ai_memories 
      SET is_confirmed = 1, confirmed_by = ?, confirmed_at = datetime('now'), source = 'user_confirmed'
      WHERE id = ? AND tenant_id = ?
    `
      )
      .bind(confirmedBy, id, tenantId)
      .run();

    return result.meta.changes > 0;
  }

  // Delete memory
  async deleteMemory(id: string, tenantId: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        `
      DELETE FROM ai_memories WHERE id = ? AND tenant_id = ?
    `
      )
      .bind(id, tenantId)
      .run();

    return result.meta.changes > 0;
  }

  // Search memories
  async searchMemories(
    tenantId: string,
    query: string,
    options?: {
      limit?: number;
    }
  ): Promise<any[]> {
    const limit = options?.limit || 20;

    const result = await this.db
      .prepare(
        `
      SELECT * FROM ai_memories 
      WHERE tenant_id = ? AND content LIKE ?
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY confidence DESC, created_at DESC
      LIMIT ?
    `
      )
      .bind(tenantId, `%${query}%`, limit)
      .all();

    return result.results || [];
  }

  // Cleanup expired memories
  async cleanupExpired(): Promise<{ deleted: number }> {
    const result = await this.db
      .prepare(
        `
      DELETE FROM ai_memories WHERE expires_at IS NOT NULL AND expires_at < datetime('now')
    `
      )
      .run();

    return { deleted: result.meta.changes };
  }
}

// ============================================================================
// MEMORY EXTRACTION (AI-powered)
// ============================================================================

export interface ExtractedMemory {
  type: "decision" | "preference" | "insight" | "action" | "rule" | "fact";
  content: string;
  confidence: number;
  entity_type?: string;
  entity_id?: string;
}

export async function extractMemoriesFromConversation(
  messages: Array<{ role: string; content: string }>,
  aiClient: any // Workers AI or OpenAI client
): Promise<ExtractedMemory[]> {
  // Format conversation for analysis
  const conversationText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const prompt = `Analyze this conversation and extract key memories that should be remembered for future interactions.

CONVERSATION:
${conversationText}

Extract memories in these categories:
- DECISION: Choices or decisions made
- PREFERENCE: User preferences expressed
- INSIGHT: Important business insights discovered
- ACTION: Action items or tasks identified
- RULE: Business rules or constraints mentioned
- FACT: Important facts about entities (accounts, contacts, deals)

For each memory, provide:
1. type: The category
2. content: A concise summary (1-2 sentences)
3. confidence: How confident are you (0.0-1.0)
4. entity_type: If related to an entity (account, contact, deal, user)
5. entity_id: The entity name/identifier if mentioned

Return as JSON array. Only include genuinely important memories worth remembering.

MEMORIES:`;

  try {
    // Call AI to extract memories
    const response = await aiClient.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content:
            "You are a memory extraction assistant. Extract important memories from conversations. Return valid JSON array only.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
    });

    // Parse response
    const text = response.response || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ExtractedMemory[];
    }
    return [];
  } catch (error) {
    console.error("Memory extraction failed:", error);
    return [];
  }
}
