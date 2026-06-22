import { useState } from "react";
import { MessagesSquare, Search, ChevronRight, Brain, Database, FileText, CheckCircle2, Clock, User, Sparkles, Tag } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  startedAt: string;
  duration: string;
  user: string;
  outcome: string;
  evidenceUsed: { label: string; type: "entity" | "memory" | "signal" | "knowledge" }[];
  memoryRefs: string[];
  entity360Used: string[];
  tags: string[];
  memoryCommitted: boolean;
}

const CONVERSATIONS: Conversation[] = [
  {
    id: "conv-001",
    title: "APAC Renewal Risk Review",
    startedAt: "Today 10:42 AM",
    duration: "18 min",
    user: "Alex Rivera",
    outcome: "Created escalation plan for FinanceFlow. Logged 3 memory commits. HITL proposal created.",
    evidenceUsed: [
      { label: "FinanceFlow Solutions", type: "entity" },
      { label: "Renewal Playbook v3", type: "knowledge" },
      { label: "Q2 Risk Signals", type: "signal" },
      { label: "Champion silence threshold", type: "memory" },
    ],
    memoryRefs: ["APAC renewal baseline", "Renewal Playbook v3", "Champion silence 10d rule"],
    entity360Used: ["FinanceFlow Solutions", "TechServe Asia", "CloudBridge APAC"],
    tags: ["renewal", "cs", "apac", "critical"],
    memoryCommitted: true,
  },
  {
    id: "conv-002",
    title: "Q2 Pipeline Health Check",
    startedAt: "Today 09:00 AM",
    duration: "12 min",
    user: "Alex Rivera",
    outcome: "Coverage at 3.1x vs 4x target. 3 deals flagged for acceleration. Report surfaced to L2 overlay.",
    evidenceUsed: [
      { label: "Salesforce Pipeline", type: "entity" },
      { label: "Q2 forecast baseline", type: "memory" },
      { label: "Pipeline coverage rule", type: "knowledge" },
    ],
    memoryRefs: ["Q2 forecast baseline", "Coverage ratio playbook"],
    entity360Used: ["Acme Corp", "NovaTech APAC", "RetailNest Pte Ltd"],
    tags: ["pipeline", "sales", "q2"],
    memoryCommitted: true,
  },
  {
    id: "conv-003",
    title: "FinanceFlow Recovery Plan",
    startedAt: "Yesterday 3:15 PM",
    duration: "22 min",
    user: "Alex Rivera",
    outcome: "Full 48h action plan drafted. P1 escalation recommended. EBR scheduling initiated. Credit extension proposed.",
    evidenceUsed: [
      { label: "FinanceFlow Solutions", type: "entity" },
      { label: "P1 #4821", type: "signal" },
      { label: "Recovery Motion v2", type: "knowledge" },
      { label: "EBR history Q1 2026", type: "memory" },
    ],
    memoryRefs: ["Recovery Motion v2", "FinanceFlow EBR history", "Credit extension policy"],
    entity360Used: ["FinanceFlow Solutions", "David Park (Contact)"],
    tags: ["recovery", "cs", "financeflow"],
    memoryCommitted: true,
  },
  {
    id: "conv-004",
    title: "HubSpot Schema Drift Review",
    startedAt: "Yesterday 11:30 AM",
    duration: "6 min",
    user: "Alex Rivera",
    outcome: "2 field changes identified. CRM Reconciler agent queued. Schema correction proposed.",
    evidenceUsed: [
      { label: "HubSpot Connector", type: "signal" },
      { label: "Schema AI v1.1.0 draft", type: "knowledge" },
    ],
    memoryRefs: ["Schema drift policy"],
    entity360Used: [],
    tags: ["schema", "hubspot", "drift"],
    memoryCommitted: false,
  },
];

const EVIDENCE_COLORS: Record<string, { bg: string; text: string }> = {
  entity:    { bg: "rgba(66,86,171,0.1)",  text: "var(--iw-blue)" },
  memory:    { bg: "rgba(123,94,167,0.1)", text: "var(--iw-purple)" },
  signal:    { bg: "rgba(212,136,62,0.1)", text: "var(--iw-warning)" },
  knowledge: { bg: "rgba(61,139,110,0.1)", text: "var(--iw-success)" },
};

function ConversationDetail({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} className="text-xs font-semibold mb-1" style={{ color: "var(--iw-blue)" }}>← Back</button>
        <h2 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>{conv.title}</h2>
        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{conv.startedAt} · {conv.duration} · {conv.user}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Outcome */}
        <div className="p-3 rounded-xl" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Outcome</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{conv.outcome}</p>
          {conv.memoryCommitted && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--iw-success)" }} />
              <span className="text-[10px]" style={{ color: "var(--iw-success)", fontWeight: 600 }}>Committed to memory</span>
            </div>
          )}
        </div>

        {/* Evidence used */}
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Evidence Used</p>
          <div className="space-y-1.5">
            {conv.evidenceUsed.map((e, i) => {
              const c = EVIDENCE_COLORS[e.type];
              return (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: c.bg }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.text }} />
                  <span className="text-xs" style={{ color: "var(--foreground)", fontWeight: 500 }}>{e.label}</span>
                  <span className="ml-auto text-[9px] capitalize" style={{ color: c.text, fontWeight: 700 }}>{e.type}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Entity360 */}
        {conv.entity360Used.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Entity360 Used</p>
            <div className="flex flex-wrap gap-1.5">
              {conv.entity360Used.map((e, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "var(--iw-blue-50)", color: "var(--iw-blue)", fontWeight: 600, border: "1px solid rgba(66,86,171,0.2)" }}>
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Memory refs */}
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Memories Referenced</p>
          {conv.memoryRefs.map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <div className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--iw-purple)" }} />
              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{r}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {conv.tags.map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TwinConversations() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);

  if (selected) return <ConversationDetail conv={selected} onBack={() => setSelected(null)} />;

  const filtered = CONVERSATIONS.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.outcome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--card)" }}>
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm mb-0.5" style={{ fontWeight: 700, color: "var(--foreground)" }}>Conversations</h2>
        <p className="text-[10px] mb-3" style={{ color: "var(--muted-foreground)" }}>
          Cognitive conversations — evidence used, memories referenced, outcomes
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
        {filtered.map(conv => (
          <button key={conv.id} onClick={() => setSelected(conv)}
            className="w-full text-left px-4 py-3 transition-all group"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "var(--iw-blue-50)", border: "1px solid rgba(66,86,171,0.15)" }}>
                <MessagesSquare className="w-3.5 h-3.5" style={{ color: "var(--iw-blue)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{conv.title}</p>
                <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>{conv.outcome}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{conv.startedAt} · {conv.duration}</span>
                  <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{conv.evidenceUsed.length} evidence</span>
                  {conv.memoryCommitted && <span className="text-[9px]" style={{ color: "var(--iw-success)", fontWeight: 700 }}>✓ memory</span>}
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 shrink-0 mt-1 transition-opacity" style={{ color: "var(--muted-foreground)" }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
