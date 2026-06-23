"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";

export interface GovernanceItem {
  id: string;
  continuityType: string;
  governanceState:
    | "proposed"
    | "triaged"
    | "linked"
    | "governed"
    | "approved"
    | "live"
    | "projected"
    | "archived";
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  hitlRequired: boolean;
  createdAt: string;
}

export interface GovernancePanelProps {
  items: GovernanceItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
  onDefer: (id: string) => void;
  className?: string;
}

const stateConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  proposed: { label: "Proposed", variant: "outline" },
  triaged: { label: "Triaged", variant: "secondary" },
  linked: { label: "Linked", variant: "secondary" },
  governed: { label: "Governed", variant: "default" },
  approved: { label: "Approved", variant: "default" },
  live: { label: "Live", variant: "default" },
  projected: { label: "Projected", variant: "outline" },
  archived: { label: "Archived", variant: "secondary" },
};

export function GovernancePanel({
  items,
  onApprove,
  onReject,
  onEdit,
  onDefer,
  className,
}: GovernancePanelProps) {
  const pendingItems = items.filter((i) =>
    ["proposed", "triaged", "governed"].includes(i.governanceState)
  );

  return (
    <Card className={cn("p-0 gap-0 overflow-hidden", className)}>
      <CardHeader className="px-4 py-3 border-b border-[#d8d0c0] flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Governance Queue</CardTitle>
        {pendingItems.length > 0 && (
          <Badge variant="destructive" className="text-[10px] h-5">
            {pendingItems.length} pending
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {items.map((item, index) => {
            const state = stateConfig[item.governanceState] || stateConfig.proposed;
            const isPending = ["proposed", "triaged", "governed"].includes(item.governanceState);

            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col gap-2 px-4 py-3",
                  index < items.length - 1 && "border-b border-[#d8d0c0]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground">{item.continuityType}</span>
                  </div>
                  <Badge variant={state.variant} className="text-[10px] h-5 shrink-0">
                    {state.label}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>

                {item.evidence.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Evidence:</span>
                    <div className="flex flex-wrap gap-1">
                      {item.evidence.map((e) => (
                        <span key={e} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {item.confidence}% confidence
                  </span>
                  {isPending && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2"
                        onClick={() => onDefer(item.id)}
                      >
                        Defer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2"
                        onClick={() => onEdit(item.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        onClick={() => onReject(item.id)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => onApprove(item.id)}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No governance items. All continuity objects are live.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
