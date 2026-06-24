
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield, Palette, Database, Webhook } from "lucide-react"

export function SettingsView() {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen max-w-5xl">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Configure the Customer Zero workspace</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="bg-secondary/50 p-1.5 rounded-xl border border-border/50 w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="flex items-center gap-2 rounded-lg text-sm font-semibold tracking-wide uppercase px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1">
            <User className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 rounded-lg text-sm font-semibold tracking-wide uppercase px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2 rounded-lg text-sm font-semibold tracking-wide uppercase px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2 rounded-lg text-sm font-semibold tracking-wide uppercase px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1">
            <Webhook className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 focus-visible:outline-none">
          <Card className="bg-card border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-secondary/10">
              <CardTitle className="text-lg font-bold tracking-tight">Workspace Information</CardTitle>
              <CardDescription className="font-medium mt-1">Basic information about your workspace</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2 max-w-md">
                <Label htmlFor="workspace-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace Name</Label>
                <Input id="workspace-name" defaultValue="IntegrateWise" className="bg-muted/30 focus:bg-background h-11 rounded-xl transition-colors" />
              </div>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="workspace-url" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace URL</Label>
                <Input id="workspace-url" defaultValue="integratewise.app" className="bg-muted/30 focus:bg-background h-11 rounded-xl transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-secondary/10">
              <CardTitle className="text-lg font-bold tracking-tight">Account</CardTitle>
              <CardDescription className="font-medium mt-1">Your personal account settings</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2 max-w-md">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input id="email" type="email" defaultValue="admin@integratewise.com" className="bg-muted/30 focus:bg-background h-11 rounded-xl transition-colors" />
              </div>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Name</Label>
                <Input id="name" defaultValue="Admin User" className="bg-muted/30 focus:bg-background h-11 rounded-xl transition-colors" />
              </div>
              <Button className="rounded-full px-6 font-semibold tracking-wide shadow-md">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 focus-visible:outline-none">
          <Card className="bg-card border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-secondary/10">
              <CardTitle className="text-lg font-bold tracking-tight">Email Notifications</CardTitle>
              <CardDescription className="font-medium mt-1">Configure your email notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors">
                <div>
                  <p className="font-bold text-foreground">Task assignments</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Get notified when tasks are assigned to you</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors">
                <div>
                  <p className="font-bold text-foreground">Document updates</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Get notified when documents you follow are updated</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors">
                <div>
                  <p className="font-bold text-foreground">Weekly digest</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Receive a weekly summary of activity</p>
                </div>
                <Switch className="data-[state=checked]:bg-primary" />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors">
                <div>
                  <p className="font-bold text-foreground">Metric alerts</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Get notified when metrics hit thresholds</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 focus-visible:outline-none">
          <Card className="bg-card border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-secondary/10">
              <CardTitle className="text-lg font-bold tracking-tight">Theme</CardTitle>
              <CardDescription className="font-medium mt-1">Customize the appearance of your workspace</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors">
                <div>
                  <p className="font-bold text-foreground">Dark mode</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Use dark theme for the interface</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors">
                <div>
                  <p className="font-bold text-foreground">Compact mode</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Reduce spacing for denser layouts</p>
                </div>
                <Switch className="data-[state=checked]:bg-primary" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6 focus-visible:outline-none">
          <Card className="bg-card border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-secondary/10">
              <CardTitle className="text-lg font-bold tracking-tight">Connected Services</CardTitle>
              <CardDescription className="font-medium mt-1">Manage your connected integrations</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-5 rounded-2xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center shadow-sm">
                    <Database className="h-5 w-5 text-foreground/70" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Database</p>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">Connect your data sources</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-full px-5 font-semibold bg-background">
                  Connect
                </Button>
              </div>
              <div className="flex items-center justify-between p-5 rounded-2xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center shadow-sm">
                    <Shield className="h-5 w-5 text-foreground/70" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">SSO Provider</p>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">Single sign-on authentication</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-full px-5 font-semibold bg-background">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-5 rounded-2xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center shadow-sm">
                    <Webhook className="h-5 w-5 text-foreground/70" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Webhooks</p>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">Automate workflows with webhooks</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-full px-5 font-semibold bg-background">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
