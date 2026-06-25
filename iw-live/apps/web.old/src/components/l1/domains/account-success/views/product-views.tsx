/**
 * Account Success Product Views — Adaptive wrappers
 *
 * These wrap the generic ProductView for the Account Success surface products
 * that don't have dedicated custom views yet.
 *
 * Products with dedicated views (keep their custom components):
 *   - SuccessPilot → csm-accounts-hub.tsx
 *   - ChurnShield → intelligence-center.tsx
 *   - SuccessCommand → strategic-account-success.tsx
 *
 * Products using generic adaptive renderer:
 *   - DataSentinel, VaultGuard, ArchitectIQ, TemplateForge, DealDesk
 */
import React from "react";
import { ProductView } from "@/components/l1/views/product-view";

export function DataSentinelView() {
  return (
    <ProductView
      productId="data_sentinel"
      title="DataSentinel"
      subtitle="Data quality monitoring, anomaly detection, identity resolution"
    />
  );
}

export function VaultGuardView() {
  return (
    <ProductView
      productId="vault_guard"
      title="VaultGuard"
      subtitle="Contract repository, renewal calendar, entitlement tracking"
    />
  );
}

export function ArchitectIQView() {
  return (
    <ProductView
      productId="architect_iq"
      title="ArchitectIQ"
      subtitle="Integration landscape, connector health, dependency tracking"
    />
  );
}

export function TemplateForgeView() {
  return (
    <ProductView
      productId="template_forge"
      title="TemplateForge"
      subtitle="Playbook engine, QBR templates, onboarding workflows"
    />
  );
}

export function DealDeskView() {
  return (
    <ProductView
      productId="deal_desk"
      title="DealDesk"
      subtitle="Expansion signals, upsell tracking, commercial intelligence"
    />
  );
}
