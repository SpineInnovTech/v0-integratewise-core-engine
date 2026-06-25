import { Code, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function APIPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">API Reference</h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Build custom integrations and automations with the IntegrateWise API.
            </p>
          </div>
        </div>
      </section>

      {/* API Overview */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold">REST API</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                The IntegrateWise REST API allows you to programmatically access and manipulate your workspace data,
                integrations, and AI agents.
              </p>
              <div className="mt-8 space-y-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    <span className="font-mono text-sm font-medium">Base URL</span>
                  </div>
                  <code className="mt-2 block rounded bg-muted p-2 text-sm">https://api.integratewise.com/v1</code>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    <span className="font-mono text-sm font-medium">Authentication</span>
                  </div>
                  <code className="mt-2 block rounded bg-muted p-2 text-sm">Authorization: Bearer YOUR_API_KEY</code>
                </div>
              </div>
              <div className="mt-8">
                <Button>Get API Key</Button>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold">Quick Start</h2>
              <div className="mt-4 rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Example: Fetch workspace data</p>
                <pre className="mt-4 overflow-x-auto rounded bg-muted p-4 text-xs">
                  <code>{`curl https://api.integratewise.com/v1/workspace \\
  -H "Authorization: Bearer YOUR_API_KEY"

{
  "id": "ws_123abc",
  "name": "My Workspace",
  "integrations": [...],
  "agents": [...]
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="border-t border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">API Endpoints</h2>
          <div className="mt-12 space-y-6">
            {[
              { method: "GET", endpoint: "/workspace", desc: "Get workspace information" },
              { method: "GET", endpoint: "/integrations", desc: "List all integrations" },
              { method: "POST", endpoint: "/integrations", desc: "Connect a new integration" },
              { method: "GET", endpoint: "/agents", desc: "List AI agents" },
              { method: "POST", endpoint: "/agents/:id/invoke", desc: "Invoke an AI agent" },
              { method: "GET", endpoint: "/spine/entities", desc: "Query the Spine data layer" },
              { method: "POST", endpoint: "/render", desc: "Generate output from data" },
            ].map((item) => (
              <Card key={item.endpoint} className="border-border">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <span
                      className={`rounded px-2 py-1 font-mono text-xs font-medium ${
                        item.method === "GET" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
                      }`}
                    >
                      {item.method}
                    </span>
                    <code className="font-mono text-sm">{item.endpoint}</code>
                    <span className="ml-auto text-sm text-muted-foreground">{item.desc}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Official SDKs</h2>
            <p className="mt-4 text-muted-foreground">Use our official client libraries for your preferred language.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
            {[
              { name: "JavaScript / TypeScript", npm: "npm i @integratewise/sdk" },
              { name: "Python", npm: "pip install integratewise" },
              { name: "Go", npm: "go get github.com/integratewise/go-sdk" },
            ].map((sdk) => (
              <Card key={sdk.name} className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold">{sdk.name}</h3>
                  <code className="mt-4 block rounded bg-muted p-2 text-xs">{sdk.npm}</code>
                  <Button variant="outline" size="sm" className="mt-4 w-full bg-transparent">
                    View Docs
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
