/**
 * Renewals View — Renewal tracking and pipeline management
 * Uses success page projections instead of connector-shaped payloads.
 */
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, DollarSign, Filter, Plus, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";
import { HealthBadge } from "./health-gauge";
import { useSuccessCSPage } from "@/hooks/use-cs-data";
import {
  coverageLabel,
  formatCurrency,
  formatDateLabel,
  formatRelativeLabel,
  getSection,
  getSectionArray,
  ProjectionRenewal,
  sortRenewals,
} from "./success-projection-utils";

function RenewalCard({ renewal }: { renewal: ProjectionRenewal }) {
  const statusConfig = {
    onTrack: { label: "On Track", color: "bg-iw-forest-bright" },
    atRisk: { label: "At Risk", color: "bg-iw-gold" },
    critical: { label: "Critical", color: "bg-iw-red" },
    closedWon: { label: "Renewed", color: "bg-iw-slate-mid" },
    closedLost: { label: "Churned", color: "bg-gray-500" },
  } as const;

  const config = statusConfig[renewal.status] || statusConfig.onTrack;
  const daysLabel =
    renewal.daysUntilRenewal == null
      ? "Schedule pending"
      : renewal.daysUntilRenewal === 0
        ? "Today"
        : `${renewal.daysUntilRenewal} days left`;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{renewal.accountName}</h4>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5",
                  config.color.replace("bg-", "border-").replace("-500", "-200")
                )}
              >
                {config.label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="font-semibold">{formatCurrency(renewal.arr)} ARR</span>
              <span className="text-muted-foreground">•</span>
              <span
                className={cn(
                  renewal.daysUntilRenewal != null && renewal.daysUntilRenewal <= 7
                    ? "text-iw-red font-medium"
                    : "text-muted-foreground"
                )}
              >
                {daysLabel}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Renewal Confidence</span>
                <span className="font-medium">{Math.round(renewal.confidence || 0)}%</span>
              </div>
              <Progress value={renewal.confidence || 0} className="h-1.5" />
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>CSM: {renewal.assignedCSM || "Unassigned"}</span>
              <span>Last: {formatRelativeLabel(renewal.lastInteraction)}</span>
            </div>

            {renewal.expansionPotential > 0 && (
              <div className="mt-3 p-2 rounded bg-iw-forest/5 dark:bg-iw-forest/95/20 text-xs">
                <span className="text-iw-forest-mid font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {formatCurrency(renewal.expansionPotential)} expansion potential
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <HealthBadge score={renewal.healthScore || 0} size="sm" />
            <span className="text-[10px] text-muted-foreground">
              {formatDateLabel(renewal.renewalDate)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RenewalsView() {
  const [filter, setFilter] = useState<string>("all");
  const { data, isLoading, error } = useSuccessCSPage("renewals");

  const renewalsSection = getSection<ProjectionRenewal[]>(data, "renewals");
  const renewals = useMemo(
    () => sortRenewals(getSectionArray<ProjectionRenewal>(data, "renewals")),
    [data]
  );

  const filteredRenewals = useMemo(
    () =>
      renewals.filter((renewal) => {
        if (filter === "all") return true;
        if (filter === "atRisk") {
          return renewal.status === "atRisk" || renewal.status === "critical";
        }
        if (filter === "onTrack") return renewal.status === "onTrack";
        if (filter === "thisMonth") return (renewal.daysUntilRenewal || 9999) <= 30;
        return true;
      }),
    [filter, renewals]
  );

  const stats = useMemo(() => {
    const totalARR = renewals.reduce((sum, renewal) => sum + Number(renewal.arr || 0), 0);
    const atRiskARR = renewals
      .filter((renewal) => renewal.status === "atRisk" || renewal.status === "critical")
      .reduce((sum, renewal) => sum + Number(renewal.arr || 0), 0);
    const expansionPotential = renewals.reduce(
      (sum, renewal) => sum + Number(renewal.expansionPotential || 0),
      0
    );
    const avgConfidence =
      renewals.length > 0
        ? Math.round(
            renewals.reduce((sum, renewal) => sum + Number(renewal.confidence || 0), 0) /
              renewals.length
          )
        : 0;
    return { totalARR, atRiskARR, expansionPotential, avgConfidence };
  }, [renewals]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-iw-red mx-auto" />
          <h3 className="font-semibold">Failed to load renewals</h3>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Renewal Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage upcoming renewals · {coverageLabel(renewalsSection)}
          </p>
        </div>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Review renewals
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total ARR",
            value: formatCurrency(stats.totalARR),
            icon: <DollarSign className="w-4 h-4 text-primary" />,
            className: "",
          },
          {
            label: "At Risk ARR",
            value: formatCurrency(stats.atRiskARR),
            icon: <AlertCircle className="w-4 h-4 text-iw-red" />,
            className: "text-iw-red",
          },
          {
            label: "Expansion Potential",
            value: formatCurrency(stats.expansionPotential),
            icon: <TrendingUp className="w-4 h-4 text-iw-forest-bright" />,
            className: "text-iw-forest-bright",
          },
          {
            label: "Avg Confidence",
            value: `${stats.avgConfidence}%`,
            icon: <CheckCircle className="w-4 h-4 text-iw-slate-mid" />,
            className: "",
          },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-20" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {card.icon}
                    <span className="text-sm text-muted-foreground">{card.label}</span>
                  </div>
                  <p className={cn("text-2xl font-bold mt-1", card.className)}>{card.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {[
          { id: "all", label: "All Renewals" },
          { id: "thisMonth", label: "This Month" },
          { id: "onTrack", label: "On Track" },
          { id: "atRisk", label: "At Risk" },
        ].map((option) => (
          <Button
            key={option.id}
            variant={filter === option.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : filteredRenewals.length ? (
          filteredRenewals.map((renewal) => <RenewalCard key={renewal.id} renewal={renewal} />)
        ) : (
          <Card className="md:col-span-2">
            <CardContent className="p-8 text-center text-muted-foreground">
              No renewals are available for this filter yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
