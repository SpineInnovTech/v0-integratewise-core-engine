import { Metadata } from "next";
import Link from "next/link";
import { Plug, Search, Check, Plus, ExternalLink, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Integrations | IntegrateWise",
  description: "Connect your favorite tools and services",
};

const connectedIntegrations = [
  { name: "Notion", status: "connected", lastSync: "2 min ago", icon: "N" },
  { name: "Slack", status: "connected", lastSync: "5 min ago", icon: "S" },
  { name: "Google Calendar", status: "connected", lastSync: "10 min ago", icon: "G" },
];

const availableIntegrations = [
  { name: "Salesforce", category: "CRM", description: "Sync customer data and deals" },
  { name: "HubSpot", category: "CRM", description: "Marketing and sales automation" },
  { name: "Stripe", category: "Finance", description: "Payment and billing data" },
  { name: "GitHub", category: "Development", description: "Code and project management" },
  { name: "Zendesk", category: "Support", description: "Customer support tickets" },
  { name: "Intercom", category: "Support", description: "Customer messaging platform" },
  { name: "Asana", category: "Productivity", description: "Task and project tracking" },
  { name: "Linear", category: "Development", description: "Issue tracking for teams" },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
              <Plug className="h-4 w-4 text-brand" />
            </div>
            <span className="text-lg font-semibold">Integrations</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/knowledge" className="text-sm text-muted-foreground hover:text-foreground">
              Knowledge
            </Link>
            <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
              Settings
            </Link>
            <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search integrations..." className="pl-10" />
          </div>
        </div>

        {/* Connected integrations */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Connected</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connectedIntegrations.map((integration) => (
              <Card key={integration.name}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand font-semibold">
                      {integration.icon}
                    </div>
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Synced {integration.lastSync}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Available integrations */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Available Integrations</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {availableIntegrations.map((integration) => (
              <Card key={integration.name} className="hover:border-brand/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground font-semibold">
                      {integration.name[0]}
                    </div>
                    <Badge variant="secondary">{integration.category}</Badge>
                  </div>
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{integration.description}</CardDescription>
                  <Button variant="outline" className="w-full" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Request integration */}
        <Card className="mt-12 bg-muted/30">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <h3 className="font-semibold">Don&apos;t see what you need?</h3>
              <p className="text-sm text-muted-foreground">
                Request a new integration or build your own with our API.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                Request Integration
              </Button>
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                API Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
