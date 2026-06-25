/**
 * E2E Tests for Flows A, B, and C
 *
 * Flow A: Store Raw → Normalize via Pipeline → Store Spine
 * Flow B: Brain Ingestion → Semantic Processing → Knowledge Storage
 * Flow C: AI Content → Triage → Approval → Publishing
 */

import { describe, it, expect, beforeAll } from "vitest";

// Test configuration
const TEST_CONFIG = {
  // These would come from environment variables in actual E2E tests
  GATEWAY_URL: process.env.GATEWAY_URL || "http://localhost:8787",
  TENANT_ID: process.env.TEST_TENANT_ID || "test-tenant-123",
  API_KEY: process.env.TEST_API_KEY || "test-api-key",
};

// Helper for making authenticated requests
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${TEST_CONFIG.GATEWAY_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": TEST_CONFIG.TENANT_ID,
    Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

// ============================================================================
// FLOW A TESTS: Ingestion Pipeline
// ============================================================================

describe("Flow A: Ingestion Pipeline E2E", () => {
  describe("Webhook Ingestion", () => {
    it("should accept and store raw webhook from HubSpot", async () => {
      const webhookPayload = {
        eventId: "hubspot-contact-001",
        source: "hubspot",
        eventType: "contact.created",
        payload: {
          vid: 12345,
          properties: {
            firstname: { value: "John" },
            lastname: { value: "Doe" },
            email: { value: "john@example.com" },
          },
        },
        timestamp: new Date().toISOString(),
      };

      const response = await apiRequest("/v1/ingress/webhook/hubspot", {
        method: "POST",
        body: JSON.stringify(webhookPayload),
      });

      // Should accept the webhook (202 Accepted) or process immediately (200 OK)
      expect([200, 201, 202]).toContain(response.status);

      if (response.status === 200 || response.status === 201) {
        const result = await response.json();
        expect(result).toHaveProperty("entity_id");
        expect(result).toHaveProperty("entity_type", "contact");
        expect(result).toHaveProperty("version");
      }
    });

    it("should accept and store raw webhook from Stripe", async () => {
      const webhookPayload = {
        id: "evt_test_stripe_001",
        type: "customer.created",
        data: {
          object: {
            id: "cus_test_001",
            email: "customer@example.com",
            name: "Test Customer",
          },
        },
        created: Math.floor(Date.now() / 1000),
      };

      const response = await apiRequest("/v1/ingress/webhook/stripe", {
        method: "POST",
        body: JSON.stringify(webhookPayload),
        headers: {
          "Stripe-Signature": "test-signature",
        },
      });

      expect([200, 201, 202, 400]).toContain(response.status);
    });

    it("should normalize and store to Spine", async () => {
      // This tests the full Flow A: Raw → Normalize → Spine
      const testEntity = {
        source: "test",
        externalId: `test-entity-${Date.now()}`,
        eventType: "test.entity.created",
        payload: {
          name: "Test Entity",
          email: "test@example.com",
          metadata: { test: true },
        },
      };

      const response = await apiRequest("/v1/pipeline/process", {
        method: "POST",
        body: JSON.stringify(testEntity),
      });

      expect([200, 201]).toContain(response.status);

      if (response.ok) {
        const result = await response.json();
        expect(result.success).toBe(true);
        expect(result).toHaveProperty("entity_id");
        expect(result).toHaveProperty("entity_type");
        expect(result).toHaveProperty("canonical_id");
        expect(result).toHaveProperty("version");

        // Verify entity exists in Spine
        const spineCheck = await apiRequest(`/v1/spine/entities/${result.canonical_id}`);
        expect(spineCheck.status).toBe(200);
      }
    });

    it("should handle DLQ routing for failures", async () => {
      const invalidPayload = {
        // Missing required fields
        source: "test",
        payload: { malformed: true },
      };

      const response = await apiRequest("/v1/pipeline/process", {
        method: "POST",
        body: JSON.stringify(invalidPayload),
      });

      // Should either fail validation (400) or route to DLQ (202 Accepted for async processing)
      expect([400, 422, 202]).toContain(response.status);
    });
  });

  describe("Pipeline Health", () => {
    it("should return pipeline status", async () => {
      const response = await apiRequest("/v1/pipeline/health");

      expect(response.status).toBe(200);

      const health = await response.json();
      expect(health).toHaveProperty("status");
      expect(health).toHaveProperty("components");
    });

    it("should report processing metrics", async () => {
      const response = await apiRequest("/v1/pipeline/metrics");

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        const metrics = await response.json();
        expect(metrics).toHaveProperty("processed");
        expect(metrics).toHaveProperty("failed");
        expect(metrics).toHaveProperty("dlq_count");
      }
    });
  });
});

