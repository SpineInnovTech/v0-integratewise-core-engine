/**
 * Risk Matrix View — Visual risk assessment grid
 * Uses success page projections to render live risk posture.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, Plus, Shield, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";
import { useSuccessCSPage } from "@/hooks/use-cs-data";
import {
  coverageLabel,
  formatRelativeLabel,
  getSection,
  getSectionArray,
  ProjectionRisk,
  TechnicalAssetProjection,
} from "./success-projection-utils";

const likelihoods = ["high", "medium", "low"] as const;
const impacts = ["high", "medium", "low"] as const;

const severityMatrix: Record<string, Record<string, string>> = {
  low: { low: "bg-iw-forest/10", medium: "bg-iw-gold/10", high: "bg-iw-gold-light/10" },
  medium: { low: "bg-iw-gold/10", medium: "bg-iw-gold-light/10", high: "bg-iw-red/10" },
  high: { low: "bg-iw-gold-light/10", medium: "bg-iw-red/10", high: "bg-red-200" },
};

function getSeverityLabel(likelihood: string, impact: string) {
  if (likelihood === "high" && impact === "high") return "Critical";
  if (likelihood === "high" || impact === "high") return "High";
  if (likelihood === "medium" && impact === "medium") return "Medium";
  return "Low";
}

function RiskCard({ risk }: { risk: ProjectionRisk }) {
  const severity = getSeverityLabel(risk.likelihood, risk.impact);
  const severityColors = {
    Critical: "text-iw-red bg-iw-red/5 border-iw-red/20",
    High: "text-iw-gold bg-iw-gold/5 border-iw-gold-light/20",
    Medium: "text-iw-gold bg-iw-gold/5 border-iw-gold/20",
    Low: "text-iw-forest-mid bg-iw-forest/5 border-iw-forest/20",
  };

  const statusColors = {
    active: "text-iw-red",
    mitigating: "text-iw-gold",
    resolved: "text-iw-forest-bright",
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">{risk.name}</h4>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5",
                  severityColors[severity as keyof typeof severityColors]
                )}
              >
                {severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{risk.description}</p>

            <div className="flex items-center gap-3 mt-3 text-xs">
              <span
                className={cn(
                  "font-medium",
                  statusColors[risk.status as keyof typeof statusColors] || "text-muted-foreground"
                )}
              >
                {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
              </span>
              <span className="text-muted-foreground">Owner: {risk.owner}</span>
              <span className="text-muted-foreground">
                Detected {formatRelativeLabel(risk.detectedAt)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RiskMatrixView() {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const { data, isLoading, error } = useSuccessCSPage("risks");

  const registerSection = getSection<ProjectionRisk[]>(data, "register");
  const technicalContextSection = getSection<TechnicalAssetProjection[]>(data, "technical_context");
  const risks = useMemo(() => getSectionArray<ProjectionRisk>(data, "register"), [data]);
  const technicalAssets = useMemo(
    () => getSectionArray<TechnicalAssetProjection>(data, "technical_context"),
    [data]
  );

  const getRisksForCell = (likelihood: string, impact: string) =>
    risks.filter((risk) => risk.likelihood === likelihood && risk.impact === impact);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-10 h-10 text-iw-red mx-auto" />
          <h3 className="font-semibold">Failed to load risk matrix</h3>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Risk Matrix</h2>
          <p className="text-sm text-muted-foreground">
            Likelihood vs impact assessment · {coverageLabel(registerSection)}
          </p>
        </div>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Review risks
        </Button>
      </div>

      <div className="grid grid-cols-[auto_repeat(3,1fr)] gap-2">
        <div className="flex items-end justify-end pb-2 pr-2">
          <span className="text-xs text-muted-foreground font-medium">
            Likelihood →<br />↓ Impact
          </span>
        </div>
        {impacts.map((impact) => (
          <div key={impact} className="text-center pb-2">
            <span className="text-xs font-medium uppercase">{impact}</span>
          </div>
        ))}

        {likelihoods.map((likelihood) => (
          <div key={likelihood} className="contents">
            <div className="flex items-center justify-end pr-4">
              <span className="text-xs font-medium uppercase">{likelihood}</span>
            </div>
            {impacts.map((impact) => {
              const cellRisks = getRisksForCell(likelihood, impact);
              const activeCount = cellRisks.filter((risk) => risk.status === "active").length;
              const isSelected = selectedCell === `${likelihood}-${impact}`;

              return (
                <button
                  key={impact}
                  onClick={() => setSelectedCell(isSelected ? null : `${likelihood}-${impact}`)}
                  className={cn(
                    "relative rounded-lg p-3 min-h-[80px] transition-all",
                    severityMatrix[likelihood]?.[impact] || "bg-gray-100",
                    isSelected && "ring-2 ring-primary ring-inset"
                  )}
                >
                  {isLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : cellRisks.length > 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-lg font-bold">{cellRisks.length}</span>
                      <span className="text-[10px] text-muted-foreground">risks</span>
                      {activeCount > 0 && (
                        <Badge variant="destructive" className="mt-1 text-[9px] px-1">
                          {activeCount} active
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">0</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {selectedCell ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">
              {selectedCell.split("-")[0].charAt(0).toUpperCase() +
                selectedCell.split("-")[0].slice(1)}{" "}
              Likelihood ×{" "}
              {selectedCell.split("-")[1].charAt(0).toUpperCase() +
                selectedCell.split("-")[1].slice(1)}{" "}
              Impact Risks
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getRisksForCell(selectedCell.split("-")[0], selectedCell.split("-")[1]).map((risk) => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">All Active Risks</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </>
            ) : risks.length ? (
              risks.map((risk) => <RiskCard key={risk.id} risk={risk} />)
            ) : (
              <Card className="md:col-span-2">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No risks are available yet.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {technicalAssets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Technical Context</h3>
            <span className="text-xs text-muted-foreground">
              {coverageLabel(technicalContextSection)}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {technicalAssets.slice(0, 6).map((asset) => (
              <Card key={asset.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-medium text-sm">{asset.name}</h4>
                      <p className="text-xs text-muted-foreground">{asset.type}</p>
                    </div>
                    <Badge variant="outline">{asset.healthStatus}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Owner: {asset.ownerTeam || "Unassigned"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
