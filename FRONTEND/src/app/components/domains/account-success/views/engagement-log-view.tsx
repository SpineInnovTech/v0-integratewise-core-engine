/**
 * Engagement Log View — Meeting/engagement history with sentiment and action items.
 * Entity: Engagement_Log
 */
import { useState } from "react";
import { Search, MessageSquare, Calendar, Users } from "lucide-react";
import { engagementLogData, getAccountName } from "../csm-intelligence-data";

const sentimentColors: Record<string, string> = {
  "Very Positive": "#22c55e", Positive: "#86efac", Neutral: "#94a3b8", Negative: "#f97316", Concerning: "#ef4444",
};

export function EngagementLogView() {
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");

  const filtered = engagementLogData.filter(e => {
    if (search && !getAccountName(e.account).toLowerCase().includes(search.toLowerCase()) && !e.engagementType.toLowerCase().includes(search.toLowerCase())) return false;
    if (sentimentFilter !== "all" && e.sentiment !== sentimentFilter) return false;
    return true;
  }).sort((a, b) => b.engagementDate.localeCompare(a.engagementDate));

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>Engagement Log</h2>
          <p className="text-xs text-muted-foreground">{engagementLogData.length} engagements recorded · Sorted by date</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-44" />
          </div>
          <select value={sentimentFilter} onChange={e => setSentimentFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Sentiment</option>
            {["Very Positive", "Positive", "Neutral", "Negative", "Concerning"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered.map(e => (
          <div key={e.engagementId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>{e.engagementType}</p>
                  <p className="text-[10px] text-muted-foreground">{getAccountName(e.account)} · {e.engagementDate} · {e.customerSeniority}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, color: sentimentColors[e.sentiment], background: `${sentimentColors[e.sentiment]}15` }}>
                  {e.sentiment}
                </span>
                <span className="text-[10px] text-muted-foreground">Depth: {e.relationshipDepthScore}/10</span>
              </div>
            </div>

            {/* Attendees */}
            <div className="flex items-start gap-4 text-[10px]">
              <div>
                <span className="text-muted-foreground">MuleSoft: </span>
                <span className="text-foreground" style={{ fontWeight: 500 }}>{e.attendeesMuleSoft.join(", ")}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Customer: </span>
                <span className="text-foreground" style={{ fontWeight: 500 }}>{e.attendeesCustomer.join(", ")}</span>
              </div>
            </div>

            {/* Topics */}
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Topics Discussed</p>
              <div className="flex flex-wrap gap-1">
                {e.topicsDiscussed.map((t, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-foreground" style={{ fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="p-2.5 rounded-lg bg-secondary/20 border border-border/50">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Action Items</p>
              <div className="space-y-1">
                {e.actionItems.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              <span className="italic">{e.nextSteps}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Next: {e.nextEngagementDate}</span>
            </div>

            {/* Linked Objectives & Initiatives */}
            {(e.linkedStrategicObjectives.length > 0 || e.linkedInitiatives.length > 0) && (
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Links:</span>
                {e.linkedStrategicObjectives.map(s => <span key={s} className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600" style={{ fontWeight: 500 }}>{s}</span>)}
                {e.linkedInitiatives.map(i => <span key={i} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700" style={{ fontWeight: 500 }}>{i}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}