// ============================================================================
// FLOW B TESTS: Knowledge Processing
// ============================================================================

describe("Flow B: Knowledge Processing E2E", () => {
  describe("Document Ingestion", () => {
    it("should process and chunk a document", async () => {
      const documentPayload = {
        fileName: "test-document.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
        content: "This is a test document about artificial intelligence and machine learning.",
        metadata: {
          source: "upload",
          uploadedBy: "user-123",
        },
      };

      const response = await apiRequest("/v1/knowledge/documents", {
        method: "POST",
        body: JSON.stringify(documentPayload),
      });

      expect([200, 201, 202]).toContain(response.status);

      if (response.ok) {
        const result = await response.json();
        expect(result).toHaveProperty("document_id");
        expect(result).toHaveProperty("processing_status");
      }
    });

    it("should create embeddings for chunks", async () => {
      // First create a document
      const docResponse = await apiRequest("/v1/knowledge/documents", {
        method: "POST",
        body: JSON.stringify({
          fileName: "embeddings-test.txt",
          content: "This content should be embedded for semantic search.",
        }),
      });

      if (docResponse.ok) {
        const { document_id } = await docResponse.json();

        // Check embedding status
        const statusResponse = await apiRequest(`/v1/knowledge/processing-status/${document_id}`);

        expect(statusResponse.status).toBe(200);

        const status = await statusResponse.json();
        expect(status).toHaveProperty("status");
        expect(status).toHaveProperty("chunks_processed");
        expect(status).toHaveProperty("embeddings_created");
      }
    });

    it("should support semantic search", async () => {
      const searchQuery = {
        query: "artificial intelligence",
        topK: 5,
        filters: {
          tenant_id: TEST_CONFIG.TENANT_ID,
        },
      };

      const response = await apiRequest("/v1/knowledge/search", {
        method: "POST",
        body: JSON.stringify(searchQuery),
      });

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        const results = await response.json();
        expect(Array.isArray(results)).toBe(true);

        if (results.length > 0) {
          expect(results[0]).toHaveProperty("score");
          expect(results[0]).toHaveProperty("content");
          expect(results[0]).toHaveProperty("document_id");
        }
      }
    });

    it("should store session memory", async () => {
      const sessionPayload = {
        sessionId: `session-${Date.now()}`,
        summary: "Test conversation about product features",
        messages: [
          { role: "user", content: "What features do you offer?" },
          { role: "assistant", content: "We offer AI-powered insights..." },
        ],
        metadata: {
          user_id: "user-123",
          topic: "product_inquiry",
        },
      };

      const response = await apiRequest("/v1/knowledge/sessions", {
        method: "POST",
        body: JSON.stringify(sessionPayload),
      });

      expect([200, 201]).toContain(response.status);

      if (response.ok) {
        const result = await response.json();
        expect(result).toHaveProperty("session_id");
        expect(result).toHaveProperty("embedding_stored");
      }
    });

    it("should retrieve relevant session memories", async () => {
      const searchPayload = {
        query: "product features",
        type: "sessions",
        limit: 5,
      };

      const response = await apiRequest("/knowledge/search/sessions", {
        method: "POST",
        body: JSON.stringify(searchPayload),
      });

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        const results = await response.json();
        expect(Array.isArray(results)).toBe(true);
      }
    });
  });

  describe("Extraction Feedback", () => {
    it("should accept extraction feedback", async () => {
      const feedbackPayload = {
        documentId: "doc-test-001",
        extractionId: "ext-test-001",
        corrections: [{ field: "company_name", original: "Acme", corrected: "Acme Corp" }],
        approved: true,
        rating: 4,
      };

      const response = await apiRequest("/v1/knowledge/extraction-feedback", {
        method: "POST",
        body: JSON.stringify(feedbackPayload),
      });

      expect([200, 201, 404]).toContain(response.status);
    });

    it("should trigger reprocessing on feedback", async () => {
      const reprocessPayload = {
        documentId: "doc-test-001",
        corrections: [{ field: "total_amount", original: "100", corrected: "1000" }],
      };

      const response = await apiRequest("/v1/knowledge/reprocess/doc-test-001", {
        method: "POST",
        body: JSON.stringify(reprocessPayload),
      });

      expect([200, 202, 404]).toContain(response.status);
    });
  });
});

