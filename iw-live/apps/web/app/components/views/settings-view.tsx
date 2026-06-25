"use client"

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
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Workspace Information</CardTitle>
              <CardDescription>Basic information about your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input id="workspace-name" defaultValue="IntegrateWise" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-url">Workspace URL</Label>
                <Input id="workspace-url" defaultValue="integratewise.app" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your personal account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="admin@integratewise.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue="Admin User" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure your email notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground">Task assignments</p>
                  <p className="text-sm text-muted-foreground">Get notified when tasks are assigned to you</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground">Document updates</p>
                  <p className="text-sm text-muted-foreground">Get notified when documents you follow are updated</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground">Weekly digest</p>
                  <p className="text-sm text-muted-foreground">Receive a weekly summary of activity</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground">Metric alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when metrics hit thresholds</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize the appearance of your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground">Dark mode</p>
                  <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground">Compact mode</p>
                  <p className="text-sm text-muted-foreground">Reduce spacing for denser layouts</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>Manage your connected integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-card-foreground">Database</p>
                    <p className="text-sm text-muted-foreground">Connect your data sources</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-card-foreground">SSO Provider</p>
                    <p className="text-sm text-muted-foreground">Single sign-on authentication</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Webhook className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-card-foreground">Webhooks</p>
                    <p className="text-sm text-muted-foreground">Automate workflows with webhooks</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
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
