import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, 
  ChevronRight, 
  User,
  Briefcase,
  Building2,
  Database, 
  Target, 
  Users,
  Loader2,
  Sparkles,
  UsersRound,
  Workflow,
  FileText,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { type CTXEnum, type OrgType } from "../spine/types";
import { LogoMark } from "../landing/logo";

interface OnboardingFlowProps {
  onComplete: (data: {
    userName: string;
    role: string;
    activeCtx: CTXEnum;
    connectedApps: string[];
    orgType: OrgType;
    industry: string;
    companySize: string;
    department: string;
    primaryGoal: string;
    workspaceType: string;
  }) => void;
}

const STEPS = [
  { id: "workspace-type", label: "Workspace", icon: Building2 },
  { id: "profile", label: "Profile", icon: Users },
  { id: "goals", label: "Goals", icon: Target },
  { id: "connect", label: "Connect", icon: Database },
];

// Workspace Types (Step 1)
const WORKSPACE_TYPES = [
  { 
    id: "personal", 
    label: "Personal", 
    icon: User,
    description: "For individual use and personal projects",
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
    selectedColor: "bg-purple-100 border-purple-500 ring-4 ring-purple-500/20",
    iconBg: "bg-purple-500",
  },
  { 
    id: "work", 
    label: "Work", 
    icon: Briefcase,
    description: "For team collaboration and work projects",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    selectedColor: "bg-blue-100 border-blue-500 ring-4 ring-blue-500/20",
    iconBg: "bg-blue-500",
  },
  { 
    id: "business", 
    title: "Business",
    icon: Building2,
    description: "For enterprise-wide deployment and governance",
    color: "bg-[#4256AB]/5 border-[#4256AB]/20 hover:border-[#4256AB]/40",
    selectedColor: "bg-[#4256AB]/10 border-[#4256AB] ring-4 ring-[#4256AB]/20",
    iconBg: "bg-[#4256AB]",
  },
];

// Industry options (Step 2)
const INDUSTRIES = [
  "Technology / SaaS",
  "Professional Services",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Automotive / Mobility",
  "Retail / E-commerce",
  "Financial Services",
  "Logistics / Supply Chain",
  "Media / Entertainment",
  "Government / Public Sector",
  "Other",
];

// Department options (Step 2)
const DEPARTMENTS = [
  { group: "Revenue & Growth", items: ["Sales", "Marketing", "RevOps", "Customer Success"] },
  { group: "Technology", items: ["Engineering", "Product Management", "IT/Technology"] },
  { group: "Operations", items: ["Operations", "Supply Chain", "Service Operations", "Project Management"] },
  { group: "Corporate", items: ["Finance/Accounting", "HR/People", "Legal"] },
];

// Company size options (Step 2)
const COMPANY_SIZES = [
  "Just me",
  "2-10 people",
  "11-50 people",
  "51-200 people",
  "201-500 people",
  "500+ people",
];

// Primary goals (Step 3)
const PRIMARY_GOALS = [
  { id: "organize", label: "Organize knowledge", icon: Database, description: "Centralize scattered information" },
  { id: "insights", label: "Get insights", icon: Sparkles, description: "Analyze data across tools" },
  { id: "context", label: "Track context", icon: Target, description: "Maintain project continuity" },
  { id: "team", label: "Improve team collaboration", icon: UsersRound, description: "Enhance teamwork" },
  { id: "automate", label: "Automate workflows", icon: Workflow, description: "Reduce manual tasks" },
  { id: "docs", label: "Document processes", icon: FileText, description: "Build knowledge base" },
];

// ─── Ingress Taxonomy — Step 4 connectors ────────────────────────────────────
// Organised by connection method, not data type.
// One MCP server or AI Provider gives indirect access to many systems.

type ConnectorGroup = {
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  required?: boolean;
  items: { id: string; name: string; icon: string; note?: string }[];
};