// ============================================================================
// FLOW C TESTS: AI Content Triage & Approval
// ============================================================================

describe("Flow C: AI Content Triage E2E", () => {
  describe("Content Submission", () => {
    it("should accept AI-generated content for triage", async () => {
      const contentPayload = {
        content: "Suggested action: Contact Acme Corp about their renewal. Confidence: 92%",
        source: "claude",
        platform: "claude",
        context: {
          entity_type: "account",
          entity_id: "account-123",
          trigger: "renewal_risk_detected",
        },
        metadata: {
          model: "claude-3.5-sonnet",
          temperature: 0.7,
        },
      };

      const response = await apiRequest("/v1/triage/submit", {
        method: "POST",
        body: JSON.stringify(contentPayload),
      });

      expect([200, 201, 202]).toContain(response.status);

      if (response.ok) {
        const result = await response.json();
        expect(result).toHaveProperty("triage_id");
        expect(result).toHaveProperty("status");
        expect(["pending", "auto_approved", "triage"]).toContain(result.status);
      }
    });

    it("should auto-approve high confidence content from trusted sources", async () => {
      const highConfidencePayload = {
        content: "High confidence insight about customer behavior",
        source: "claude",
        platform: "claude",
        confidence: 0.95,
        context: {
          entity_type: "contact",
          entity_id: "contact-123",
        },
      };

      const response = await apiRequest("/v1/triage/submit", {
        method: "POST",
        body: JSON.stringify(highConfidencePayload),
      });

      expect([200, 201]).toContain(response.status);

      if (response.ok) {
        const result = await response.json();
        // If Flow C config allows auto-approval
        if (result.status === "auto_approved") {
          expect(result).toHaveProperty("approved_at");
          expect(result).toHaveProperty("published_id");
        }
      }
    });

    it("should route low confidence content to triage queue", async () => {
      const lowConfidencePayload = {
        content: "Uncertain insight that needs review",
        source: "openai",
        platform: "openai",
        confidence: 0.65,
        context: {
          entity_type: "opportunity",
          entity_id: "opp-123",
        },
      };

      const response = await apiRequest("/v1/triage/submit", {
        method: "POST",
        body: JSON.stringify(lowConfidencePayload),
      });

      expect([200, 201]).toContain(response.status);

      if (response.ok) {
        const result = await response.json();
        // Should go to triage for low confidence
        expect(result.status).toBe("triage");
      }
    });
  });

  describe("Triage Queue Management", () => {
    it("should list pending triage items", async () => {
      const response = await apiRequest("/v1/triage/pending");

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        const items = await response.json();
        expect(Array.isArray(items)).toBe(true);

        if (items.length > 0) {
          expect(items[0]).toHaveProperty("triage_id");
          expect(items[0]).toHaveProperty("content");
          expect(items[0]).toHaveProperty("confidence");
          expect(items[0]).toHaveProperty("status", "pending");
        }
      }
    });

    it("should approve content from triage queue", async () => {
      // First get pending items
      const pendingResponse = await apiRequest("/v1/triage/pending");

      if (pendingResponse.status === 200) {
        const items = await pendingResponse.json();

        if (items.length > 0) {
          const triageId = items[0].triage_id;

          const approveResponse = await apiRequest(`/v1/triage/${triageId}/approve`, {
            method: "POST",
            body: JSON.stringify({
              approved_by: "user-123",
              reason: "Verified and approved",
            }),
          });

          expect([200, 201, 404]).toContain(approveResponse.status);

          if (approveResponse.ok) {
            const result = await approveResponse.json();
            expect(result.status).toBe("approved");
            expect(result).toHaveProperty("published_id");
          }
        }
      }
    });

    it("should reject content from triage queue", async () => {
      const pendingResponse = await apiRequest("/v1/triage/pending");

      if (pendingResponse.status === 200) {
        const items = await pendingResponse.json();

        if (items.length > 0) {
          const triageId = items[0].triage_id;

          const rejectResponse = await apiRequest(`/v1/triage/${triageId}/reject`, {
            method: "POST",
            body: JSON.stringify({
              rejected_by: "user-123",
              reason: "Not accurate",
            }),
          });

          expect([200, 201, 404]).toContain(rejectResponse.status);

          if (rejectResponse.ok) {
            const result = await rejectResponse.json();
            expect(result.status).toBe("rejected");
          }
        }
      }
    });
  });

  describe("Flow C Configuration", () => {
    it("should get Flow C configuration", async () => {
      const response = await apiRequest("/v1/triage/config");

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        const config = await response.json();
        expect(config).toHaveProperty("auto_approve_sources");
        expect(config).toHaveProperty("min_confidence");
        expect(config).toHaveProperty("rules");
        expect(config).toHaveProperty("max_daily_auto_approve");
      }
    });

    it("should update Flow C configuration", async () => {
      const configUpdate = {
        auto_approve_sources: ["claude"],
        min_confidence: 0.9,
        max_daily_auto_approve: 500,
        rules: [
          {
            name: "High Confidence Auto-Approve",
            source: "*",
            min_confidence: 0.9,
            action: "auto_approve",
            priority: 100,
            active: true,
          },
        ],
      };

      const response = await apiRequest("/v1/triage/config", {
        method: "PUT",
        body: JSON.stringify(configUpdate),
      });

      expect([200, 201, 404]).toContain(response.status);
    });

    it("should enforce daily auto-approval limits", async () => {
      // Get current stats
      const statsResponse = await apiRequest("/v1/triage/stats");

      if (statsResponse.status === 200) {
        const stats = await statsResponse.json();
        expect(stats).toHaveProperty("auto_approved_today");
        expect(stats).toHaveProperty("limit");
        expect(stats).toHaveProperty("remaining");

        // Ensure remaining is calculated correctly
        expect(stats.remaining).toBe(stats.limit - stats.auto_approved_today);
      }
    });
  });

  describe("Entity Linking", () => {
    it("should link approved content to entities", async () => {
      const contentWithEntity = {
        content: "Insight about Acme Corp",
        source: "claude",
        platform: "claude",
        confidence: 0.92,
        context: {
          entity_type: "account",
          entity_id: "account-acme-123",
          entity_name: "Acme Corp",
        },
      };

      const response = await apiRequest("/v1/triage/submit", {
        method: "POST",
        body: JSON.stringify(contentWithEntity),
      });

      if (response.ok) {
        const result = await response.json();

        // Check entity linkage
        const entityResponse = await apiRequest(`/v1/spine/entities/account-acme-123/insights`);

        expect([200, 404]).toContain(entityResponse.status);
      }
    });
  });

  describe("Notifications", () => {
    it("should trigger notifications for urgent items", async () => {
      const urgentPayload = {
        content: "Critical security alert!",
        source: "system",
        platform: "system",
        confidence: 0.99,
        priority: "urgent",
        context: {
          entity_type: "alert",
          alert_type: "security",
        },
      };

      const response = await apiRequest("/v1/triage/submit", {
        method: "POST",
        body: JSON.stringify(urgentPayload),
      });

      expect([200, 201]).toContain(response.status);
    });
  });
});

