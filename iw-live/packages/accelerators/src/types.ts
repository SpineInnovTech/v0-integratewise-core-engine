export type AcceleratorType = "vertical" | "role_view" | "intelligence" | "universal";

// D1: Entity Definitions
export interface EntityField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "json" | "relation";
  description?: string;
  required?: boolean;
  ref?: string; // For relations
}

export interface EntityModel {
  name: string;
  description?: string;
  fields: EntityField[];
}

// D2: Context Types
export interface ContextType {
  name: string; // e.g. 'qbr_deck'
  chunking_policy: "paragraph" | "page" | "slide" | "whole";
  extractors: string[]; // e.g. ['ocr', 'keyword']
}

// D3: Signal Definitions
export interface SignalDefinition {
  id?: string;
  name: string; // e.g. 'renewal_risk_level'
  source?: string; // e.g. 'computed', 'crm', 'support'
  description: string;
  logic: string; // Description or reference to implementation
  trigger: "schedule" | "event";
}

// D4: View Projections
export interface ViewProjection {
  description?: string;
  modules_enabled: string[]; // e.g. ['accounts', 'meetings']
  default_filters?: Record<string, any>;
  field_sets?: Record<string, string[]>; // Field groupings for views
  widgets?: string[];
  actions_allowed?: string[];
}

// C1: Accelerator Manifest
export interface AcceleratorManifest {
  id: string;
  name: string;
  version: string;
  type: AcceleratorType;
  description: string;

  // Taxonomy
  vertical?: string; // e.g. 'saas'
  roles_supported?: string[]; // e.g. ['csm', 'exec']

  // Dependencies
  tools_supported: string[]; // e.g. ['salesforce', 'zendesk']

  // Schema / Logic
  entity_models?: EntityModel[];
  context_models?: ContextType[];
  signals?: SignalDefinition[];

  // Mapping (Tool -> Entity)
  mappings?: Record<string, any>;

  // Pipelines (Ingestion Stages)
  pipelines?: Record<string, string[]>;

  // L1 Projections (for Role Packs)
  views?: Record<string, ViewProjection>;

  // Governance
  policies?: Record<string, any>;
}
