/**
 * Founder Decisions — Decision log for founder/operator
 * Founder happy path: Audit trail of approved/rejected founder recommendations.
 * L2: listDecisions(PERSONAL, founder-decisions).
 */
import { useMemo } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Decisions } from "@/hooks/use-l2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export function FounderDecisionsView() {
  const auth = useAuth();
  const userId = auth?.user?.id ?? "";
  const ctx = useMemo(
    () => (userId ? { userId, domain: "PERSONAL" as const, viewId: "founder-decisions" } : null),
    [userId]
  );
  const { data: decisions = [], isLoading } = useL2Decisions(ctx, { limit: 50 });

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Founder decision log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Audit trail of approved and rejected recommendations. Decisions are immutable.
        </p>
      </div>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : decisions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No decisions yet. Approve or reject items from Project recommendations to see them here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-sm font-medium">{d.title}</CardTitle>
                <div className="flex items-center gap-2 shrink-0">
                  {d.status === "approved" ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="w-3 h-3" />
                      Rejected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground">
                {d.description && <p>{d.description}</p>}
                {d.decidedAt && (
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(d.decidedAt).toLocaleString()}
                    {d.decidedBy && ` · ${d.decidedBy}`}
                  </p>
                )}
                {d.reason && <p className="italic">Reason: {d.reason}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