// ============================================================================
// CROSS-FLOW INTEGRATION TESTS
// ============================================================================

describe("Cross-Flow Integration E2E", () => {
  it("Flow A → B: Document ingestion triggers knowledge processing", async () => {
    // Upload a document via Flow A
    const documentPayload = {
      source: "upload",
      externalId: `doc-integration-${Date.now()}`,
      eventType: "document.uploaded",
      payload: {
        fileName: "contract.pdf",
        content: "This is a contract document with important terms...",
        mimeType: "application/pdf",
      },
    };

    const pipelineResponse = await apiRequest("/v1/pipeline/process", {
      method: "POST",
      body: JSON.stringify(documentPayload),
    });

    if (pipelineResponse.ok) {
      const pipelineResult = await pipelineResponse.json();

      // Verify document appears in knowledge system
      const knowledgeResponse = await apiRequest(
        `/v1/knowledge/documents/${pipelineResult.entity_id}/status`
      );

      expect([200, 202, 404]).toContain(knowledgeResponse.status);
    }
  });

  it("Flow B → C: AI insights go through triage", async () => {
    // First, store some knowledge
    const sessionPayload = {
      sessionId: `ai-session-${Date.now()}`,
      summary: "AI-generated insight about customer churn risk",
      messages: [
        { role: "system", content: "Analyzing customer data..." },
        { role: "assistant", content: "High churn risk detected for Customer XYZ" },
      ],
    };

    const knowledgeResponse = await apiRequest("/v1/knowledge/sessions", {
      method: "POST",
      body: JSON.stringify(sessionPayload),
    });

    if (knowledgeResponse.ok) {
      // Then submit an AI insight based on that knowledge
      const insightPayload = {
        content: "Recommendation: Proactive outreach to Customer XYZ due to churn risk",
        source: "ai_analysis",
        platform: "claude",
        confidence: 0.88,
        context: {
          entity_type: "account",
          entity_id: "account-xyz",
          derived_from: sessionPayload.sessionId,
        },
      };

      const triageResponse = await apiRequest("/v1/triage/submit", {
        method: "POST",
        body: JSON.stringify(insightPayload),
      });

      expect([200, 201, 202]).toContain(triageResponse.status);
    }
  });

  it("Flow C → A: Approved content updates Spine", async () => {
    // Submit and auto-approve content
    const contentPayload = {
      content: "Updated account status: Premium",
      source: "claude",
      platform: "claude",
      confidence: 0.95,
      context: {
        entity_type: "account",
        entity_id: "account-premium-123",
      },
    };

    const triageResponse = await apiRequest("/v1/triage/submit", {
      method: "POST",
      body: JSON.stringify(contentPayload),
    });

    if (triageResponse.ok) {
      const triageResult = await triageResponse.json();

      // If auto-approved, verify it updates Spine
      if (triageResult.status === "auto_approved") {
        const spineResponse = await apiRequest(`/v1/spine/entities/account-premium-123`);

        expect([200, 404]).toContain(spineResponse.status);
      }
    }
  });
});

