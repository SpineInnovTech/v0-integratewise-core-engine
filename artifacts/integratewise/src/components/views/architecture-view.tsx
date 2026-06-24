
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Target,
  Users,
  BarChart3,
  Workflow,
  Database,
  ArrowRight,
  ArrowDown,
  FileText,
  Layers,
  Server,
  Cloud,
  Monitor,
  Mail,
  GitBranch,
  Wand2,
  ShieldCheck,
  SearchCheck,
} from "lucide-react"

export function ArchitectureView() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">IntegrateWise OS Architecture</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          How Customer Zero — IntegrateWise's internal operations cockpit — runs on its own
          platform: a privileged client that reads and writes through a governed relay, never the
          database, with the Spine owning truth.
        </p>
      </div>

      {/* Three-repo split */}
      <Card className="border-2 border-slate-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-lg">The Three Repositories</CardTitle>
            <Badge variant="outline" className="ml-auto bg-slate-500/10 text-slate-600 border-slate-500/30">
              One platform · two clients
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold">integratewise-live</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The platform — the <strong>Spine</strong>. Owns truth on Cloudflare Workers + D1/KV.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-semibold">iwa-frontend</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The customer-facing product — another client of the Spine.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Monitor className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold">iwa-customer-zero</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This repo — the internal ops surface. IntegrateWise dogfooding its own platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Runtime path */}
      <div className="space-y-6">
        {/* Layer 1: Customer Zero client */}
        <Card
          className={`border-2 transition-all cursor-pointer ${activeLayer === "client" ? "border-blue-500 bg-blue-500/5" : "border-blue-500/30 hover:border-blue-500/60"}`}
          onClick={() => setActiveLayer(activeLayer === "client" ? null : "client")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Customer Zero — Internal Ops Surface</CardTitle>
              <Badge variant="outline" className="ml-auto bg-blue-500/10 text-blue-600 border-blue-500/30">
                iwa-customer-zero · React + Vite
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { icon: Home, name: "Home Dashboard" },
                { icon: Workflow, name: "Schema-First Ingestion" },
                { icon: Target, name: "Strategic Hub" },
                { icon: Users, name: "Sales Hub" },
                { icon: BarChart3, name: "Business Metrics" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                >
                  <item.icon className="h-4 w-4 text-blue-600 shrink-0" />
                  <p className="text-sm font-medium">{item.name}</p>
                </div>
              ))}
            </div>
            {activeLayer === "client" && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                A privileged client of the platform. It never touches a database directly — every
                read and write goes through the owned <code>/api</code> relay. Additional surfaces
                include Knowledge Hub, Clients, Projects, Tasks, Leads, Pipeline, Campaigns,
                Integrations, and Settings.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ArrowDown className="h-6 w-6" />
            <span className="text-xs">fetch /api — governed relay calls only</span>
          </div>
        </div>

        {/* Layer 2: Owned api-server relay */}
        <Card
          className={`border-2 transition-all cursor-pointer ${activeLayer === "relay" ? "border-green-500 bg-green-500/5" : "border-green-500/30 hover:border-green-500/60"}`}
          onClick={() => setActiveLayer(activeLayer === "relay" ? null : "relay")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Owned api-server Relay</CardTitle>
              <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-600 border-green-500/30">
                Express + Drizzle · local Postgres
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              A governed relay we own, mounted at <code>/api</code>. It is the only thing Customer
              Zero talks to, and it is swappable to <code>integratewise-live</code> later without
              changing this surface.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { path: "/api/schema/config", desc: "Resolve canonical schema = f(industry, department)" },
                { path: "/api/schema/deltas", desc: "Active additive, versioned schema deltas" },
                { path: "/api/ingest/gmail", desc: "Run the schema-first Gmail pipeline" },
                { path: "/api/leads", desc: "Operational reads served from the relay" },
              ].map((item, i) => (
                <div key={i} className="p-2 rounded bg-green-500/10 border border-green-500/20 text-xs">
                  <code className="text-green-700">{item.path}</code>
                  <p className="text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
            {activeLayer === "relay" && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                Writes to platform truth are never direct. The relay forwards them down the governed,
                human-in-the-loop path (<code>memory.propose</code> → <code>proposal.approve</code>)
                so the Spine remains the system of record.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ArrowDown className="h-6 w-6" />
            <span className="text-xs">governed writes — memory.propose → proposal.approve (HITL)</span>
          </div>
        </div>

        {/* Layer 3: The Spine (platform truth) */}
        <Card
          className={`border-2 transition-all cursor-pointer ${activeLayer === "spine" ? "border-emerald-500 bg-emerald-500/5" : "border-emerald-500/30 hover:border-emerald-500/60"}`}
          onClick={() => setActiveLayer(activeLayer === "spine" ? null : "spine")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-lg">The Spine — Platform Truth</CardTitle>
              <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                integratewise-live · Cloudflare Workers + D1/KV
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, name: "Identity & Tenancy" },
                { icon: Layers, name: "Canonical Schema" },
                { icon: Database, name: "Memory" },
                { icon: ShieldCheck, name: "Governance" },
                { icon: Cloud, name: "Cloudflare Workers" },
                { icon: Database, name: "D1 / KV Store" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                >
                  <item.icon className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-sm font-medium">{item.name}</p>
                </div>
              ))}
            </div>
            {activeLayer === "spine" && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                The Spine owns truth — identity, tenancy, schema, memory, and governance. Both
                <code> iwa-frontend</code> and Customer Zero are clients of it; neither is the source
                of record.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schema-first Gmail pipeline */}
        <Card className="border-2 border-cyan-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-lg">Flagship Pipeline — Schema-First Gmail Ingestion</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-3">
              {[
                { icon: Mail, label: "Connector", sub: "Gmail inbox" },
                { icon: GitBranch, label: "Schema Delta", sub: "additive · versioned" },
                { icon: Wand2, label: "Normalize", sub: "→ canonical" },
                { icon: ShieldCheck, label: "Govern", sub: "memory.propose (HITL)" },
                { icon: SearchCheck, label: "Verify", sub: "read-back" },
              ].map((item, i, arr) => (
                <div key={i} className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col items-center text-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 w-full">
                    <item.icon className="h-5 w-5 text-cyan-600 mb-1.5" />
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">{item.sub}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Gmail is the live connector. Each source maps onto an additive, versioned schema
                delta (the base canonical schema is never modified), is normalized into canonical
                records, then proposed to the Spine through the governed path and verified by reading
                truth back.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Customer Zero (client)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Owned /api relay</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span>Spine (platform truth)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span>iwa-frontend (sibling client)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cyan-500"></div>
            <span>Schema-first pipeline</span>
          </div>
        </div>
      </div>
    </div>
  )
}
