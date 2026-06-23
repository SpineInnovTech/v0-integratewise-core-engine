/**
 * IT Admin Inner Views — Systems, Incidents, Vulnerabilities, Certificates, Licenses
 * All data from Spine SSOT IT Admin projection.
 *
 * NOTE: These views align with the DOMAIN_SPINE_CONFIG IT_ADMIN entity types:
 * system, device, incident, change_request, vulnerability, backup, certificate,
 * network_device, license, it_metric, generated_insight
 *
 * Previous stubs (Users, Permissions, Integrations, AuditLogs, Compliance) were
 * platform-admin views that didn't match the schema. Moved to _deprecated/.
 */
import { useState, useMemo } from "react";
import {
  Server,
  AlertTriangle,
  Shield,
  Key,
  MonitorSmartphone,
  Search,
  Plus,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Zap,
  Bug,
  Lock,
  HardDrive,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";

/* ═══════════ Systems Inventory ═══════════ */
export function SystemsView() {
  const { data: proj } = useHydrateProjection<any>("it_admin");
  const systems = proj?.systems || [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSystem, setSelectedSystem] = useState<any>(null);

  const filtered = useMemo(() => {
    let list = systems;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s: any) =>
          s.system_name?.toLowerCase().includes(q) ||
          s.type?.toLowerCase().includes(q) ||
          s.owner?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((s: any) => s.status === statusFilter);
    }
    return list;
  }, [systems, search, statusFilter]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-3.5 h-3.5 text-[var(--iw-success)]" />;
      case "degraded":
        return <AlertCircle className="w-3.5 h-3.5 text-[var(--iw-warning)]" />;
      case "down":
        return <XCircle className="w-3.5 h-3.5 text-[var(--iw-danger)]" />;
      case "maintenance":
        return <Clock className="w-3.5 h-3.5 text-[var(--iw-forest-mid)]" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const criticalityColor = (c: string) => {
    switch (c) {
      case "critical":
        return "var(--iw-danger)";
      case "high":
        return "var(--iw-warning)";
      case "medium":
        return "var(--iw-forest-mid)";
      default:
        return "var(--muted-foreground)";
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Systems
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search systems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
            {["all", "healthy", "degraded", "down", "maintenance"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-full capitalize ${statusFilter === s ? "bg-[var(--iw-teal)]/15 text-[var(--iw-teal)]" : "bg-secondary text-muted-foreground"}`}
                style={{ fontWeight: statusFilter === s ? 600 : 400 }}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>System</span>
            <span>Status</span>
            <span>Environment</span>
            <span>Uptime</span>
            <span>Criticality</span>
            <span>Last Patched</span>
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {systems.length === 0
                ? "No systems registered yet. Connect your infrastructure tools."
                : "No systems match your filters"}
            </p>
          )}
          {filtered.map((s: any) => (
            <div
              key={s.system_id || s.id}
              onClick={() => setSelectedSystem(s)}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
            >
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                  {s.system_name}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {s.type} · v{s.version || "—"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {statusIcon(s.status)}
                <span className="text-xs capitalize">{s.status}</span>
              </div>
              <span className="text-xs text-muted-foreground capitalize">
                {s.environment || "—"}
              </span>
              <span
                className="text-sm"
                style={{
                  fontWeight: 600,
                  color:
                    (s.uptime_percent ?? 0) >= 99.9 ? "var(--iw-success)" : "var(--iw-warning)",
                }}
              >
                {s.uptime_percent != null ? `${s.uptime_percent}%` : "—"}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full capitalize w-fit"
                style={{
                  backgroundColor: `${criticalityColor(s.criticality)}15`,
                  color: criticalityColor(s.criticality),
                  fontWeight: 600,
                }}
              >
                {s.criticality || "—"}
              </span>
              <span className="text-xs text-muted-foreground">{s.last_patched || "Never"}</span>
            </div>
          ))}
        </div>
      </div>
      {selectedSystem && (
        <SystemDrawer system={selectedSystem} onClose={() => setSelectedSystem(null)} />
      )}
    </div>
  );
}

/* ═══════════ Incidents ═══════════ */
export function IncidentsView() {
  const { data: proj } = useHydrateProjection<any>("it_admin");
  const incidents = proj?.incidents || [];
  const [severityFilter, setSeverityFilter] = useState("all");

  const filtered = useMemo(() => {
    if (severityFilter === "all") return incidents;
    return incidents.filter((i: any) => i.severity === severityFilter);
  }, [incidents, severityFilter]);

  const severityColor: Record<string, string> = {
    critical: "var(--iw-danger)",
    high: "var(--iw-warning)",
    medium: "var(--iw-forest-mid)",
    low: "var(--muted-foreground)",
  };

  const statusColor: Record<string, string> = {
    open: "var(--iw-danger)",
    investigating: "var(--iw-warning)",
    mitigated: "var(--iw-forest-mid)",
    resolved: "var(--iw-success)",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Incidents
            </h2>
            {["all", "critical", "high", "medium", "low"].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-full capitalize ${severityFilter === s ? "bg-[var(--iw-danger)]/15 text-[var(--iw-danger)]" : "bg-secondary text-muted-foreground"}`}
                style={{ fontWeight: severityFilter === s ? 600 : 400 }}
              >
                {s === "all"
                  ? `All (${incidents.length})`
                  : `${s} (${incidents.filter((i: any) => i.severity === s).length})`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            {incidents.length === 0
              ? "No incidents recorded. Connect your monitoring tools."
              : "No incidents match this severity"}
          </p>
        )}
        {filtered.map((i: any) => (
          <div
            key={i.incident_id || i.id}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${severityColor[i.severity] || "var(--muted-foreground)"}15`,
                  }}
                >
                  <AlertTriangle className="w-4 h-4" style={{ color: severityColor[i.severity] }} />
                </div>
                <div>
                  <p className="text-sm" style={{ fontWeight: 600 }}>
                    {i.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Affected: {i.affected_systems || "—"} · Detected: {i.detected_at || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: `${severityColor[i.severity]}15`,
                    color: severityColor[i.severity],
                    fontWeight: 600,
                  }}
                >
                  {i.severity}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: `${statusColor[i.status] || "var(--muted-foreground)"}15`,
                    color: statusColor[i.status] || "var(--muted-foreground)",
                    fontWeight: 600,
                  }}
                >
                  {i.status}
                </span>
              </div>
            </div>
            {(i.mttr || i.root_cause) && (
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                {i.mttr && <span>MTTR: {i.mttr}</span>}
                {i.root_cause && <span>Root cause: {i.root_cause}</span>}
                {i.resolved_at && <span>Resolved: {i.resolved_at}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ Vulnerabilities ═══════════ */
export function VulnerabilitiesView() {
  const { data: proj } = useHydrateProjection<any>("it_admin");
  const vulns = proj?.vulnerabilities || [];
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return vulns;
    return vulns.filter((v: any) => v.status === statusFilter);
  }, [vulns, statusFilter]);

  const severityColor: Record<string, string> = {
    critical: "var(--iw-danger)",
    high: "var(--iw-warning)",
    medium: "var(--iw-forest-mid)",
    low: "var(--muted-foreground)",
  };

  // Build severity chart data
  const chartData = ["critical", "high", "medium", "low"].map((sev) => ({
    severity: sev.charAt(0).toUpperCase() + sev.slice(1),
    count: vulns.filter((v: any) => v.severity === sev).length,
    fill: severityColor[sev],
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg" style={{ fontWeight: 600 }}>
            Vulnerabilities
          </h2>
          {["all", "open", "in_progress", "patched", "accepted"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-full capitalize ${statusFilter === s ? "bg-[var(--iw-danger)]/15 text-[var(--iw-danger)]" : "bg-secondary text-muted-foreground"}`}
              style={{ fontWeight: statusFilter === s ? 600 : 400 }}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Severity Distribution */}
      <div className="grid grid-cols-4 gap-4">
        {chartData.map((d) => (
          <MetricCard key={d.severity} label={d.severity} value={String(d.count)} color={d.fill} />
        ))}
      </div>

      {/* Vulnerability Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div
          className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
          style={{ fontWeight: 600 }}
        >
          <span>CVE</span>
          <span>Affected Systems</span>
          <span>Severity</span>
          <span>Status</span>
          <span>Patch</span>
          <span>Deadline</span>
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {vulns.length === 0
              ? "No vulnerabilities detected. Connect your scanning tools."
              : "No vulnerabilities match this filter"}
          </p>
        )}
        {filtered.map((v: any) => (
          <div
            key={v.cve_id || v.id}
            className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
          >
            <span className="text-xs font-mono" style={{ fontWeight: 600 }}>
              {v.cve_id || "—"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {v.affected_systems || "—"}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full capitalize w-fit"
              style={{
                backgroundColor: `${severityColor[v.severity] || "var(--muted-foreground)"}15`,
                color: severityColor[v.severity] || "var(--muted-foreground)",
                fontWeight: 600,
              }}
            >
              {v.severity}
            </span>
            <span className="text-xs capitalize">{v.status?.replace("_", " ") || "—"}</span>
            <span className="text-xs">
              {v.patch_available ? (
                <CheckCircle className="w-3.5 h-3.5 text-[var(--iw-success)]" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-[var(--iw-danger)]" />
              )}
            </span>
            <span className="text-xs text-muted-foreground">{v.remediation_deadline || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ Certificates ═══════════ */
export function CertificatesView() {
  const { data: proj } = useHydrateProjection<any>("it_admin");
  const certs = proj?.certificates || [];

  const sorted = useMemo(
    () =>
      [...certs].sort((a: any, b: any) => (a.days_to_expiry ?? 999) - (b.days_to_expiry ?? 999)),
    [certs]
  );

  const expiryColor = (days: number | null) => {
    if (days === null) return "var(--muted-foreground)";
    if (days <= 14) return "var(--iw-danger)";
    if (days <= 30) return "var(--iw-warning)";
    if (days <= 90) return "var(--iw-forest-mid)";
    return "var(--iw-success)";
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <h2 className="text-lg" style={{ fontWeight: 600 }}>
          SSL/TLS Certificates
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track certificate expiry across all domains. Auto-renew status shown per certificate.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {certs.length === 0 ? (
          <div className="text-center py-16">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              No certificates tracked yet. Connect your infrastructure tools.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((c: any) => {
              const color = expiryColor(c.days_to_expiry);
              return (
                <div
                  key={c.certificate_id || c.domain || c.id}
                  className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Key className="w-4 h-4" style={{ color }} />
                      </div>
                      <div>
                        <p className="text-sm" style={{ fontWeight: 600 }}>
                          {c.domain}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Issuer: {c.issuer || "—"} · {c.key_algorithm || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}15`, color, fontWeight: 600 }}
                      >
                        {c.days_to_expiry != null ? `${c.days_to_expiry}d left` : "Unknown"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span>Expires: {c.expiry_date || "—"}</span>
                    <span>
                      Auto-renew:{" "}
                      {c.auto_renew ? (
                        <span className="text-[var(--iw-success)]">Yes</span>
                      ) : (
                        <span className="text-[var(--iw-warning)]">No</span>
                      )}
                    </span>
                    <span className="capitalize">Status: {c.status || "—"}</span>
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

/* ═══════════ Software Licenses ═══════════ */
export function LicensesView() {
  const { data: proj } = useHydrateProjection<any>("it_admin");
  const licenses = proj?.licenses || [];

  const totalSeats = licenses.reduce((s: number, l: any) => s + (l.total_seats || 0), 0);
  const usedSeats = licenses.reduce((s: number, l: any) => s + (l.used_seats || 0), 0);
  const totalCost = licenses.reduce((s: number, l: any) => s + (l.annual_cost || 0), 0);
  const avgUtilization =
    licenses.length > 0
      ? Math.round(
          licenses.reduce((s: number, l: any) => s + (l.utilization_percent || 0), 0) /
            licenses.length
        )
      : 0;

  const utilizationColor = (pct: number) => {
    if (pct >= 90) return "var(--iw-danger)";
    if (pct >= 70) return "var(--iw-warning)";
    if (pct >= 40) return "var(--iw-success)";
    return "var(--iw-forest-mid)";
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>
        Software Licenses
      </h2>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Licenses"
          value={String(licenses.length)}
          color="var(--iw-forest-mid)"
        />
        <MetricCard
          label="Seat Utilization"
          value={totalSeats > 0 ? `${Math.round((usedSeats / totalSeats) * 100)}%` : "—"}
          color="var(--iw-success)"
        />
        <MetricCard
          label="Annual Cost"
          value={totalCost > 0 ? `$${(totalCost / 1000).toFixed(0)}K` : "—"}
          color="var(--iw-warning)"
        />
        <MetricCard
          label="Avg Utilization"
          value={licenses.length > 0 ? `${avgUtilization}%` : "—"}
          color={utilizationColor(avgUtilization)}
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div
          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
          style={{ fontWeight: 600 }}
        >
          <span>Software</span>
          <span>Type</span>
          <span>Seats (Used/Total)</span>
          <span>Utilization</span>
          <span>Annual Cost</span>
          <span>Renewal</span>
        </div>
        {licenses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No licenses tracked yet. Connect your IT asset management tools.
          </p>
        )}
        {licenses.map((l: any) => {
          const util = l.utilization_percent || 0;
          return (
            <div
              key={l.license_id || l.software_name || l.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
            >
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                  {l.software_name}
                </p>
              </div>
              <span className="text-xs text-muted-foreground capitalize">
                {l.license_type || "—"}
              </span>
              <span className="text-sm">
                {l.used_seats ?? "—"} / {l.total_seats ?? "—"}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-secondary max-w-[60px]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(util, 100)}%`,
                      backgroundColor: utilizationColor(util),
                    }}
                  />
                </div>
                <span
                  className="text-xs"
                  style={{ fontWeight: 600, color: utilizationColor(util) }}
                >
                  {util}%
                </span>
              </div>
              <span className="text-sm" style={{ fontWeight: 600 }}>
                {l.annual_cost ? `$${(l.annual_cost / 1000).toFixed(1)}K` : "—"}
              </span>
              <span className="text-xs text-muted-foreground">{l.renewal_date || "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── System Drawer ─── */
function SystemDrawer({ system, onClose }: { system: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                {system.system_name}
              </h3>
              <p className="text-xs text-muted-foreground capitalize">
                {system.type} · {system.environment}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Uptime</p>
              <p className="text-lg" style={{ fontWeight: 700, color: "var(--iw-success)" }}>
                {system.uptime_percent != null ? `${system.uptime_percent}%` : "—"}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Status</p>
              <p className="text-sm capitalize" style={{ fontWeight: 600 }}>
                {system.status}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <InfoRow label="Criticality" value={system.criticality || "—"} />
            <InfoRow label="Owner" value={system.owner || "—"} />
            <InfoRow label="Version" value={system.version || "—"} />
            <InfoRow label="Last Patched" value={system.last_patched || "Never"} />
            <InfoRow label="Dependencies" value={system.dependencies || "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Helpers ─── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm capitalize" style={{ fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl" style={{ fontWeight: 700, color }}>
        {value}
      </p>
    </div>
  );
}