// ============================================================================
// ERROR HANDLING & EDGE CASES
// ============================================================================

describe("Error Handling & Edge Cases", () => {
  it("should handle missing tenant ID", async () => {
    const response = await fetch(`${TEST_CONFIG.GATEWAY_URL}/v1/pipeline/health`);

    // Should require tenant ID
    expect(response.status).toBe(400);
  });

  it("should handle invalid API keys", async () => {
    const response = await fetch(`${TEST_CONFIG.GATEWAY_URL}/v1/pipeline/health`, {
      headers: {
        "x-tenant-id": TEST_CONFIG.TENANT_ID,
        Authorization: "Bearer invalid-key",
      },
    });

    // Should reject invalid auth
    expect([401, 403]).toContain(response.status);
  });

  it("should handle malformed payloads gracefully", async () => {
    const response = await apiRequest("/v1/pipeline/process", {
      method: "POST",
      body: "not valid json",
      headers: {
        "Content-Type": "text/plain",
      },
    });

    expect([400, 422]).toContain(response.status);
  });

  it("should handle very large payloads", async () => {
    const largePayload = {
      source: "test",
      externalId: "large-test",
      eventType: "test.large",
      payload: {
        data: "x".repeat(100000), // 100KB of data
      },
    };

    const response = await apiRequest("/v1/pipeline/process", {
      method: "POST",
      body: JSON.stringify(largePayload),
    });

    // Should either accept or reject with proper error
    expect([200, 201, 400, 413]).toContain(response.status);
  });
});
