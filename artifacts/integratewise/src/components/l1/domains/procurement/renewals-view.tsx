/**
 * Procurement — Renewals Tracker
 * Spine-hydrated view for upcoming contract and vendor renewals.
 * L2-wired: insights + recommendations.
 */
import { useState, useMemo } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Insights, useL2Recommendations } from "@/hooks/use-l2";
import { Calendar, Clock, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { formatCurrency } from "../spine-projection";

export function ProcurementRenewalsView() {
  const auth = useAuth();
  const userId = auth?.user?.id ?? "";
  const ctx = useMemo(
    () => (userId ? { userId, domain: "PROCUREMENT" as const, viewId: "renewals" } : null),
    [userId]
  );
  useL2Insights(ctx);
  useL2Recommendations(ctx);

  const { data: proj } = useHydrateProjection<any>("procurement");
  const renewals = proj?.renewalTrackers || proj?.renewal_trackers || [];
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const filtered = useMemo(() => {
    if (urgencyFilter === "all") return renewals;
    if (urgencyFilter === "urgent")
      return renewals.filter((r: any) => (r.days_to_renewal ?? 999) <= 30);
    if (urgencyFilter === "upcoming")
      return renewals.filter((r: any) => {
        const d = r.days_to_renewal ?? 999;
        return d > 30 && d <= 90;
      });
    return renewals.filter((r: any) => (r.days_to_renewal ?? 0) > 90);
  }, [renewals, urgencyFilter]);

  const urgencyColor = (days: number | null) => {
    if (days === null) return "var(--muted-foreground)";
    if (days <= 30) return "var(--iw-danger)";
    if (days <= 90) return "var(--iw-warning)";
    return "var(--iw-success)";
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Renewals
            </h2>
            {["all", "urgent", "upcoming", "safe"].map((f) => (
              <button
                key={f}
                onClick={() => setUrgencyFilter(f)}
                className={`px-2.5 py-1 text-xs rounded-full capitalize ${urgencyFilter === f ? "bg-[var(--iw-forest-mid)]/15 text-[var(--iw-forest-mid)]" : "bg-secondary text-muted-foreground"}`}
                style={{ fontWeight: urgencyFilter === f ? 600 : 400 }}
              >
                {f === "all"
                  ? `All (${renewals.length})`
                  : f === "urgent"
                    ? `Urgent (${renewals.filter((r: any) => (r.days_to_renewal ?? 999) <= 30).length})`
                    : f === "upcoming"
                      ? `Upcoming`
                      : `Safe`}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Upcoming contract and vendor renewals. AI can flag cost anomalies and suggest
          renegotiations.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {renewals.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              No renewals tracked yet. Connect your procurement tools to populate.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r: any) => {
              const daysLeft = r.days_to_renewal;
              const color = urgencyColor(daysLeft);
              return (
                <div
                  key={r.renewal_id || r.contract_id || r.id}
                  className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        {daysLeft !== null && daysLeft <= 30 ? (
                          <AlertTriangle className="w-4 h-4" style={{ color }} />
                        ) : (
                          <Calendar className="w-4 h-4" style={{ color }} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm" style={{ fontWeight: 600 }}>
                          {r.vendor_name || "Unknown Vendor"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Renewal: {r.renewal_date || "—"}
                          {r.action_required && (
                            <span className="ml-2 text-[var(--iw-warning)]">
                              {" "}
                              · Action required
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm" style={{ fontWeight: 700 }}>
                        {r.current_value ? formatCurrency(r.current_value, true) : "—"}
                      </p>
                      {r.proposed_value && r.proposed_value !== r.current_value && (
                        <p className="text-[10px] text-muted-foreground">
                          Proposed: {formatCurrency(r.proposed_value, true)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${color}15`, color, fontWeight: 600 }}
                    >
                      {daysLeft !== null ? `${daysLeft}d left` : "No date"}
                    </span>
                    {r.risk_level && <span className="capitalize">Risk: {r.risk_level}</span>}
                    {r.owner && <span>Owner: {r.owner}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
