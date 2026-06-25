export * from "./types";
export * from "./registry";
export * from "./sync-registry";
export * from "./packs/saas-vertical";
export * from "./packs/csm-role";
export * from "./packs/exec-role";
export * from "./packs/domain-intelligence";
export * from "./packs/foundation-pack";
export * from "./packs/cs-growth-pack";
export * from "./packs/enterprise-governance-pack";
export * from "./packs/commercial-pack";
export * from "./packs/universal-packs";
export * from "./packs/revenue-pack";
export * from "./runner";

import { registry } from "./registry";
import { SaaSAccountIntelligence } from "./packs/saas-vertical";
import { CSMAccount360 } from "./packs/csm-role";
import { ExecBusinessCockpit } from "./packs/exec-role";
import {
  CustomerHealthScore,
  ChurnPrediction,
  RevenueForecaster,
  PipelineVelocity,
  SupportHealth,
  MarketingAttribution,
} from "./packs/domain-intelligence";

import { ConnectorCoverage, RelationshipIntegrity, RAGQuality } from "./packs/foundation-pack";
import {
  RenewalExpansionSignal,
  PlaybookCompliance,
  ExecutiveAlignment,
} from "./packs/cs-growth-pack";
import {
  AutomationMining,
  FormulaTranslation,
  ComplianceReadiness,
  AgentROI,
} from "./packs/enterprise-governance-pack";
import { ContractIntelligence, RiskRegisterAutopilot } from "./packs/commercial-pack";
import { UniversalExtractionPack, UniversalNormalizerPack } from "./packs/universal-packs";
import { RevenueAcceleratorPack } from "./packs/revenue-pack";

// Register Vertical & Role Accelerators
registry.register(SaaSAccountIntelligence);
registry.register(CSMAccount360);
registry.register(ExecBusinessCockpit);

// Register Intelligence Modules (Previous 6)
registry.register(CustomerHealthScore);
registry.register(ChurnPrediction);
registry.register(RevenueForecaster);
registry.register(PipelineVelocity);
registry.register(SupportHealth);
registry.register(MarketingAttribution);

// Register Revenue Packs (The 12 Money Makers)
registry.register(ConnectorCoverage);
registry.register(RelationshipIntegrity);
registry.register(RAGQuality);
registry.register(RenewalExpansionSignal);
registry.register(PlaybookCompliance);
registry.register(ExecutiveAlignment);
registry.register(AutomationMining);
registry.register(FormulaTranslation);
registry.register(ComplianceReadiness);
registry.register(AgentROI);
registry.register(ContractIntelligence);
registry.register(RiskRegisterAutopilot);

// Register Universal System Packs
registry.register(UniversalExtractionPack);
registry.register(UniversalNormalizerPack);
registry.register(RevenueAcceleratorPack);

console.log(`[Accelerators] Registered ${registry.list().length} default accelerators.`);
