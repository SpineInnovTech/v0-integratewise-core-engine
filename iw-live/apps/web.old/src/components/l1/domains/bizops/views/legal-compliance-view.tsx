/**
 * BizOps — Legal & Compliance View
 *
 * Covers: Contract management, compliance tracking, data governance,
 *         regulatory requirements, policy management
 */
import { useState } from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import {
  Shield,
  FileText,
  Scale,
  Database,
  Gavel,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Landmark,
} from "lucide-react";

const ENTITY_TYPES = [
  "contract",
  "compliance_certificate",
  "policy",
  "regulatory_requirement",
  "nda",
  "data_governance_rule",
  "ip_filing",
] as const;

export function LegalComplianceView() {
  const {
    data: batch,
    isLoading,
    refetch,
  } = useWorkspaceEntitiesBatch([...ENTITY_TYPES], {
    limit: 200,
  });

  const contracts = batch.contract ?? [];
  const certificates = batch.compliance_certificate ?? [];
  const policies = batch.policy ?? [];
  const regulations = batch.regulatory_requirement ?? [];
  const ndas = batch.nda ?? [];
  const dataGovernance = batch.data_governance_rule ?? [];
  const ipFilings = batch.ip_filing ?? [];

  const activeContracts = contracts.filter(
    (c: any) => c.status === "active" || c.status === "signed"
  );
  const expiringContracts = contracts.filter((c: any) => {
    if (!c.end_date && !c.expiry_date) return false;
    const expiry = new Date(c.end_date || c.expiry_date);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expiry <= thirtyDays && expiry >= new Date();
  });
  const pendingCertificates = certificates.filter(
    (c: any) => c.status === "pending" || c.status === "in_progress"
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading legal & compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-[var(--iw-purple)]" />
            Legal & Compliance
          </h2>
          <p className="text-sm text-muted-foreground">
            Contracts, compliance, policies, and regulatory tracking
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 rounded-lg border hover:bg-accent text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniKPI
          label="Active Contracts"
          value={activeContracts.length}
          icon={<FileText className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="Expiring Soon"
          value={expiringContracts.length}
          icon={<Clock className="h-4 w-4" />}
          color={expiringContracts.length > 0 ? "text-iw-red" : "text-iw-forest-mid"}
        />
        <MiniKPI
          label="Compliance Certs"
          value={certificates.length}
          icon={<Shield className="h-4 w-4" />}
          color="text-iw-forest-mid"
        />
        <MiniKPI
          label="Policies"
          value={policies.length}
          icon={<Gavel className="h-4 w-4" />}
          color="text-iw-slate"
        />
      </div>

      {/* Contract Management */}
      <CollapsibleSection
        title="Contract Management"
        icon={<FileText className="h-4 w-4 text-iw-slate-mid" />}
        count={contracts.length}
        countLabel="contracts"
        defaultOpen
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Active ({activeContracts.length})
            </h4>
            {activeContracts.length > 0 ? (
              activeContracts.slice(0, 8).map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium">
                      {c.name || c.contract_name || c.title || "Contract"}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {[c.counterparty, c.type].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.value != null && (
                      <span className="text-xs text-muted-foreground">
                        ${(c.value / 1000).toFixed(0)}K
                      </span>
                    )}
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No active contracts</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Expiring Soon ({expiringContracts.length})
            </h4>
            {expiringContracts.length > 0 ? (
              expiringContracts.slice(0, 8).map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium">
                      {c.name || c.contract_name || c.title || "Contract"}
                    </span>
                  </div>
                  <span className="text-xs text-iw-red shrink-0 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {new Date(c.end_date || c.expiry_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No contracts expiring soon</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Compliance Certificates */}
      <CollapsibleSection
        title="Compliance & Certifications"
        icon={<Shield className="h-4 w-4 text-iw-forest-mid" />}
        count={certificates.length}
        countLabel="certificates"
        defaultOpen
      >
        {certificates.length > 0 ? (
          <div className="space-y-2">
            {certificates.slice(0, 10).map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {c.name || c.certificate_name || c.standard || "Certificate"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[c.issuing_body, c.scope].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.expiry_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(c.expiry_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No compliance certificates</p>
        )}
      </CollapsibleSection>

      {/* Policies */}
      <CollapsibleSection
        title="Policies"
        icon={<Gavel className="h-4 w-4 text-iw-slate" />}
        count={policies.length}
        countLabel="policies"
      >
        {policies.length > 0 ? (
          <div className="space-y-2">
            {policies.slice(0, 10).map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {p.name || p.policy_name || p.title || "Policy"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[p.category, p.department].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.last_updated && (
                    <span className="text-xs text-muted-foreground">
                      Updated{" "}
                      {new Date(p.last_updated).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No policies defined</p>
        )}
      </CollapsibleSection>

      {/* Regulatory Requirements */}
      <CollapsibleSection
        title="Regulatory Requirements"
        icon={<Landmark className="h-4 w-4 text-iw-gold" />}
        count={regulations.length}
        countLabel="requirements"
      >
        {regulations.length > 0 ? (
          <div className="space-y-2">
            {regulations.slice(0, 10).map((r: any) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {r.name || r.regulation_name || r.title || "Regulation"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[r.jurisdiction, r.industry].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.compliance_deadline && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(r.compliance_deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No regulatory requirements tracked</p>
        )}
      </CollapsibleSection>

      {/* Data Governance */}
      <CollapsibleSection
        title="Data Governance"
        icon={<Database className="h-4 w-4 text-iw-forest-bright" />}
        count={dataGovernance.length}
        countLabel="rules"
      >
        {dataGovernance.length > 0 ? (
          <div className="space-y-2">
            {dataGovernance.slice(0, 10).map((d: any) => (
              <div
                key={d.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">{d.name || d.rule_name || d.title || "Rule"}</span>
                  <p className="text-xs text-muted-foreground">
                    {[d.category, d.data_type].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No data governance rules</p>
        )}
      </CollapsibleSection>
    </div>
  );
}

function MiniKPI({
  label,
  value,
  icon,
  color = "text-muted-foreground",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-3 border rounded-lg bg-card">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  count,
  countLabel,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  countLabel: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-muted-foreground">
            ({count} {countLabel})
          </span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const s = status.toLowerCase();
  const color =
    s === "active" ||
    s === "running" ||
    s === "live" ||
    s === "enabled" ||
    s === "on_track" ||
    s === "signed" ||
    s === "compliant"
      ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80"
      : s === "paused" ||
          s === "pending" ||
          s === "draft" ||
          s === "in_progress" ||
          s === "under_review"
        ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light"
        : s === "completed" || s === "done" || s === "approved"
          ? "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/20 dark:text-iw-slate-mid/80"
          : s === "failed" ||
              s === "lost" ||
              s === "blocked" ||
              s === "at_risk" ||
              s === "non_compliant" ||
              s === "expired"
            ? "bg-iw-red/10 text-iw-red dark:bg-iw-red/90/20 dark:text-iw-red/70"
            : "bg-muted text-muted-foreground";

  return <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{status}</span>;
}

export default LegalComplianceView;
