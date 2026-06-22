/**
 * Schema AI Synthesis — the async pipeline that makes projections polymorphic
 *
 * Architecture:
 *   Connector → Intake → D1 write → intelligence-events Queue → Schema AI Worker
 *   → Entity mapping → Projection unlock → UI hydrates progressively
 *
 * The pipeline is async on purpose:
 *   - Zero drag on intake (D1 write completes before queue push lands)
 *   - Schema AI batches entity types across connectors
 *   - Projections unlock progressively
 *   - A slow model run never blocks a Stripe webhook
 *
 * No mock data. Data hydrates from Spine when connectors are wired.
 */

import { Brain, Zap, ArrowRight, Layers, GitBranch, Activity, RefreshCw, Plug } from "lucide-react";

// ─── Pipeline stages — architectural, not data ────────────────────────────────

const PIPELINE_STAGES = [
  { label: "Connector",  icon: GitBranch, desc: "Nango OAuth, MCP, API"          },
  { label: "Intake",     icon: Zap,       desc: "CF Worker → D1 write"           },
  { label: "Queue",      icon: Activity,  desc: "intelligence-events → CF Queue" },
  { label: "Schema AI",  icon: Brain,     desc: "Workers AI · async synthesis"   },
  { label: "Projection", icon: Layers,    desc: "KV cache → UI hydration"        },
];

// ─── SchemaAiSynthesis ────────────────────────────────────────────────────────

export function SchemaAiSynthesis() {
  return (
    <div className="h-full overflow-y-auto p-6">

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4" style={{ color: "var(--iw-purple)" }} />
          <h1 className="text-lg" style={{ fontWeight: 700, color: "var(--foreground)" }}>Schema AI Synthesis</h1>
        </div>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Async pipeline — connector data enters, Schema AI maps entities, projections unlock per role × dept × industry
        </p>
      </div>

      {/* Async architecture callout */}
      <div className="rounded-xl p-4 mb-5"
        style={{ background: "var(--iw-purple-light)", border: "1px solid rgba(123,94,167,0.2)" }}>
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--iw-purple)" }} />
          <div>
            <p className="text-xs mb-1" style={{ fontWeight: 700, color: "var(--iw-purple)" }}>
              Async synthesis — zero intake drag
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--foreground)" }}>
              D1 writes commit before the queue push lands. Schema AI runs in a dedicated Worker,
              consuming from <span className="font-mono text-[10px]">intelligence-events</span> queue.
              A slow model run never blocks a Stripe webhook or a Salesforce sync.
              Projections hydrate progressively as jobs complete.
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline diagram — always visible, architectural */}
      <div className="rounded-xl p-5 mb-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-[9px] uppercase tracking-widest mb-4"
          style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Synthesis pipeline</p>
        <div className="flex items-start gap-2 flex-wrap">
          {PIPELINE_STAGES.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <div key={stage.label} className="flex items-start gap-2">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1"
                    style={{ background: "var(--secondary)" }}>
                    <Icon className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  </div>
                  <p className="text-[10px]" style={{ fontWeight: 600, color: "var(--foreground)" }}>{stage.label}</p>
                  <p className="text-[8px]" style={{ color: "var(--muted-foreground)" }}>{stage.desc}</p>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-3" style={{ color: "var(--muted-foreground)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* resolveSpineSchema explanation */}
      <div className="rounded-xl p-4 mb-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-[9px] uppercase tracking-widest mb-3"
          style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>How resolveSpineSchema works</p>
        <div className="space-y-3">
          {[
            {
              n: 1, color: "var(--iw-blue)",
              title: "One unified entity store — no vertical SaaS copies",
              body: "Every connector writes to the same D1 entity graph. An Account in Salesforce and a Company in HubSpot resolve to the same entity after Schema AI deduplication.",
            },
            {
              n: 2, color: "var(--iw-purple)",
              title: "resolveSpineSchema — the digital prism",
              body: "Given role × department × industry, it returns the projection schema — which fields matter, which modules to surface, which Twin reads to activate. CSM and Engineer see the same account; they see different fields.",
            },
            {
              n: 3, color: "var(--iw-success)",
              title: "Schema AI: no manual mapping required",
              body: "Schema AI reads the raw connector schema, maps entities to the unified graph, and generates projection rules — automatically. A new connector = new projections unlock, no code change.",
            },
          ].map(item => (
            <div key={item.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white"
                style={{ background: item.color }}>{item.n}</div>
              <div>
                <p className="text-xs mb-0.5" style={{ fontWeight: 600, color: "var(--foreground)" }}>{item.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Jobs — empty state */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-[9px] uppercase tracking-widest mb-3"
          style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
          Synthesis jobs · <span className="font-mono">intelligence-events</span> queue
        </p>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "var(--secondary)" }}>
            <Activity className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          </div>
          <p className="text-xs mb-1" style={{ fontWeight: 600, color: "var(--foreground)" }}>No synthesis jobs</p>
          <p className="text-[11px] max-w-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Jobs appear here as connectors are added. Each job maps entity types and unlocks role projections.
          </p>
        </div>
      </div>

      {/* Projections — empty state */}
      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-[9px] uppercase tracking-widest mb-3"
          style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
          Role projections · role × dept × industry
        </p>

        {/* Column header */}
        <div className="grid grid-cols-4 gap-2 px-2 pb-2 mb-2"
          style={{ borderBottom: "1px solid var(--border)" }}>
          {["Role", "Status", "Schema health", "Unlocked by"].map(h => (
            <p key={h} className="text-[9px] uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{h}</p>
          ))}
        </div>

        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "var(--secondary)" }}>
            <Plug className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          </div>
          <p className="text-xs mb-1" style={{ fontWeight: 600, color: "var(--foreground)" }}>
            All projections are shells
          </p>
          <p className="text-[11px] max-w-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Projections unlock when Schema AI completes synthesis for each connector. Connect a CRM to activate Sales, CS, and BizOps projections. Connect a support tool to activate Support.
          </p>
        </div>
      </div>
    </div>
  );
}