const CONNECTORS: Record<string, ConnectorGroup> = {
  core: {
    label: "Continuity Bridge",
    badge: "Required",
    badgeColor: "#10B981",
    description: "Your canonical truth layer — Spine, Memory, Twin, Governance. Every tenant must connect this first.",
    required: true,
    items: [
      { id: "continuity-bridge", name: "Continuity Bridge", icon: "🔗", note: "Spine · Memory · Twin · Governance" },
    ],
  },
  nango: {
    label: "Direct Connectors",
    badge: "Nango OAuth",
    badgeColor: "#4256AB",
    description: "Native OAuth connections via Nango. Connect once — Spine normalises everything into canonical entities.",
    items: [
      { id: "hubspot",     name: "HubSpot",      icon: "🧡", note: "CRM" },
      { id: "salesforce",  name: "Salesforce",   icon: "☁️", note: "CRM" },
      { id: "slack",       name: "Slack",         icon: "💬", note: "Comms" },
      { id: "zendesk",     name: "Zendesk",       icon: "🎧", note: "Support" },
      { id: "jira",        name: "Jira",          icon: "🔵", note: "Projects" },
      { id: "stripe",      name: "Stripe",        icon: "💳", note: "Billing" },
      { id: "gmail",       name: "Gmail",         icon: "📧", note: "Email" },
      { id: "notion",      name: "Notion",        icon: "📝", note: "Docs" },
      { id: "gdrive",      name: "Google Drive",  icon: "📂", note: "Files" },
      { id: "linear",      name: "Linear",        icon: "🟣", note: "Projects" },
      { id: "github",      name: "GitHub",        icon: "🐙", note: "Code" },
      { id: "ms-teams",    name: "Teams",         icon: "🟦", note: "Comms" },
    ],
  },
  mcp: {
    label: "MCP Servers",
    badge: "MCP Protocol",
    badgeColor: "#7B5EA7",
    description: "One MCP server gives indirect access to many downstream systems through a single protocol endpoint.",
    items: [
      { id: "mcp-github",  name: "GitHub MCP",       icon: "🐙", note: "Repos · PRs · Issues" },
      { id: "mcp-notion",  name: "Notion MCP",       icon: "📝", note: "Pages · Databases" },
      { id: "mcp-linear",  name: "Linear MCP",       icon: "🟣", note: "Issues · Cycles" },
      { id: "mcp-brave",   name: "Brave Search MCP", icon: "🦁", note: "Web search" },
      { id: "mcp-custom",  name: "Custom MCP Server",icon: "🔌", note: "Your own endpoint" },
    ],
  },
  ai: {
    label: "AI Providers",
    badge: "AI Provider",
    badgeColor: "#D46780",
    description: "Reasoning engines routed by Twin. Connecting a provider gives Twin access to that model for orchestration.",
    items: [
      { id: "iw-pro",    name: "IW Pro",          icon: "✦",  note: "Native · Spine-grounded" },
      { id: "anthropic", name: "Anthropic",        icon: "𝐀",  note: "Claude 3.7 Sonnet" },
      { id: "openai",    name: "OpenAI",           icon: "⬡",  note: "GPT-4o" },
      { id: "google",    name: "Google",           icon: "✨", note: "Gemini 2.0 Flash" },
      { id: "openrouter",name: "OpenRouter",       icon: "⟳",  note: "Multi-model routing" },
    ],
  },
  api: {
    label: "API / Custom",
    badge: "API",
    badgeColor: "#D4883E",
    description: "Universal connectivity. Any system with an API can be connected — REST, GraphQL, Webhooks.",
    items: [
      { id: "rest",    name: "REST API",   icon: "🔌", note: "Any REST endpoint" },
      { id: "graphql", name: "GraphQL",   icon: "◈",  note: "Typed queries" },
      { id: "webhook", name: "Webhooks",  icon: "⚡", note: "Inbound events" },
      { id: "pg",      name: "PostgreSQL",icon: "🐘", note: "Direct DB" },
    ],
  },
};

// ─── ConnectorStep subcomponent ──────────────────────────────────────────────

