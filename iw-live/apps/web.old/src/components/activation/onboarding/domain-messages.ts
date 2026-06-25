/**
 * Domain-Specific Onboarding Messages
 *
 * Maps each domain to extraction progress messages (AILoader)
 * and normalizer step labels (WorkplaceLoading).
 *
 * These are user-facing strings only — no entity type names or schema details.
 * The domain key is derived from DEPARTMENT_TO_CONFIG_KEY (lowercase).
 */

// ─── AILoader: Extraction Progress Messages ─────────────────────────────────
// Used by AILoader to show domain-specific messages during Creamy Layer extraction.
// Each domain must have at least 4 messages.

export const DOMAIN_EXTRACTION_MESSAGES: Record<string, string[]> = {
  customer_success: [
    "Extracting account health data...",
    "Mapping customer relationships...",
    "Analyzing renewal timelines...",
    "Building engagement history...",
    "Calculating health score baselines...",
  ],
  revops: [
    "Extracting pipeline data...",
    "Calculating revenue metrics...",
    "Mapping forecast models...",
    "Analyzing attribution touchpoints...",
    "Building quota attainment view...",
  ],
  sales: [
    "Extracting deal pipeline...",
    "Mapping contact relationships...",
    "Analyzing sales sequences...",
    "Building territory coverage...",
    "Scoring competitive intelligence...",
  ],
  marketing: [
    "Extracting campaign data...",
    "Mapping attribution touchpoints...",
    "Analyzing lead funnel...",
    "Building audience segments...",
    "Calculating content performance...",
  ],
  product_engineering: [
    "Extracting sprint data...",
    "Mapping feature roadmap...",
    "Analyzing incident history...",
    "Building release timeline...",
    "Calculating engineering velocity...",
  ],
  finance: [
    "Extracting invoice data...",
    "Mapping budget allocations...",
    "Analyzing revenue recognition...",
    "Building cost center view...",
    "Generating compliance status...",
  ],
  service: [
    "Extracting ticket history...",
    "Analyzing SLA compliance...",
    "Mapping escalation patterns...",
    "Building agent performance view...",
    "Calculating CSAT trends...",
  ],
  procurement: [
    "Extracting vendor contracts...",
    "Mapping spend categories...",
    "Analyzing renewal timelines...",
    "Building savings tracker...",
    "Calculating compliance scores...",
  ],
  it_admin: [
    "Extracting system inventory...",
    "Mapping vulnerability status...",
    "Analyzing certificate expiry...",
    "Building license utilization view...",
    "Generating incident trends...",
  ],
  student_teacher: [
    "Extracting course data...",
    "Mapping student progress...",
    "Analyzing attendance patterns...",
    "Building grade distributions...",
    "Identifying at-risk students...",
  ],
  bizops: [
    "Extracting project data...",
    "Mapping cross-department initiatives...",
    "Analyzing KPI trends...",
    "Building OKR alignment...",
    "Generating operational insights...",
  ],
  personal: [
    "Extracting tasks and notes...",
    "Mapping calendar events...",
    "Analyzing goal progress...",
    "Building daily reflection view...",
  ],
};

// ─── WorkplaceLoading: Normalizer Step Labels ────────────────────────────────
// Used by WorkplaceLoading to show domain-specific progress steps.
// Each domain must have between 3 and 6 steps with non-empty id and label.

export const DOMAIN_NORMALIZER_STEPS: Record<string, Array<{ id: string; label: string }>> = {
  customer_success: [
    { id: "normalizer", label: "Normalizing customer records..." },
    { id: "spine_schema", label: "Mapping Spine customer schemas..." },
    { id: "spine_traits", label: "Wiring customer health traits..." },
    { id: "ui", label: "Preparing customer success workbench..." },
  ],
  revops: [
    { id: "normalizer", label: "Normalizing pipeline data..." },
    { id: "spine_schema", label: "Mapping Spine revenue model..." },
    { id: "spine_traits", label: "Wiring forecast and quota traits..." },
    { id: "ui", label: "Preparing RevOps workbench..." },
  ],
  sales: [
    { id: "normalizer", label: "Normalizing CRM records..." },
    { id: "spine_schema", label: "Mapping Spine sales pipeline..." },
    { id: "spine_traits", label: "Wiring contact and outreach traits..." },
    { id: "ui", label: "Preparing sales workbench..." },
  ],
  marketing: [
    { id: "normalizer", label: "Normalizing campaign metrics..." },
    { id: "spine_schema", label: "Mapping Spine campaign schemas..." },
    { id: "spine_traits", label: "Wiring audience and attribution traits..." },
    { id: "ui", label: "Preparing marketing workbench..." },
  ],
  product_engineering: [
    { id: "normalizer", label: "Normalizing ticket & sprint records..." },
    { id: "spine_schema", label: "Mapping Spine roadmap & sprints..." },
    { id: "spine_traits", label: "Wiring velocity & incident traits..." },
    { id: "ui", label: "Preparing engineering workbench..." },
  ],
  finance: [
    { id: "normalizer", label: "Normalizing transaction records..." },
    { id: "spine_schema", label: "Mapping Spine financial categories..." },
    { id: "spine_traits", label: "Wiring compliance & allocation traits..." },
    { id: "ui", label: "Preparing finance workbench..." },
  ],
  service: [
    { id: "normalizer", label: "Normalizing support tickets..." },
    { id: "spine_schema", label: "Mapping Spine ticket schemas..." },
    { id: "spine_traits", label: "Wiring SLA & performance traits..." },
    { id: "ui", label: "Preparing service workbench..." },
  ],
  procurement: [
    { id: "normalizer", label: "Normalizing vendor records..." },
    { id: "spine_schema", label: "Mapping Spine vendor registry..." },
    { id: "spine_traits", label: "Wiring contract and spend traits..." },
    { id: "ui", label: "Preparing procurement workbench..." },
  ],
  it_admin: [
    { id: "normalizer", label: "Normalizing system logs..." },
    { id: "spine_schema", label: "Mapping Spine IT inventory..." },
    { id: "spine_traits", label: "Wiring vulnerability & license traits..." },
    { id: "ui", label: "Preparing admin workbench..." },
  ],
  student_teacher: [
    { id: "normalizer", label: "Normalizing grade & attendance data..." },
    { id: "spine_schema", label: "Mapping Spine student records..." },
    { id: "spine_traits", label: "Wiring progress & intervention traits..." },
    { id: "ui", label: "Preparing classroom workbench..." },
  ],
  bizops: [
    { id: "normalizer", label: "Normalizing project datasets..." },
    { id: "spine_schema", label: "Mapping Spine project graph..." },
    { id: "spine_traits", label: "Wiring OKR & KPI traits..." },
    { id: "ui", label: "Preparing BizOps workbench..." },
  ],
  personal: [
    { id: "normalizer", label: "Normalizing personal logs..." },
    { id: "spine_schema", label: "Mapping Spine task schemas..." },
    { id: "spine_traits", label: "Wiring daily reflection traits..." },
    { id: "ui", label: "Preparing personal workbench..." },
  ],
};
