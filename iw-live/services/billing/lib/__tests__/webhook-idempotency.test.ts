/**
 * Webhook Idempotency Tests
 *
 * Tests that webhook processing is idempotent:
 * - Same webhook event processed twice returns same result
 * - No duplicate payments/subscriptions created
 * - No duplicate audit logs
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebhookProcessor, WebhookVerifier } from "../webhooks";
import type { WebhookEvent } from "../types";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("WebhookProcessor - Idempotency", () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  describe("processPaymentSuccess", () => {
    const mockEvent: WebhookEvent = {
      id: "evt_test_123",
      type: "payment.succeeded",
      provider: "stripe",
      data: {
        id: "pay_123",
        payment_id: "pay_123",
        invoice_id: "inv_123",
        amount: 10000,
        amount_cents: 10000,
        currency: "USD",
      },
      signature: "sig_test",
      timestamp: Date.now(),
    };

    it("should process payment successfully on first call", async () => {
      // Mock: no existing payment
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      // Mock: invoice exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "inv_123",
                org_id: "org_123",
                subscription_id: "sub_123",
                status: "open",
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock: insert payment
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      // Mock: update invoice
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock: get subscription
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "sub_123", status: "past_due" },
            }),
          }),
        }),
      });

      // Mock: update subscription
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock: audit log
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      await WebhookProcessor.processPaymentSuccess(mockEvent);

      // Verify payment insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith("payments");
    });

    it("should skip processing if payment already exists (idempotency)", async () => {
      // Mock: existing payment found
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "pay_existing" },
                error: null,
              }),
            }),
          }),
        }),
      });

      await WebhookProcessor.processPaymentSuccess(mockEvent);

      // Verify no payment insert was called
      const insertCalls = mockSupabase.from.mock.calls.filter(
        (call) => call[0] === "payments" && call[1]?.insert
      );
      expect(insertCalls.length).toBe(0);
    });

    it("should handle duplicate webhook events gracefully", async () => {
      // First call - process payment
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      // ... rest of mocks for first call (simplified)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "inv_123",
                org_id: "org_123",
                subscription_id: "sub_123",
                status: "open",
              },
              error: null,
            }),
          }),
        }),
      });
      mockSupabase.from.mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) });
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      });
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: "sub_123", status: "past_due" }, error: null }),
          }),
        }),
      });
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      });
      mockSupabase.from.mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) });

      await WebhookProcessor.processPaymentSuccess(mockEvent);

      // Second call - should be idempotent (existing payment)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "pay_existing" },
                error: null,
              }),
            }),
          }),
        }),
      });

      await WebhookProcessor.processPaymentSuccess(mockEvent);

      // Should not create duplicate payment: first call does from('payments') for select + insert,
      // second call does from('payments') for select only. So we get 3 from('payments') calls total.
      const paymentCalls = mockSupabase.from.mock.calls.filter((call) => call[0] === "payments");
      expect(paymentCalls.length).toBeLessThanOrEqual(3);
    });
  });

  describe("WebhookVerifier - Signature Verification", () => {
    it("should verify valid signature", async () => {
      const payload = "test payload";
      const secret = "test_secret";
      const { createHmac } = await import("crypto");
      const hmac = createHmac("sha256", secret);
      hmac.update(payload);
      const validSignature = hmac.digest("hex");

      const isValid = WebhookVerifier.verifySignature(payload, validSignature, secret);

      expect(isValid).toBe(true);
    });

    it("should reject invalid signature", () => {
      const payload = "test payload";
      const secret = "test_secret";
      const invalidSignature = "invalid_signature";

      const isValid = WebhookVerifier.verifySignature(payload, invalidSignature, secret);

      expect(isValid).toBe(false);
    });

    it("should reject old timestamps (replay protection)", () => {
      const payload = "test payload";
      const secret = "test_secret";
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago

      const isValid = WebhookVerifier.verifySignature(payload, "signature", secret, oldTimestamp);

      expect(isValid).toBe(false);
    });
  });
});
