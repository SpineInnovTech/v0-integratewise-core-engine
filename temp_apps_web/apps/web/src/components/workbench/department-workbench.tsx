"use client";

/**
 * Department Workbench — Generic Configuration-Driven Workbench
 *
 * Doctrine: Every other workbench is a configuration, not a new product.
 *
 * Usage:
 *   <DepartmentWorkbench
 *     department="CUSTOMER_SUCCESS"
 *     title="Account Success"
 *     entityTypes={["account", "contact", "success_plan", "risk"]}
 *     metrics={[
 *       { id: "arr", label: "ARR", entityType: "account", field: "arr", type: "currency" },
 *       ...
 *     ]}
 *   />
 */

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { Loader2, Users, Brain } from "lucide-react";
import { useProjection } from "@/lib/projection";
import { useSpineEntitiesBatch, useSpineEntityCounts } from "@/hooks/use-workspace-entities";
import { useGovernanceQueue } from "@/hooks/use-governance-queue";
import {
  MetricTile,
  EntityCard,
  InsightBlock,
  TimelineStream,
  GovernancePanel,
  OperationalCanvas,
  HealthRing,
} from "@/components/workbench/primitives";
import { OrgView } from "./views/org-view";
import { PersonalView } from "./views/personal-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface DepartmentWorkbenchMetric {
  id: string;
  label: string;
  entityType: string;
  field: string;
  type: "number" | "currency" | "percentage" | "trend";
  icon?: React.ReactNode;
}

export interface DepartmentWorkbenchProps {
  department: string;
  title: string;
  entityTypes: string[];
  metrics: DepartmentWorkbenchMetric[];
  icon?: React.ReactNode;
}

function formatValue(value: number, type: string): string {
  if (type === "currency") return `₹${(value / 1e5).toFixed(1)}L`;
  if (type === "percentage") return `${value}%`;
  return value.toLocaleString();
}

export function DepartmentWorkbench({
  department,
  title,
  entityTypes,
  metrics,
  icon,
}: DepartmentWorkbenchProps) {
  const navigate = useNavigate();
  const { user, tenant, canAct, canApprove, isLoading, error } = useProjection();
  const [activeTab, setActiveTab] = useState("work");

  const { data: batchData, isLoading: entitiesLoading } = useSpineEntitiesBatch(entityTypes);
  const { counts } = useSpineEntityCounts(entityTypes);
  const { items: governanceItems, approve, reject } = useGovernanceQueue();

  const metricTiles = useMemo(
    () =>
      metrics.map((m) => ({
        ...m,
        value: counts[m.entityType] ?? 0,
        formatted: formatValue(counts[m.entityType] ?? 0, m.type),
      })),
    [metrics, counts]
  );

  const entityCards = useMemo(() => {
    const cards: any[] = [];
    for (const et of entityTypes.slice(0, 3)) {
      const rows = batchData[et] ?? [];
      for (const row of rows.slice(0, 2)) {
        cards.push({
          id: row.id,
          name: row.name || row.account_name || "Untitled",
          entityType: et,
          healthScore: row.health_score,
          status: row.status,
          sources: [row.source],
          fields: Object.keys(row)
            .slice(0, 2)
            .map((k) => ({ label: k.replace(/_/g, " "), value: row[k] })),
        });
      }
    }
    return cards;
  }, [batchData, entityTypes]);

  const handleApprove = useCallback(
    async (id: string) => {
      await approve({ id });
    },
    [approve]
  );

  const handleReject = useCallback(
    async (id: string) => {
      await reject({ id, reason: "Rejected from Workbench" });
    },
    [reject]
  );

  if (isLoading || entitiesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">Projection failed</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {tenant.industryVertical} · {department} · {user.role}
            </p>
          </div>
          <HealthRing label="Health" score={92} size={60} strokeWidth={4} status="healthy" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="work">My Department</TabsTrigger>
            <TabsTrigger value="org">Organization</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="work" className="flex-1 overflow-y-auto mt-0">
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metricTiles.map((m) => (
                <MetricTile
                  key={m.id}
                  label={m.label}
                  value={m.value}
                  formatted={m.formatted}
                  icon={m.icon}
                />
              ))}
            </div>

            <OperationalCanvas
              title={title}
              subtitle={`Live projection of ${department.toLowerCase()} reality`}
              sections={[
                {
                  id: "entities",
                  label: "Active Entities",
                  width: "half",
                  component: (
                    <div className="grid grid-cols-1 gap-3">
                      {entityCards.map((card) => (
                        <EntityCard
                          key={card.id}
                          id={card.id}
                          name={card.name}
                          entityType={card.entityType}
                          healthScore={card.healthScore}
                          status={card.status}
                          sources={card.sources}
                          fields={card.fields}
                          actions={
                            canAct
                              ? [
                                  {
                                    label: "Open",
                                    onClick: () => navigate(`/work/entity/${card.id}`),
                                  },
                                ]
                              : []
                          }
                        />
                      ))}
                    </div>
                  ),
                },
                {
                  id: "governance",
                  label: "Governance Queue",
                  width: "half",
                  component: canApprove ? (
                    <GovernancePanel
                      items={governanceItems}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onEdit={() => {}}
                      onDefer={() => {}}
                    />
                  ) : (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      Governance queue visible to elevated roles.
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="org" className="flex-1 overflow-y-auto mt-0">
          <OrgView />
        </TabsContent>

        <TabsContent value="personal" className="flex-1 overflow-y-auto mt-0">
          <PersonalView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
