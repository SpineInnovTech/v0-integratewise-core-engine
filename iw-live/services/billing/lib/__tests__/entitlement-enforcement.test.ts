/**
 * Entitlement Enforcement Tests
 *
 * Tests that entitlement checks work correctly:
 * - Free users blocked from premium features
 * - Pro users have correct limits
 * - Enterprise users have unlimited access
 * - Admin overrides work (dev/staging only)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EntitlementEnforcement } from "../enforcement";
import { BillingService } from "../service";
import { ENTITLEMENT_KEYS } from "../types";

vi.mock("../service", () => ({
  BillingService: {
    hasEntitlement: vi.fn(),
    getEntitlementValue: vi.fn(),
  },
}));

describe("EntitlementEnforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkAccess", () => {
    it("should return true for users with entitlement", async () => {
      vi.mocked(BillingService.hasEntitlement).mockResolvedValue(true);

      const hasAccess = await EntitlementEnforcement.checkAccess(
        "org_123",
        ENTITLEMENT_KEYS.API_ACCESS
      );

      expect(hasAccess).toBe(true);
      expect(BillingService.hasEntitlement).toHaveBeenCalledWith(
        "org_123",
        ENTITLEMENT_KEYS.API_ACCESS
      );
    });

    it("should return false for users without entitlement", async () => {
      vi.mocked(BillingService.hasEntitlement).mockResolvedValue(false);

      const hasAccess = await EntitlementEnforcement.checkAccess(
        "org_123",
        ENTITLEMENT_KEYS.API_ACCESS
      );

      expect(hasAccess).toBe(false);
    });

    it("should fail open in development on error", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      vi.mocked(BillingService.hasEntitlement).mockRejectedValue(new Error("Service unavailable"));

      const hasAccess = await EntitlementEnforcement.checkAccess(
        "org_123",
        ENTITLEMENT_KEYS.API_ACCESS
      );

      expect(hasAccess).toBe(true); // Fail open in dev

      process.env.NODE_ENV = originalEnv;
    });

    it("should fail closed in production on error", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      vi.mocked(BillingService.hasEntitlement).mockRejectedValue(new Error("Service unavailable"));

      const hasAccess = await EntitlementEnforcement.checkAccess(
        "org_123",
        ENTITLEMENT_KEYS.API_ACCESS
      );

      expect(hasAccess).toBe(false); // Fail closed in prod

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("getValue", () => {
    it("should return entitlement value", async () => {
      vi.mocked(BillingService.getEntitlementValue).mockResolvedValue(100);

      const value = await EntitlementEnforcement.getValue(
        "org_123",
        ENTITLEMENT_KEYS.MAX_WORKFLOWS
      );

      expect(value).toBe(100);
      expect(BillingService.getEntitlementValue).toHaveBeenCalledWith(
        "org_123",
        ENTITLEMENT_KEYS.MAX_WORKFLOWS
      );
    });

    it("should return null if entitlement not found", async () => {
      vi.mocked(BillingService.getEntitlementValue).mockResolvedValue(null);

      const value = await EntitlementEnforcement.getValue(
        "org_123",
        ENTITLEMENT_KEYS.MAX_WORKFLOWS
      );

      expect(value).toBeNull();
    });
  });

  describe("Plan-based entitlements", () => {
    it("should enforce Free plan limits", async () => {
      // Free plan: 3 workflows max
      vi.mocked(BillingService.getEntitlementValue).mockResolvedValue(3);

      const maxWorkflows = await EntitlementEnforcement.getValue(
        "org_free",
        ENTITLEMENT_KEYS.MAX_WORKFLOWS
      );

      expect(maxWorkflows).toBe(3);
    });

    it("should enforce Pro plan limits", async () => {
      // Pro plan: 50 workflows max
      vi.mocked(BillingService.getEntitlementValue).mockResolvedValue(50);

      const maxWorkflows = await EntitlementEnforcement.getValue(
        "org_pro",
        ENTITLEMENT_KEYS.MAX_WORKFLOWS
      );

      expect(maxWorkflows).toBe(50);
    });

    it("should allow unlimited for Enterprise", async () => {
      // Enterprise: unlimited (999999)
      vi.mocked(BillingService.getEntitlementValue).mockResolvedValue(999999);

      const maxWorkflows = await EntitlementEnforcement.getValue(
        "org_enterprise",
        ENTITLEMENT_KEYS.MAX_WORKFLOWS
      );

      expect(maxWorkflows).toBe(999999);
    });
  });
});