function ConnectorStep({ connectedApps, onToggle }: { connectedApps: string[]; onToggle: (id: string) => void }) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filters = [
    { id: "all",   label: "All" },
    { id: "nango", label: "Nango" },
    { id: "mcp",   label: "MCP" },
    { id: "ai",    label: "AI Provider" },
    { id: "api",   label: "API" },
  ];

  const visibleGroups = Object.entries(CONNECTORS).filter(([key]) =>
    activeFilter === "all" || key === "core" || key === activeFilter
  );

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.id} onClick={() => setActiveFilter(f.id)}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
            style={{
              background: activeFilter === f.id ? "#4256AB" : "rgba(66,86,171,0.08)",
              color: activeFilter === f.id ? "white" : "#4256AB",
              border: "1px solid rgba(66,86,171,0.2)",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Connector groups */}
      <div className="space-y-5">
        {visibleGroups.map(([key, group]) => {
          const isRequired = !!group.required;
          return (
            <div key={key} className="space-y-2.5">
              {/* Group header */}
              <div className="flex items-center gap-2.5">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-white"
                  style={{ background: group.badgeColor }}>
                  {group.badge}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-[#102A43]">{group.label}</span>
                  <span className="text-[10px] text-[#64748B] ml-2">{group.description}</span>
                </div>
              </div>

              {/* Items */}
              {isRequired ? (
                // Bridge — full-width locked card
                <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 text-[#1E293B]"
                  style={{ borderColor: "#10B981", background: "rgba(16,185,129,0.05)" }}>
                  <span className="text-2xl">{group.items[0].icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{group.items[0].name}</div>
                    <div className="text-[10px] text-[#64748B]">{group.items[0].note}</div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#10B981" }} />
                </div>
              ) : (
                // Selectable grid
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {group.items.map(conn => {
                    const selected = connectedApps.includes(conn.id);
                    return (
                      <button key={conn.id} onClick={() => onToggle(conn.id)}
                        className="flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all"
                        style={{
                          background: selected ? "#4256AB" : "white",
                          borderColor: selected ? "#4256AB" : "#D8DEE8",
                          color: selected ? "white" : "#1E293B",
                          boxShadow: selected ? "0 4px 12px rgba(66,86,171,0.2)" : "none",
                        }}>
                        <span className="text-lg shrink-0">{conn.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold truncate">{conn.name}</div>
                          {conn.note && (
                            <div className="text-[9px] truncate" style={{ opacity: selected ? 0.7 : 1, color: selected ? "white" : "#64748B" }}>
                              {conn.note}
                            </div>
                          )}
                        </div>
                        {selected && <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  
  // Step 1: Workspace Type
  const [workspaceType, setWorkspaceType] = useState("");
  
  // Step 2: Profile
  const [industry, setIndustry] = useState("");
  const [department, setDepartment] = useState("");
  const [companySize, setCompanySize] = useState("");
  
  // Step 3: Goals
  const [primaryGoal, setPrimaryGoal] = useState("");
  
  // Step 4: Connectors — Bridge is always pre-selected
  const [connectedApps, setConnectedApps] = useState<string[]>(["continuity-bridge"]);
  
  const [isInitializing, setIsInitializing] = useState(false);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsInitializing(true);
    
    // Map to required output format
    let activeCtx: CTXEnum = "CTX_BIZOPS";
    if (department === "Sales") activeCtx = "CTX_SALES";
    else if (department === "Marketing") activeCtx = "CTX_MARKETING";
    else if (department === "Customer Success") activeCtx = "CTX_CS";
    else if (department === "Engineering" || department === "Product Management") activeCtx = "CTX_TECH";
    else if (department === "Project Management") activeCtx = "CTX_PM";
    
    let orgType: OrgType = "PRODUCT";
    if (industry.includes("Services")) orgType = "SERVICES";
    
    setTimeout(() => {
      onComplete({
        userName: "User", // Will be collected from auth
        role: department || "Operations Lead",
        activeCtx,
        connectedApps,
        orgType,
        industry,
        companySize,
        department,
        primaryGoal,
        workspaceType,
      });
    }, 2000);
  };

  const canProceed = () => {
    if (step === 0) return workspaceType !== "";
    if (step === 1) return industry !== "" && department !== "" && companySize !== "";
    if (step === 2) return primaryGoal !== "";
    if (step === 3) return connectedApps.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#1E293B] flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4256AB] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D46780] rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <LogoMark size={100} />
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-12 px-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                i <= step ? "bg-[#4256AB] border-[#4256AB] text-white" : "border-[#D8DEE8] text-[#64748B]"
              }`}>
                {i < step ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
              </div>
              <span className={`text-[9px] uppercase font-bold tracking-widest ${i <= step ? "text-[#4256AB]" : "text-[#B0B8C5]"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Workspace Type */}
          {step === 0 && (
            <motion.div 
              key="step0-workspace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-[#102A43]">Choose your workspace type</h1>
                <p className="text-[#64748B]">Select the type of workspace that best fits your needs.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {WORKSPACE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = workspaceType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setWorkspaceType(type.id)}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        isSelected ? type.selectedColor : type.color
                      }`}
                    >
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className={`w-16 h-16 rounded-2xl ${type.iconBg} flex items-center justify-center`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-[#102A43] mb-1">{type.label}</h3>
                          <p className="text-xs text-[#64748B]">{type.description}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[#4256AB]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 1: Industry, Department, Company Size */}
          {step === 1 && (
            <motion.div 
              key="step1-profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-[#102A43]">Tell us about your organization</h1>
                <p className="text-[#64748B]">This helps us configure the right data models and workflows.</p>
              </div>
              
              <div className="space-y-4">
                {/* Industry */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Industry</Label>
                  <select 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-[#D8DEE8] bg-white text-[#1E293B] focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Department</Label>
                  <select 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-[#D8DEE8] bg-white text-[#1E293B] focus:border-[#4256AB] focus:ring-2 focus:ring-[#4256AB]/20 outline-none transition-all"
                  >
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.items.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Company Size */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Company Size</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {COMPANY_SIZES.map(size => (
                      <button
                        key={size}
                        onClick={() => setCompanySize(size)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          companySize === size
                            ? "bg-[#4256AB] border-[#4256AB] text-white"
                            : "bg-white border-[#D8DEE8] text-[#1E293B] hover:border-[#4256AB]/40"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Goals and Workspace Preferences */}
          {step === 2 && (
            <motion.div 
              key="step2-goals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-[#102A43]">What's your primary goal?</h1>
                <p className="text-[#64748B]">Choose the main reason you're using IntegrateWise.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRIMARY_GOALS.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = primaryGoal === goal.id;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setPrimaryGoal(goal.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        isSelected 
                          ? "bg-[#4256AB]/10 border-[#4256AB] ring-4 ring-[#4256AB]/20" 
                          : "bg-white border-[#D8DEE8] hover:border-[#4256AB]/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-[#4256AB] text-white" : "bg-[#EDF0F5] text-[#64748B]"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[#102A43]">{goal.label}</h3>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4256AB]" />}
                          </div>
                          <p className="text-xs text-[#64748B]">{goal.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Connectors — Ingress Taxonomy */}
          {step === 3 && (
            <motion.div
              key="step3-connect"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tight text-[#102A43]">Connect your data sources</h1>
                <p className="text-[#64748B]">Select tools to integrate. One connection often gives access to many systems through Spine normalisation.</p>
              </div>

              {/* Category filter pills */}
              <ConnectorStep
                connectedApps={connectedApps}
                onToggle={(id) => {
                  if (connectedApps.includes(id)) setConnectedApps(connectedApps.filter(a => a !== id));
                  else setConnectedApps([...connectedApps, id]);
                }}
              />

              {/* Selection summary */}
              {connectedApps.filter(a => a !== "continuity-bridge").length > 0 && (
                <div className="p-3 rounded-xl border" style={{ background: "rgba(66,86,171,0.05)", borderColor: "rgba(66,86,171,0.2)" }}>
                  <p className="text-xs text-[#4256AB]">
                    <strong>{connectedApps.filter(a => a !== "continuity-bridge").length} additional connector{connectedApps.filter(a => a !== "continuity-bridge").length > 1 ? "s" : ""} selected</strong>
                    {" "}+ Continuity Bridge (required). All data enters Spine via the Ingress normalisation pipeline.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex justify-between items-center">
          <button 
            onClick={() => setStep(Math.max(0, step - 1))}
            className={`text-[#64748B] hover:text-[#1E293B] transition-colors font-bold uppercase text-xs tracking-widest ${step === 0 ? "opacity-0 pointer-events-none" : ""}`}
          >
            Back
          </button>
          <Button 
            onClick={handleNext}
            disabled={!canProceed() || isInitializing}
            className="h-14 px-8 rounded-2xl bg-[#D46780] text-white hover:bg-[#C5536C] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold gap-3 shadow-lg shadow-[#D46780]/20"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Initializing Spine...
              </>
            ) : (
              <>
                {step === STEPS.length - 1 ? "Complete Setup" : "Continue"}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}