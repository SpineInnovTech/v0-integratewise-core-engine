"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Server,
  Clock,
  Zap,
  Database,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router";

// All 17 Cloudflare Workers in the system
const CLOUDFLARE_WORKERS = [
  {
    name: "gateway",
    displayName: "CF Gateway",
    description: "API gateway, JWT validation, rate limiting",
    url: "gateway.dev.integratewise.ai",
    critical: true,
  },
  {
    name: "pipeline",
    displayName: "Pipeline (Normalizer)",
    description: "8-stage data pipeline, sole Spine writer",
    url: "integratewise-pipeline.connect-a1b.workers.dev",
    critical: true,
  },
  {
    name: "connector",
    displayName: "Connector (Intake)",
    description: "Connector OAuth, data ingestion, storage",
    url: "integratewise-connector.connect-a1b.workers.dev",
    critical: true,
  },
  {
    name: "intelligence",
    displayName: "Intelligence (Mind)",
    description: "AI router, reasoning, OpenRouter/Workers AI",
    url: "intelligence.dev.integratewise.ai",
    critical: true,
  },
  {
    name: "knowledge",
    displayName: "Knowledge",
    description: "KB ingestion, org_memory, publication",
    url: "integratewise-knowledge.connect-a1b.workers.dev",
    critical: false,
  },
  {
    name: "mcp-connector",
    displayName: "MCP Connector",
    description: "18 MCP tools, OAuth 2.0, JWKS",
    url: "mcp.integratewise.ai",
    critical: true,
  },
  {
    name: "continuity",
    displayName: "Continuity",
    description: "Session state, conversational memory cache",
    url: "continuity.dev.integratewise.ai",
    critical: false,
  },
  {
    name: "admin",
    displayName: "Admin",
    description: "Tenant/user/workspace CRUD, admin API",
    url: "admin.dev.integratewise.ai",
    critical: false,
  },
  {
    name: "billing",
    displayName: "Billing",
    description: "Stripe/Razorpay, subscriptions, usage tracking",
    url: "billing.dev.integratewise.ai",
    critical: true,
  },
  {
    name: "tenants",
    displayName: "Tenants",
    description: "Context resolution, RBAC, SSO config",
    url: "tenants.dev.integratewise.ai",
    critical: true,
  },
  {
    name: "connector-sync",
    displayName: "Connector Sync",
    description: "Delta polling, background sync orchestration",
    url: "connector-sync.dev.integratewise.ai",
    critical: false,
  },
  {
    name: "webhook-ingress",
    displayName: "Webhook Ingress",
    description: "Webhook intake membrane (Nango/Stripe events)",
    url: "webhook-ingress.dev.integratewise.ai",
    critical: false,
  },
  {
    name: "folder-watcher",
    displayName: "Folder Watcher",
    description: "Durable Object filesystem monitor",
    url: "folder-watcher.dev.integratewise.ai",
    critical: false,
  },
  {
    name: "workflow",
    displayName: "Workflow",
    description: "Workflow orchestration triggers (Queues)",
    url: "workflow.dev.integratewise.ai",
    critical: false,
  },
  {
    name: "twin-orchestrator",
    displayName: "Twin Orchestrator",
    description: "Cognitive orchestrator (observe, reason, propose)",
    url: "twin.dev.integratewise.ai",
    critical: true,
  },
  {
    name: "l2",
    displayName: "L2 (Awareness)",
    description: "Entity 360, high-order cognitive overlay",
    url: "l2.dev.integratewise.ai",
    critical: false,
  },
  {
    name: "hermes",
    displayName: "Hermes",
    description: "Agent runtime utility",
    url: "hermes.dev.integratewise.ai",
    critical: false,
  },
];

interface WorkerHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency_p50: number;
  latency_p95: number;
  latency_p99: number;
  requests_per_min: number;
  error_rate: number;
  cpu_percent: number;
  memory_mb: number;
  durable_objects_count?: number;
  last_check: string;
}

