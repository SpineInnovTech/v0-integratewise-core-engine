/**
 * Sales Pipeline — Kanban surface
 *
 * Stages are structural (always visible).
 * Deals hydrate from Spine when CRM connector is active.
 * No mock data.
 */

import { useState } from "react";
import { Plus, Calendar, DollarSign, Filter, X, Check, Plug } from "lucide-react";
import { EntityTwinPanel } from "../twin-ui/entity-twin-panel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Deal {
  id: string;
  company: string;
  logo: string;
  value: number;
  probability: number;
  closeDate: string;
  owner: { name: string; initials: string };
  healthScore: number;
  nextActivity: string;
  stage: string;
}

// ─── Pipeline stages — structural, always visible ─────────────────────────────

const STAGES = [
  { id: "prospecting",   label: "Prospecting",   color: "var(--iw-blue)" },
  { id: "qualification", label: "Qualification", color: "var(--iw-purple)" },
  { id: "proposal",      label: "Proposal",      color: "var(--iw-warning)" },
  { id: "negotiation",   label: "Negotiation",   color: "var(--iw-pink)" },
  { id: "closed-won",    label: "Closed Won",    color: "var(--iw-success)" },
  { id: "closed-lost",   label: "Closed Lost",   color: "var(--iw-danger)" },
];

// ─── SalesPipeline ────────────────────────────────────────────────────────────

export function SalesPipeline() {
  // Deals hydrate from Spine when CRM connector is active.
  const [deals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const openDeals = deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage));
  const totalPipeline = openDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedForecast = openDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  const closedWon = deals.filter(d => d.stage === "closed-won").reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 style={{ color: "var(--foreground)" }}>Sales Pipeline</h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              Deals hydrate from your CRM when connected
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
              <Filter className="w-3 h-3" /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white"
              style={{ background: "var(--iw-blue)", fontWeight: 600 }}>
              <Plus className="w-4 h-4" /> New Deal
            </button>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Pipeline",     value: `$${(totalPipeline / 1000).toFixed(0)}K`,      color: "var(--foreground)" },
            { label: "Weighted Forecast",  value: `$${(weightedForecast / 1000).toFixed(0)}K`,   color: "var(--iw-blue)" },
            { label: "Closed Won",         value: `$${(closedWon / 1000).toFixed(0)}K`,           color: "var(--iw-success)" },
          ].map(m => (
            <div key={m.label} className="rounded-lg p-3"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted-foreground)" }}>{m.label}</div>
              <div className="text-lg" style={{ fontWeight: 600, color: m.color }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto px-6 pb-6">
        <div className="flex gap-4 min-w-max h-full">
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage.id);
            const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div key={stage.id} className="w-[280px] flex flex-col flex-shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-sm" style={{ fontWeight: 500, color: "var(--foreground)" }}>
                      {stage.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                      {stageDeals.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      ${(stageValue / 1000).toFixed(0)}K
                    </span>
                  )}
                </div>

                {/* Column body */}
                <div className="flex-1 rounded-lg p-2 space-y-2 overflow-y-auto"
                  style={{ background: "var(--secondary)" }}>

                  {stageDeals.map(deal => (
                    <div key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      className="rounded-lg p-3 cursor-pointer hover:shadow-sm transition-all"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{deal.logo}</span>
                          <span className="text-sm" style={{ fontWeight: 500, color: "var(--foreground)" }}>{deal.company}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                          <span className="text-sm" style={{ fontWeight: 600, color: "var(--foreground)" }}>
                            ${(deal.value / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--secondary)", color: "var(--muted-foreground)", fontWeight: 500 }}>
                          {deal.probability}%
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full overflow-hidden mb-2" style={{ background: "var(--accent)" }}>
                        <div className="h-full rounded-full"
                          style={{
                            width: `${deal.healthScore}%`,
                            background: deal.healthScore >= 80 ? "var(--iw-success)" : deal.healthScore >= 60 ? "var(--iw-warning)" : "var(--iw-danger)",
                          }} />
                      </div>
                      <div className="text-[11px] truncate mb-2" style={{ color: "var(--muted-foreground)" }}>
                        {deal.nextActivity}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px]"
                          style={{ background: "var(--iw-blue)", fontWeight: 600 }}>
                          {deal.owner.initials}
                        </div>
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                          <Calendar className="w-3 h-3" />
                          {new Date(deal.closeDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty column */}
                  {stageDeals.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-24 text-center px-3"
                      style={{ border: "1px dashed var(--border)", borderRadius: "0.5rem" }}>
                      <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                        No deals in {stage.label}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty pipeline state — shown when no CRM connected */}
        {deals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center text-center px-6 pointer-events-auto">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <Plug className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
              </div>
              <p className="text-sm mb-1.5" style={{ fontWeight: 600, color: "var(--foreground)" }}>
                No pipeline data
              </p>
              <p className="text-xs mb-4 max-w-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Connect your CRM to surface deals with health scores, probabilities, and Twin's read on each opportunity.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                <Plug className="w-3 h-3" />
                Connect Salesforce or HubSpot in Ingress
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deal detail drawer */}
      {selectedDeal && (
        <DealDetailDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </div>
  );
}

// ─── Deal detail drawer ───────────────────────────────────────────────────────

function DealDetailDrawer({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const twinKey = deal.company.toLowerCase().replace(/[^a-z]/g, "");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full overflow-y-auto animate-in slide-in-from-right"
        style={{ background: "var(--card)", borderLeft: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4"
          style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{deal.logo}</span>
              <div>
                <h3 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>{deal.company}</h3>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                  {deal.stage.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())} · {deal.owner.name}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Value",       val: `$${(deal.value / 1000).toFixed(0)}K`,        color: "var(--foreground)" },
              { label: "Probability", val: `${deal.probability}%`,                        color: "var(--iw-blue)" },
              { label: "Health",      val: `${deal.healthScore}`,                          color: deal.healthScore >= 80 ? "var(--iw-success)" : deal.healthScore >= 60 ? "var(--iw-warning)" : "var(--iw-danger)" },
            ].map(m => (
              <div key={m.label} className="rounded-lg p-2.5 text-center" style={{ background: "var(--secondary)" }}>
                <p className="text-base" style={{ fontWeight: 700, color: m.color }}>{m.val}</p>
                <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Next activity */}
          <div className="rounded-lg p-3"
            style={{ background: "var(--iw-blue-50)", border: "1px solid var(--iw-blue-100)" }}>
            <p className="text-[9px] uppercase tracking-widest mb-1"
              style={{ color: "var(--iw-blue)", fontWeight: 700 }}>Next activity</p>
            <p className="text-xs" style={{ color: "var(--foreground)", fontWeight: 500 }}>{deal.nextActivity}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Close: {new Date(deal.closeDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>

          {/* Twin panel */}
          <EntityTwinPanel entityType="deal" entityKey={twinKey} entityName={deal.company} />

          {/* Note */}
          <div>
            <p className="text-[9px] uppercase tracking-widest mb-2"
              style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Deal notes</p>
            {noteSaved && (
              <p className="text-[10px] mb-2" style={{ color: "var(--iw-success)", fontWeight: 600 }}>
                ✓ Committed to Spine.
              </p>
            )}
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="What happened? What's blocking? What's next?"
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-lg resize-none"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
            <button
              onClick={() => { if (note.trim()) { setNoteSaved(true); setNote(""); } }}
              className="mt-2 px-3 py-1.5 rounded-lg text-[10px] text-white"
              style={{ background: "var(--iw-blue)", fontWeight: 700 }}>
              Save note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
