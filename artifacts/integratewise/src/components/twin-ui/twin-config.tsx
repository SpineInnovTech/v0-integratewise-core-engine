import { useState } from "react";
import { Zap, Bot, Cpu, Wrench, Search, Plus, ToggleLeft, ToggleRight,
  ChevronRight, Circle, CheckCircle2, AlertCircle, Clock, RefreshCw,
  Globe, Code2, Database, Shield, ExternalLink, MoreHorizontal,
  Play, Pause, Settings, Star, ArrowRight, Hash, Sparkles, Loader2 } from "lucide-react";
import { useSpineStatus } from "@/platform/use-spine";

// ─── Shared ───────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count, action }: {
  icon: any; title: string; count?: number; action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-white shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#3F5185]/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[#3F5185]" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        {count !== undefined && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#3F5185]/10 text-[#3F5185]">{count}</span>
        )}
      </div>
      {action && (
        <button onClick={action.onClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3F5185] text-white text-xs font-semibold hover:bg-[#354775] transition-colors shadow-sm">
          <Plus className="w-3 h-3" />
          {action.label}
        </button>
      )}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mx-4 my-3">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-[#3F5185]/40 transition-colors"
      />
    </div>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────

interface Skill {
  id: string; name: string; category: string; description: string;
  enabled: boolean; provider: string; calls: number; lastUsed: string; badge?: string;
}

const SKILLS: Skill[] = [
  { id: "s1", name: "CRM Write-Back", category: "Data Sync", description: "Update CRM records (HubSpot, Salesforce) based on Spine state changes. HITL approval required.", enabled: true, provider: "IntegrateWise", calls: 1240, lastUsed: "2 min ago", badge: "Core" },
  { id: "s2", name: "Slack Notify", category: "Communication", description: "Send targeted Slack messages to specific users or channels based on triggers.", enabled: true, provider: "IntegrateWise", calls: 843, lastUsed: "14 min ago" },
  { id: "s3", name: "Renewal Risk Score", category: "Intelligence", description: "Compute renewal risk score for an account using multi-signal analysis (support, usage, payment, sentiment).", enabled: true, provider: "IntegrateWise", calls: 312, lastUsed: "1h ago", badge: "Core" },
  { id: "s4", name: "Memory Commit", category: "Memory", description: "Persist an observation, decision, or playbook to the Twin Memory store.", enabled: true, provider: "IntegrateWise", calls: 2100, lastUsed: "Just now" },
  { id: "s5", name: "Email Draft", category: "Communication", description: "Draft personalized emails based on account context, tone guidelines, and memory.", enabled: true, provider: "IntegrateWise", calls: 156, lastUsed: "3h ago" },
  { id: "s6", name: "Jira Task Create", category: "Project", description: "Create Jira tickets with correct labels, priority, and assignee based on Spine context.", enabled: false, provider: "Atlassian", calls: 0, lastUsed: "Never" },
  { id: "s7", name: "Stripe Invoice Check", category: "Finance", description: "Query Stripe for invoice status, payment history, and upcoming charges.", enabled: true, provider: "Stripe", calls: 88, lastUsed: "29 min ago" },
  { id: "s8", name: "Meeting Summarize", category: "Intelligence", description: "Summarize meeting transcripts and extract action items, decisions, and entity mentions.", enabled: false, provider: "IntegrateWise", calls: 0, lastUsed: "Never" },
];

const SKILL_CATEGORIES = ["All", "Data Sync", "Communication", "Intelligence", "Memory", "Finance", "Project"];

export function TwinSkills() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [skills, setSkills] = useState(SKILLS);

  const toggle = (id: string) => setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));

  const filtered = skills.filter(s => {
    const matchCat = category === "All" || s.category === category;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white">
      <SectionHeader icon={Zap} title="Skills Registry" count={skills.filter(s => s.enabled).length} action={{ label: "Add Skill", onClick: () => {} }} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search skills..." />

      {/* Category pills */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
        {SKILL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
              category === cat ? "bg-[#3F5185] text-white" : "bg-[#F8F9FA] border border-[#E5E7EB] text-slate-500 hover:border-[#3F5185]/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filtered.map(skill => (
          <div key={skill.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${skill.enabled ? "bg-white border-[#E5E7EB] hover:shadow-sm" : "bg-[#FAFAFA] border-[#E5E7EB] opacity-70"}`}>
            <div className="w-9 h-9 rounded-xl bg-[#3F5185]/10 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-[#3F5185]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-slate-800">{skill.name}</span>
                {skill.badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#D46780]/10 text-[#D46780]">{skill.badge}</span>}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-slate-400">{skill.category}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{skill.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                <span>{skill.provider}</span>
                <span>·</span>
                <span>{skill.calls.toLocaleString()} calls</span>
                <span>·</span>
                <span>Last: {skill.lastUsed}</span>
              </div>
            </div>
            <button onClick={() => toggle(skill.id)} className="shrink-0 mt-0.5">
              {skill.enabled
                ? <ToggleRight className="w-6 h-6 text-[#10B981]" />
                : <ToggleLeft className="w-6 h-6 text-slate-300" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Agents ───────────────────────────────────────────────────────────────────

interface Agent {
  id: string; name: string; role: string; status: "active" | "idle" | "paused";
  lastRun: string; runs: number; skills: string[]; model: string; description: string;
}

const AGENTS: Agent[] = [
  {
    id: "a1", name: "Renewal Watchdog", role: "Risk Detection", status: "active",
    lastRun: "2 min ago", runs: 842, model: "IW Pro",
    skills: ["Renewal Risk Score", "Slack Notify", "Memory Commit"],
    description: "Twin invokes this path when: renewal risk score > 75 OR champion silent > 10 days. Twin reads Spine signals, computes risk, proposes HITL action. Does not execute without approval.",
  },
  {
    id: "a2", name: "CRM Reconciler", role: "Data Integrity", status: "active",
    lastRun: "14 min ago", runs: 3201, model: "IW Pro",
    skills: ["CRM Write-Back", "Memory Commit"],
    description: "Twin invokes this path on a schedule and when Spine detects field drift. Twin proposes corrections — low-risk auto-approved per policy, high-value sent to governance queue.",
  },
  {
    id: "a3", name: "Meeting Debriefer", role: "Post-Meeting", status: "idle",
    lastRun: "3h ago", runs: 127, model: "Claude 3.7 Sonnet",
    skills: ["Meeting Summarize", "Memory Commit", "Jira Task Create"],
    description: "Twin invokes this path after a meeting is detected. Twin extracts action items, drafts summary, creates Jira tasks. All outputs reviewed before commit.",
  },
  {
    id: "a4", name: "Pipeline Scout", role: "Sales Intelligence", status: "paused",
    lastRun: "1 day ago", runs: 56, model: "GPT-4o",
    skills: ["CRM Write-Back", "Email Draft"],
    description: "Twin invokes this path on daily schedule. Twin analyses pipeline health, flags at-risk deals, drafts outreach. Currently paused — Twin will not invoke until resumed.",
  },
];

const STATUS_CONFIG = {
  active: { color: "text-[#10B981]", bg: "bg-[#10B981]/10", dot: "bg-[#10B981]", label: "Active" },
  idle:   { color: "text-slate-500", bg: "bg-slate-100",     dot: "bg-slate-400",  label: "Idle" },
  paused: { color: "text-[#D46780]", bg: "bg-[#D46780]/10", dot: "bg-[#D46780]",  label: "Paused" },
};

export function TwinAgents() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>("a1");

  const filtered = AGENTS.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));
  const active = AGENTS.find(a => a.id === selected);

  return (
    <div className="flex h-full" style={{ background: "var(--card)" }}>
      {/* Path list */}
      <div className="w-72 shrink-0 flex flex-col border-r" style={{ borderColor: "var(--border)" }}>
        {/* Header — Twin orchestrates, not agents */}
        <div className="px-4 pt-4 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--iw-pink)" }} />
            <span className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>Twin Execution Paths</span>
          </div>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            Twin orchestrates these paths. They don't run autonomously — Twin invokes them deliberately.
          </p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search paths..." />
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 pt-2">
          {filtered.map(agent => {
            const s = STATUS_CONFIG[agent.status];
            return (
              <button key={agent.id} onClick={() => setSelected(agent.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${selected === agent.id ? "border-[#3F5185]/20" : "border-[#E5E7EB] hover:shadow-sm"}`}
                style={{ background: selected === agent.id ? "var(--iw-blue-50)" : "var(--card)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--iw-blue), var(--iw-blue-light))" }}>
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px]" style={{ fontWeight: 600, color: "var(--foreground)" }}>{agent.name}</div>
                    <div className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{agent.role}</div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${s.bg}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${agent.status === "active" ? "animate-pulse" : ""}`} />
                    <span className={`text-[9px] font-semibold ${s.color}`}>{s.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                  <span>Twin invoked {agent.runs.toLocaleString()}×</span>
                  <span>·</span>
                  <span>Last: {agent.lastRun}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Path Detail */}
      {active ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Twin → path header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--iw-blue), var(--iw-blue-light))" }}>
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>{active.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3 h-3" style={{ color: "var(--iw-pink)" }} />
                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    Orchestrated by Twin · {active.role} · {active.model}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {active.status === "paused" ? (
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs transition-colors"
                  style={{ background: "var(--iw-success)", fontWeight: 600 }}>
                  <Play className="w-3 h-3" /> Enable for Twin
                </button>
              ) : (
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--secondary)", fontWeight: 600 }}>
                  <Pause className="w-3 h-3" /> Suspend
                </button>
              )}
              <button className="p-2 rounded-lg transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--secondary)" }}>
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* When Twin invokes */}
          <div className="px-4 py-3 rounded-xl" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
              When Twin invokes this path
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{active.description}</p>
          </div>

          {/* Orchestration chain */}
          <div>
            <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
              Orchestration chain
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Twin */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{ background: "linear-gradient(135deg, var(--iw-blue), var(--iw-blue-light))", color: "white" }}>
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px]" style={{ fontWeight: 700 }}>Twin</span>
              </div>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>→</span>
              {/* Path */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                <Bot className="w-3.5 h-3.5" style={{ color: "var(--iw-blue)" }} />
                <span className="text-[10px]" style={{ fontWeight: 600, color: "var(--foreground)" }}>{active.name}</span>
              </div>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>→</span>
              {/* Skills */}
              {active.skills.map((skill, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl"
                    style={{ background: "rgba(61,139,110,0.1)", border: "1px solid rgba(61,139,110,0.2)" }}>
                    <Zap className="w-3 h-3" style={{ color: "var(--iw-success)" }} />
                    <span className="text-[9px]" style={{ fontWeight: 600, color: "var(--iw-success)" }}>{skill}</span>
                  </div>
                  {i < active.skills.length - 1 && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Twin invocations", value: active.runs.toLocaleString() },
              { label: "Path status",      value: STATUS_CONFIG[active.status].label },
              { label: "Last invoked",     value: active.lastRun },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ border: "1px solid var(--border)", background: "var(--secondary)" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{s.label}</div>
                <div className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Doctrine note */}
          <div className="px-4 py-3 rounded-xl" style={{ background: "var(--iw-blue-900)" }}>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>Twin is the only actor.</span>{" "}
              This path has no autonomy. Twin decides when to invoke it based on signal conditions, memory context, and active goals.
              All outputs pass through governance before any external action executes.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
          <div className="text-center">
            <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a path to configure</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Models ───────────────────────────────────────────────────────────────────

interface ModelDef {
  id: string; name: string; provider: string; contextK: number;
  speed: "Fast" | "Medium" | "Slow"; cost: "Low" | "Medium" | "High";
  active: boolean; badge?: string; description: string; strengths: string[];
}

const MODELS: ModelDef[] = [
  { id: "iw-pro", name: "IW Pro", provider: "IntegrateWise", contextK: 200, speed: "Fast", cost: "Low", active: true, badge: "Default", description: "Spine-grounded model with built-in memory access and goal anchoring. Best for all IntegrateWise tasks.", strengths: ["Spine data access", "Memory continuity", "Goal-anchored", "HITL integration"] },
  { id: "claude-3-7", name: "Claude 3.7 Sonnet", provider: "Anthropic", contextK: 200, speed: "Medium", cost: "Medium", active: true, description: "Excellent reasoning and instruction-following. Best for complex analysis and document generation.", strengths: ["Deep reasoning", "Long documents", "Coding", "Nuanced analysis"] },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", contextK: 128, speed: "Fast", cost: "Medium", active: true, description: "Versatile and fast. Good for structured tasks and data extraction.", strengths: ["Speed", "JSON mode", "Tool use", "Multimodal"] },
  { id: "gemini-2-flash", name: "Gemini 2.0 Flash", provider: "Google", contextK: 1000, speed: "Fast", cost: "Low", active: false, description: "Extremely fast and cheap. Good for high-volume lightweight tasks.", strengths: ["1M context", "Speed", "Multimodal", "Cost-effective"] },
  { id: "claude-opus", name: "Claude Opus 4.8", provider: "Anthropic", contextK: 200, speed: "Slow", cost: "High", active: false, description: "Maximum capability for the hardest tasks. Use sparingly for high-stakes decisions.", strengths: ["Maximum reasoning", "Research", "Complex plans", "Strategy"] },
];

const SPEED_COLOR = { Fast: "text-[#10B981]", Medium: "text-[#D46780]", Slow: "text-slate-500" };
const COST_COLOR  = { Low: "text-[#10B981]", Medium: "text-amber-500", High: "text-red-500" };

export function TwinModels() {
  const [models, setModels] = useState(MODELS);
  const [selected, setSelected] = useState<string | null>("iw-pro");

  const toggle = (id: string) => setModels(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  const active = models.find(m => m.id === selected);

  return (
    <div className="flex h-full bg-white">
      {/* List */}
      <div className="w-72 shrink-0 flex flex-col border-r border-[#E5E7EB]">
        <SectionHeader icon={Cpu} title="Models" count={models.filter(m => m.active).length} />
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => setSelected(model.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${selected === model.id ? "bg-[#3F5185]/5 border-[#3F5185]/20" : "bg-white border-[#E5E7EB] hover:shadow-sm"}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[10px] font-bold text-[#3F5185] shrink-0">
                  {model.provider.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-800 truncate">{model.name}</span>
                    {model.badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#D46780]/10 text-[#D46780]">{model.badge}</span>}
                  </div>
                  <div className="text-[9px] text-slate-400">{model.provider}</div>
                </div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${model.active ? "bg-[#10B981]" : "bg-slate-300"}`} />
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className={SPEED_COLOR[model.speed]}>{model.speed}</span>
                <span className="text-slate-300">·</span>
                <span className={COST_COLOR[model.cost]}>{model.cost} cost</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">{model.contextK}K ctx</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Model Detail */}
      {active && (
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F8F9FA] border-2 border-[#E5E7EB] flex items-center justify-center text-lg font-bold text-[#3F5185]">
                {active.provider.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{active.name}</h2>
                  {active.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D46780]/10 text-[#D46780]">{active.badge}</span>}
                </div>
                <p className="text-xs text-slate-500">{active.provider}</p>
              </div>
            </div>
            <button
              onClick={() => toggle(active.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                active.active
                  ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                  : "bg-[#10B981]/10 border-[#10B981]/20 text-[#059669] hover:bg-[#10B981]/20"
              }`}
            >
              {active.active ? "Disable" : "Enable"}
            </button>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed bg-[#F8F9FA] rounded-xl p-4 border border-[#E5E7EB]">{active.description}</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Context</div>
              <div className="text-xl font-bold text-[#3F5185]">{active.contextK}K</div>
            </div>
            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Speed</div>
              <div className={`text-sm font-bold ${SPEED_COLOR[active.speed]}`}>{active.speed}</div>
            </div>
            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Cost</div>
              <div className={`text-sm font-bold ${COST_COLOR[active.cost]}`}>{active.cost}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Strengths</h3>
            <div className="flex flex-wrap gap-2">
              {active.strengths.map(s => (
                <span key={s} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#3F5185]/8 text-[#3F5185] border border-[#3F5185]/15 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tools (MCP Registry) ─────────────────────────────────────────────────────

// Honest, real Spine MCP tools — fetched through the relay (/api/spine/*), which
// mints the platform credential server-side. No fabricated metrics: each tool
// shows its real name, description, input schema, and whether it is read-only or
// a governed (write) tool that must run through HITL.

const TOOL_GROUPS: Record<string, { label: string; color: string }> = {
  spine:    { label: "Spine Entities", color: "#4256AB" },
  memory:   { label: "Memory",         color: "#7C3AED" },
  kb:       { label: "Knowledge Bank", color: "#0EA5E9" },
  signal:   { label: "Signals",        color: "#D46780" },
  proposal: { label: "Governance",     color: "#D97706" },
  search:   { label: "Search",         color: "#059669" },
};

function toolGroup(name: string): { label: string; color: string } {
  const prefix = name.split(".")[0] ?? "";
  return TOOL_GROUPS[prefix] ?? { label: "Spine", color: "#4256AB" };
}

export function TwinTools() {
  const { data, isLoading, error, refetch, isFetching } = useSpineStatus();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const tools = data?.tools ?? [];
  const filtered = tools.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );
  const active = tools.find((t) => t.name === selected) ?? filtered[0] ?? null;

  return (
    <div className="flex h-full bg-white">
      {/* List */}
      <div className="w-80 shrink-0 flex flex-col border-r border-[#E5E7EB]">
        <SectionHeader
          icon={Wrench}
          title="MCP Tool Registry"
          count={data?.connected ? tools.length : undefined}
        />

        {/* Honest connection banner */}
        <div
          className="mx-4 mt-3 mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-semibold"
          style={{
            background: data?.connected
              ? "rgba(16,185,129,0.08)"
              : !isLoading
                ? "rgba(190,18,60,0.07)"
                : "#f1f5f9",
            color: data?.connected ? "#059669" : !isLoading ? "#be123c" : "#475569",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
          {isLoading
            ? "Connecting to Spine…"
            : data?.connected
              ? `Live · ${data.tenantId}`
              : "Spine unavailable"}
          <button
            onClick={() => refetch()}
            className="ml-auto opacity-70 hover:opacity-100"
            title="Recheck"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search tools..." />
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
          {filtered.map((tool) => {
            const g = toolGroup(tool.name);
            return (
              <button
                key={tool.name}
                onClick={() => setSelected(tool.name)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${active?.name === tool.name ? "bg-[#3F5185]/5 border-[#3F5185]/20" : "bg-white border-[#E5E7EB] hover:shadow-sm"}`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                    style={{ background: g.color }}
                  >
                    {g.label.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 truncate font-mono">{tool.name}</span>
                  <span
                    className={`ml-auto shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${tool.access === "read" ? "bg-[#10B981]/10 text-[#059669]" : "bg-amber-100 text-amber-700"}`}
                  >
                    {tool.access === "read" ? "READ" : "GOVERNED"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1">{tool.description}</p>
              </button>
            );
          })}

          {!isLoading && filtered.length === 0 && (
            <div className="px-3 py-10 text-center text-[11px] text-slate-400">
              {data?.connected
                ? "No tools match your search."
                : error instanceof Error
                  ? error.message
                  : "Spine is not reachable right now."}
            </div>
          )}
        </div>
      </div>

      {/* Tool Detail */}
      {active ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: toolGroup(active.name).color }}
                >
                  {toolGroup(active.name).label}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active.access === "read" ? "bg-[#10B981]/10 text-[#059669]" : "bg-amber-100 text-amber-700"}`}
                >
                  {active.access === "read" ? "Read-only" : "Governed (HITL)"}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 font-mono">{active.name}</h2>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed bg-[#F8F9FA] rounded-xl p-4 border border-[#E5E7EB]">
            {active.description || "No description provided."}
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Access</div>
              <div className={`text-sm font-bold ${active.access === "read" ? "text-[#10B981]" : "text-amber-600"}`}>
                {active.access === "read" ? "Read-only" : "Governed"}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Group</div>
              <div className="text-sm font-bold text-slate-700">{toolGroup(active.name).label}</div>
            </div>
            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Tenant</div>
              <div className="text-sm font-bold text-slate-700">{data?.tenantId ?? "—"}</div>
            </div>
          </div>

          {active.inputSchema != null && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Input Schema</h3>
              <pre className="bg-[#1E2A4A] text-[#10B981] text-xs p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">
                {JSON.stringify(active.inputSchema, null, 2)}
              </pre>
            </div>
          )}

          <div className="p-4 rounded-xl bg-[#3F5185]/5 border border-[#3F5185]/15">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-3.5 h-3.5 text-[#3F5185]" />
              <span className="text-xs font-bold text-[#3F5185]">MCP Endpoint</span>
            </div>
            <code className="text-xs font-mono text-slate-600 break-all">
              {`${data?.endpoint ?? "https://mcp.integratewise.ai"}/mcp · tools/call · ${active.name}`}
            </code>
            <p className="mt-2 text-[10px] text-slate-400 leading-snug">
              {active.access === "read"
                ? "Callable read-only through the relay at /api/spine/call. The platform credential is minted server-side; it never reaches the browser."
                : "This tool mutates platform state and is blocked from direct relay calls — it must run through governance (HITL approval)."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
          <div className="text-center">
            {isLoading ? (
              <>
                <Loader2 className="w-10 h-10 mx-auto mb-3 opacity-30 animate-spin" />
                <p className="text-sm">Connecting to the Spine…</p>
              </>
            ) : (
              <>
                <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{data?.connected ? "Select a tool" : "Spine is not reachable"}</p>
                {!data?.connected && (
                  <p className="mt-1 text-xs opacity-70">
                    {data?.detail ?? (error instanceof Error ? error.message : "")}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