export function ObservabilityPage() {
  // Fetch worker health from admin API
  const { data: healthData, isLoading } = useQuery({
    queryKey: ["admin", "workers", "health"],
    queryFn: async () => {
      const response = await fetch("/api/v1/admin/workers/health", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch worker health");
      return response.json() as Promise<{ workers: WorkerHealth[] }>;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const workers = healthData?.workers || [];

  // Calculate aggregate metrics
  const healthyCount = workers.filter((w) => w.status === "healthy").length;
  const degradedCount = workers.filter((w) => w.status === "degraded").length;
  const downCount = workers.filter((w) => w.status === "down").length;
  const totalRequests = workers.reduce((sum, w) => sum + (w.requests_per_min || 0), 0);
  const avgErrorRate =
    workers.length > 0
      ? workers.reduce((sum, w) => sum + (w.error_rate || 0), 0) / workers.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Observability</h1>
        <p className="text-slate-600 mt-1">
          Real-time health and performance metrics for all Cloudflare Workers
        </p>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{CLOUDFLARE_WORKERS.length}</div>
            <p className="text-xs text-muted-foreground">
              {healthyCount} healthy · {degradedCount} degraded · {downCount} down
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/min</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all workers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgErrorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Average across all workers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {((healthyCount / CLOUDFLARE_WORKERS.length) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Workers operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Workers List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Workers ({CLOUDFLARE_WORKERS.length})</TabsTrigger>
          <TabsTrigger value="critical">
            Critical ({CLOUDFLARE_WORKERS.filter((w) => w.critical).length})
          </TabsTrigger>
          <TabsTrigger value="degraded">Issues ({degradedCount + downCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {CLOUDFLARE_WORKERS.map((worker) => {
            const health = workers.find((w) => w.name === worker.name);
            return <WorkerCard key={worker.name} worker={worker} health={health} />;
          })}
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          {CLOUDFLARE_WORKERS.filter((w) => w.critical).map((worker) => {
            const health = workers.find((w) => w.name === worker.name);
            return <WorkerCard key={worker.name} worker={worker} health={health} />;
          })}
        </TabsContent>

        <TabsContent value="degraded" className="space-y-4">
          {CLOUDFLARE_WORKERS.filter((worker) => {
            const health = workers.find((w) => w.name === worker.name);
            return health && (health.status === "degraded" || health.status === "down");
          }).map((worker) => {
            const health = workers.find((w) => w.name === worker.name);
            return <WorkerCard key={worker.name} worker={worker} health={health} />;
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkerCard({
  worker,
  health,
}: {
  worker: (typeof CLOUDFLARE_WORKERS)[0];
  health?: WorkerHealth;
}) {
  const status = health?.status || "unknown";
  const statusColor = {
    healthy: "text-green-600 bg-green-50",
    degraded: "text-yellow-600 bg-yellow-50",
    down: "text-red-600 bg-red-50",
    unknown: "text-gray-600 bg-gray-50",
  }[status];

  const statusIcon = {
    healthy: <CheckCircle2 className="h-4 w-4" />,
    degraded: <AlertTriangle className="h-4 w-4" />,
    down: <Radio className="h-4 w-4" />,
    unknown: <Clock className="h-4 w-4" />,
  }[status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{worker.displayName}</CardTitle>
              {worker.critical && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                  CRITICAL
                </Badge>
              )}
              <Badge className={`text-xs ${statusColor}`}>
                {statusIcon}
                <span className="ml-1 capitalize">{status}</span>
              </Badge>
            </div>
            <CardDescription>{worker.description}</CardDescription>
            <p className="text-xs text-muted-foreground font-mono">{worker.url}</p>
          </div>
          <Link
            to={`/admin/observability/${worker.name}`}
            className="text-sm text-iw-forest hover:underline"
          >
            View Details →
          </Link>
        </div>
      </CardHeader>

      {health && (
        <CardContent className="space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Requests/min</p>
              <p className="text-lg font-semibold">{health.requests_per_min.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Error Rate</p>
              <p className="text-lg font-semibold">{health.error_rate.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Latency P95</p>
              <p className="text-lg font-semibold">{health.latency_p95}ms</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CPU</p>
              <p className="text-lg font-semibold">{health.cpu_percent}%</p>
            </div>
          </div>

          {/* Latency Distribution */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">P50: {health.latency_p50}ms</span>
              <span className="text-muted-foreground">P95: {health.latency_p95}ms</span>
              <span className="text-muted-foreground">P99: {health.latency_p99}ms</span>
            </div>
            <Progress value={(health.latency_p95 / 1000) * 100} className="h-2" />
          </div>

          {/* Durable Objects (if applicable) */}
          {health.durable_objects_count !== undefined && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              <span>{health.durable_objects_count} active Durable Objects</span>
            </div>
          )}

          {/* Last Check */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last check: {new Date(health.last_check).toLocaleTimeString()}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
