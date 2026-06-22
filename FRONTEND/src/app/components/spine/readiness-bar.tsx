/**
 * Readiness Bar — Shows the data readiness state for a department.
 * Buckets: OFF → ADDING → SEEDED → LIVE
 * "L1 shows only modules that are SEEDED or LIVE."
 */

import { useSpine, type ReadinessBucket, type DepartmentReadiness, type ReadinessState } from "./spine-client";
import { Database, Zap, Check, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const stateConfig: Record<ReadinessState, { color: string; label: string; bg: string }> = {
  off: { color: "var(--muted-foreground)", label: "No Data", bg: "bg-secondary" },
  adding: { color: "var(--iw-warning)", label: "Adding", bg: "bg-[var(--iw-warning)]/10" },
  seeded: { color: "var(--iw-blue)", label: "Seeded", bg: "bg-[var(--iw-blue)]/10" },
  live: { color: "var(--iw-success)", label: "Live", bg: "bg-[var(--iw-success)]/10" },
};

export function ReadinessBar({ department }: { department: string }) {
  const { readiness } = useSpine();
  const [expanded, setExpanded] = useState(false);

  const deptReadiness = readiness?.[department === "ops" ? "bizops" : department];
  if (!deptReadiness) return null;

  const config = stateConfig[deptReadiness.overallState];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors"
      >
        <Database className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">SSOT</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
          {config.label}
        </span>

        {/* Mini readiness bar */}
        <div className="flex-1 flex items-center gap-1">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${deptReadiness.overallScore}%`, backgroundColor: config.color }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">{deptReadiness.overallScore}%</span>
        </div>

        {/* Bucket dots */}
        <div className="hidden sm:flex items-center gap-1">
          {deptReadiness.buckets.map((b) => (
            <div
              key={b.capability}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: stateConfig[b.state].color }}
              title={`${b.label}: ${stateConfig[b.state].label}`}
            />
          ))}
        </div>

        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {deptReadiness.buckets.map((bucket) => (
              <BucketCard key={bucket.capability} bucket={bucket} />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: stateConfig.off.color }} /> No data</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: stateConfig.adding.color }} /> Connected, learning</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: stateConfig.seeded.color }} /> Min. viable SSOT</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: stateConfig.live.color }} /> High quality</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BucketCard({ bucket }: { bucket: ReadinessBucket }) {
  const config = stateConfig[bucket.state];
  return (
    <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{bucket.label}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
          {config.label}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-tight">{bucket.description}</p>
      <div className="space-y-1">
        <MetricRow label="Coverage" value={bucket.coverage} color={config.color} />
        <MetricRow label="Completeness" value={bucket.completeness} color={config.color} />
        <MetricRow label="Freshness" value={bucket.freshness} color={config.color} />
        <MetricRow label="Confidence" value={bucket.confidence} color={config.color} />
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">Score</span>
        <span className="text-xs font-mono font-semibold" style={{ color: config.color }}>{bucket.score}/100</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted-foreground w-20">{label}</span>
      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-[9px] text-muted-foreground w-6 text-right font-mono">{Math.round(value * 100)}%</span>
    </div>
  );
}

/**
 * ProvenanceBadge — Shows where a data point came from (source lineage).
 * Shows confidence score and corroboration count.
 */
export function ProvenanceBadge({ provenance }: { provenance: { sourceToolName: string; confidence: number }[] }) {
  if (!provenance || provenance.length === 0) return null;
  const avgConfidence = provenance.reduce((s, p) => s + p.confidence, 0) / provenance.length;
  const sourceNames = [...new Set(provenance.map(p => p.sourceToolName))];

  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground" title={`Sources: ${sourceNames.join(", ")} | Confidence: ${Math.round(avgConfidence * 100)}%`}>
      <Database className="w-2.5 h-2.5" />
      {sourceNames.length > 1 ? `${sourceNames.length} sources` : sourceNames[0]}
      <span className="ml-0.5 font-mono">{Math.round(avgConfidence * 100)}%</span>
    </span>
  );
}
