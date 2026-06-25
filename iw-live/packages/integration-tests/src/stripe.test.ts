import { describe, it, expect, vi } from "vitest";
import { StripePaymentEventSchema } from "@integratewise/connector-contracts";

describe("Stripe Integration Flow", () => {
  // This test simulates the receipt of a Stripe webhook and its processing
  it("should validate and normalize a Stripe checkout.session.completed event", async () => {
    const mockStripeEvent = {
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_abc",
          amount: 5000,
          currency: "usd",
          customer: "cus_test_xyz",
          status: "paid",
        },
      },
      created: Math.floor(Date.now() / 1000),
    };

    // 1. Validate against contract
    const result = StripePaymentEventSchema.safeParse(mockStripeEvent);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.type).toBe("checkout.session.completed");
      expect(result.data.data.object.amount).toBe(5000);
    }
  });

  it("should catch validation errors for malformed Stripe events", () => {
    const malformedEvent = {
      id: "evt_bad",
      type: "charge.failed",
      // Missing data.object...
    };

    const result = StripePaymentEventSchema.safeParse(malformedEvent);
    expect(result.success).toBe(false);
  });
});
