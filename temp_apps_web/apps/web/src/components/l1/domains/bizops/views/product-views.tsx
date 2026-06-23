/**
 * Business Ops Product Views — Adaptive wrappers
 *
 * Products with dedicated views (keep their custom components):
 *   - OpsCore → ceo-view, coo-view, cio-cto-view, founder-ops-view
 *
 * Products using generic adaptive renderer:
 *   - ComplianceVault, VendorGuard, PartnerBridge, GrowthDesk, HirePilot, FinPulse
 */
import React from "react";
import { ProductView } from "@/components/l1/views/product-view";

export function ComplianceVaultView() {
  return (
    <ProductView
      productId="compliance_vault"
      title="ComplianceVault"
      subtitle="Filings, governance docs, regulatory tracking, audit readiness"
    />
  );
}

export function VendorGuardView() {
  return (
    <ProductView
      productId="vendor_guard"
      title="VendorGuard"
      subtitle="Vendor management, contracts, SLA tracking, spend visibility"
    />
  );
}

export function PartnerBridgeView() {
  return (
    <ProductView
      productId="partner_bridge"
      title="PartnerBridge"
      subtitle="Partner ecosystem mapping, channel tracking, co-sell coordination"
    />
  );
}

export function GrowthDeskView() {
  return (
    <ProductView
      productId="growth_desk"
      title="GrowthDesk"
      subtitle="Pipeline, GTM tracking, campaign performance"
    />
  );
}

export function HirePilotView() {
  return (
    <ProductView
      productId="hire_pilot"
      title="HirePilot"
      subtitle="Hiring pipeline, team planning, onboarding tracking"
    />
  );
}

export function FinPulseView() {
  return (
    <ProductView
      productId="fin_pulse"
      title="FinPulse"
      subtitle="Cash flow monitoring, burn rate projection, financial alerts"
    />
  );
}
