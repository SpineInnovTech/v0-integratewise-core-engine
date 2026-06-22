/**
 * People & Team View — CSM team management and workload distribution.
 * Entity: People_Team
 */
import { useState } from "react";
import { Search, Users, AlertTriangle } from "lucide-react";
import { peopleTeamData, formatCurrency, healthColor, getAccountName } from "../csm-intelligence-data";

export function PeopleTeamView() {
  const [search, setSearch] = useState("");

  const filtered = peopleTeamData.filter(p =>
    !search || p.fullName.toLowerCase().includes(search.toLowerCase()) || p.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalArr = peopleTeamData.filter(p => p.accountCount > 0).reduce((s, p) => s + p.totalArrManaged, 0);
  const totalAtRisk = peopleTeamData.reduce((s, p) => s + p.atRiskAccountCount, 0);

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>People & Team</h2>
          <p className="text-xs text-muted-foreground">{peopleTeamData.length} team members · CSM workload distribution</p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-48" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Team Size", value: peopleTeamData.filter(p => p.accountCount > 0).length.toString(), sub: "Active CSMs" },
          { label: "Total ARR Managed", value: formatCurrency(totalArr), sub: "Across all CSMs" },
          { label: "Accounts At Risk", value: totalAtRisk.toString(), sub: "Require attention" },
          { label: "Avg Accounts / CSM", value: (peopleTeamData.filter(p => p.accountCount > 0).reduce((s, p) => s + p.accountCount, 0) / peopleTeamData.filter(p => p.accountCount > 0).length).toFixed(1), sub: "Workload balance" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="text-xl mt-1 text-foreground" style={{ fontWeight: 700 }}>{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(p => (
          <div key={p.personId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-sm" style={{ fontWeight: 700 }}>
                  {p.fullName.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>{p.fullName}</p>
                  <p className="text-[10px] text-muted-foreground">{p.role} · {p.region}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.activeStatus === "Active" ? "bg-green-500/10 text-green-600" : "bg-gray-500/10 text-gray-500"}`} style={{ fontWeight: 600 }}>
                {p.activeStatus}
              </span>
            </div>

            <div className="text-[10px] text-muted-foreground">{p.email} · Slack: {p.slackUserId}</div>

            {p.accountCount > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Accounts</p>
                    <p className="text-sm text-foreground" style={{ fontWeight: 700 }}>{p.accountCount}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">ARR Managed</p>
                    <p className="text-sm text-foreground" style={{ fontWeight: 700 }}>{formatCurrency(p.totalArrManaged)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Avg Health</p>
                    <p className="text-sm" style={{ fontWeight: 700, color: healthColor(p.avgHealthScore) }}>{p.avgHealthScore}</p>
                  </div>
                </div>

                {p.atRiskAccountCount > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-500 bg-red-500/5 px-2 py-1 rounded-lg">
                    <AlertTriangle className="w-3 h-3" />
                    <span style={{ fontWeight: 600 }}>{p.atRiskAccountCount} account{p.atRiskAccountCount > 1 ? "s" : ""} at risk</span>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Assigned Accounts</p>
                  {p.accountsAssigned.map(aId => (
                    <span key={aId} className="inline-block mr-1.5 mb-1 text-[10px] px-2 py-0.5 rounded bg-secondary text-foreground" style={{ fontWeight: 500 }}>
                      {getAccountName(aId)}
                    </span>
                  ))}
                </div>
              </>
            )}

            {p.accountCount === 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground italic">Leadership role — oversees team, no direct accounts</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
