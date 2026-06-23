/**
 * Finance — Invoice Approvals
 * Queue of invoices pending approval. L2-wired: insights + recommendations (govern audit when ready).
 * Data: Spine projection via useHydrateProjection("finance") — invoice entities.
 */
import { useState, useMemo } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Insights, useL2Recommendations } from "@/hooks/use-l2";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, FileText, Loader2 } from "lucide-react";

type InvoiceItem = {
  id: string;
  invoiceId?: string;
  vendor?: string;
  amount?: number;
  dueDate?: string;
  submittedBy?: string;
  status?: "pending" | "approved" | "rejected";
};

const formatCurrency = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`);

export function InvoiceApprovalsView() {
  const auth = useAuth();
  const userId = auth?.user?.id ?? "";
  const ctx = useMemo(
    () => (userId ? { userId, domain: "FINANCE" as const, viewId: "invoice-approvals" } : null),
    [userId]
  );
  useL2Insights(ctx);
  useL2Recommendations(ctx);

  const { data: proj, loading } = useHydrateProjection<any>("finance");
  const spineInvoices: InvoiceItem[] = useMemo(() => {
    if (!proj) return [];
    const raw = proj.invoices || proj.invoice || [];
    return (Array.isArray(raw) ? raw : []).map((r: any) => ({
      id: r.id || r.invoiceId || crypto.randomUUID(),
      invoiceId: r.invoiceId || r.invoice_id || r.id,
      vendor: r.vendor || r.vendor_name || r.name || "Unknown",
      amount: typeof r.amount === "number" ? r.amount : 0,
      dueDate: r.dueDate || r.due_date || "",
      submittedBy: r.submittedBy || r.submitted_by || r.owner || "",
      status: r.status || "pending",
    }));
  }, [proj]);

  const [localOverrides, setLocalOverrides] = useState<
    Partial<Record<string, "approved" | "rejected">>
  >({});
  const [acting, setActing] = useState<string | null>(null);

  const items = useMemo(
    () =>
      spineInvoices.map((i) => ({ ...i, status: localOverrides[i.id] || i.status || "pending" })),
    [spineInvoices, localOverrides]
  );

  const pending = items.filter((i) => i.status === "pending");
  const approved = items.filter((i) => i.status === "approved");
  const rejected = items.filter((i) => i.status === "rejected");

  const setStatus = (id: string, status: "approved" | "rejected") => {
    setActing(id);
    setTimeout(() => {
      setLocalOverrides((prev) => ({ ...prev, [id]: status }));
      setActing(null);
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading invoices...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-semibold">Invoice Approvals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review and approve or reject submitted invoices. Decisions are recorded for audit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            Pending ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No pending approvals.</p>
          ) : (
            pending.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-lg border p-4 bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {row.invoiceId} · {row.vendor}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(row.amount || 0)} · Due {row.dueDate} · {row.submittedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    disabled={acting === row.id}
                    onClick={() => setStatus(row.id, "rejected")}
                  >
                    {acting === row.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={acting === row.id}
                    onClick={() => setStatus(row.id, "approved")}
                  >
                    {acting === row.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approved.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
              >
                <span className="truncate">
                  {row.invoiceId} · {row.vendor}
                </span>
                <Badge
                  variant="secondary"
                  className="bg-iw-forest-bright/15 text-iw-forest dark:text-iw-forest-bright/80"
                >
                  Approved
                </Badge>
              </div>
            ))}
            {approved.length === 0 && <p className="text-xs text-muted-foreground">None yet</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rejected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rejected.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
              >
                <span className="truncate">
                  {row.invoiceId} · {row.vendor}
                </span>
                <Badge variant="secondary" className="bg-destructive/15 text-destructive">
                  Rejected
                </Badge>
              </div>
            ))}
            {rejected.length === 0 && <p className="text-xs text-muted-foreground">None yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
