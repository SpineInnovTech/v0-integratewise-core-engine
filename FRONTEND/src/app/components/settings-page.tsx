import { useState } from "react";
import {
  Shield, Users, RefreshCw, Bell, Lock, Globe, Palette, Database,
  ChevronRight, Check, X, Plus, UserPlus, Settings, Eye, Edit3, Trash2, RotateCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useSpine } from "./spine/spine-client";

const ROLES = [
  { id: "admin", label: "Admin", color: "bg-red-100 text-red-700", permissions: ["Full access", "RBAC management", "Billing", "Data export"] },
  { id: "manager", label: "Manager", color: "bg-blue-100 text-blue-700", permissions: ["Team data", "Reports", "Integrations", "Approval workflows"] },
  { id: "member", label: "Member", color: "bg-emerald-100 text-emerald-700", permissions: ["Own data", "Shared dashboards", "Intelligence insights"] },
  { id: "viewer", label: "Viewer", color: "bg-gray-100 text-gray-600", permissions: ["Read-only access", "Shared reports"] },
];

const TEAM_MEMBERS = [
  { id: "1", name: "Priya Sharma", email: "priya@company.com", role: "admin", initials: "PS", department: "Revenue Ops", lastActive: "Now" },
  { id: "2", name: "Arun Kumar", email: "arun@company.com", role: "manager", initials: "AK", department: "Sales", lastActive: "5m ago" },
  { id: "3", name: "Rajesh Mehta", email: "rajesh@company.com", role: "member", initials: "RM", department: "CS", lastActive: "1h ago" },
  { id: "4", name: "Anjali Patel", email: "anjali@company.com", role: "member", initials: "AP", department: "Marketing", lastActive: "3h ago" },
  { id: "5", name: "Vikram Rao", email: "vikram@company.com", role: "viewer", initials: "VR", department: "Engineering", lastActive: "1d ago" },
];

const SYNC_RULES = [
  { id: "1", name: "CS → Sales Handoff", from: "Customer Success", to: "Sales", entities: "Expansion signals, Usage data", frequency: "Real-time", status: "active" },
  { id: "2", name: "Sales → Finance", from: "Sales", to: "Finance", entities: "Closed deals, Revenue data", frequency: "Daily", status: "active" },
  { id: "3", name: "Support → CS Escalation", from: "Support", to: "Customer Success", entities: "P1 tickets, CSAT drops", frequency: "Real-time", status: "active" },
  { id: "4", name: "Marketing → Sales MQL", from: "Marketing", to: "Sales", entities: "Qualified leads, Campaign attribution", frequency: "Hourly", status: "paused" },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"rbac" | "team-sync" | "notifications" | "data" | "appearance">("rbac");
  const spine = useSpine();

  const handleResetOnboarding = () => {
    if (confirm("Are you sure you want to reset onboarding? This will log you out and you'll need to complete onboarding again.")) {
      // Clear all onboarding data from localStorage
      localStorage.removeItem("iw_onboarding_complete");
      localStorage.removeItem("iw_user_name");
      localStorage.removeItem("iw_user_role");
      localStorage.removeItem("iw_org_type");
      localStorage.removeItem("iw_active_ctx");
      localStorage.removeItem("iw_connected_apps");
      localStorage.removeItem("iw_onboarding_timestamp");
      
      // Reload to trigger re-onboarding
      window.location.reload();
    }
  };

  const tabs = [
    { id: "rbac" as const, label: "Access & Roles", icon: Shield },
    { id: "team-sync" as const, label: "Cross-Team Sync", icon: RefreshCw },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "data" as const, label: "Data & Privacy", icon: Lock },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage access, team sync rules, and workspace preferences.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === t.id ? "bg-[#3F5185] text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* RBAC Tab */}
        {activeTab === "rbac" && (
          <div className="space-y-6">
            {/* Roles */}
            <div>
              <h3 className="text-sm font-bold mb-3">Role Definitions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ROLES.map(role => (
                  <Card key={role.id} className="border shadow-sm">
                    <CardContent className="p-4">
                      <Badge className={`${role.color} border-0 mb-3`}>{role.label}</Badge>
                      <div className="space-y-1.5">
                        {role.permissions.map((p, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {p}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Team Members */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Team Members ({TEAM_MEMBERS.length})</h3>
                <Button size="sm" className="bg-[#3F5185] hover:bg-[#354775] text-xs h-8 gap-1"><UserPlus className="w-3 h-3" />Invite</Button>
              </div>
              <div className="space-y-2">
                {TEAM_MEMBERS.map(member => {
                  const role = ROLES.find(r => r.id === member.role)!;
                  return (
                    <Card key={member.id} className="border shadow-sm">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#3F5185] flex items-center justify-center text-white text-xs font-bold shrink-0">{member.initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">{member.name}</span>
                            <Badge className={`${role.color} border-0 text-[9px]`}>{role.label}</Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground">{member.email} · {member.department}</div>
                        </div>
                        <div className="text-[10px] text-muted-foreground shrink-0">{member.lastActive}</div>
                        <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0"><Edit3 className="w-3 h-3" /></Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cross-Team Sync Tab */}
        {activeTab === "team-sync" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Rules for how data and insights flow between departments automatically.</p>
              <Button size="sm" className="bg-[#3F5185] hover:bg-[#354775] text-xs h-8 gap-1"><Plus className="w-3 h-3" />New Rule</Button>
            </div>
            {SYNC_RULES.map(rule => (
              <Card key={rule.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">{rule.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Badge variant="outline" className="text-[9px]">{rule.from}</Badge>
                        <ChevronRight className="w-3 h-3" />
                        <Badge variant="outline" className="text-[9px]">{rule.to}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${rule.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${rule.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {rule.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Entities: <span className="font-medium text-foreground">{rule.entities}</span></span>
                    <span>Frequency: <span className="font-medium text-foreground">{rule.frequency}</span></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-3">
            {[
              { category: "Intelligence Alerts", items: ["Critical incidents", "Renewal risks", "Expansion signals", "Schema drift"] },
              { category: "Team Activity", items: ["Mentions", "Task assignments", "Approval requests", "Comments"] },
              { category: "Data Events", items: ["Sync failures", "New entities discovered", "Duplicate detected", "Goal threshold breached"] },
            ].map(group => (
              <Card key={group.category} className="border shadow-sm">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3">{group.category}</h4>
                  <div className="space-y-2">
                    {group.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-sm">{item}</span>
                        <div className="flex gap-3">
                          {["In-app", "Email", "Slack"].map(ch => (
                            <label key={ch} className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                              <input type="checkbox" className="rounded" defaultChecked={ch !== "Slack" || i < 2} />
                              {ch}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Data & Privacy Tab */}
        {activeTab === "data" && (
          <div className="space-y-3">
            {[
              { title: "Data Retention", description: "Configure how long synced data is stored before archival.", value: "12 months", icon: Database },
              { title: "Export Controls", description: "Manage who can export data and in what formats.", value: "Admin only", icon: Lock },
              { title: "API Access", description: "Manage API keys for programmatic access.", value: "2 active keys", icon: Globe },
              { title: "Audit Log", description: "Full audit trail of all actions and data access.", value: "12,847 events", icon: Eye },
            ].map((item, i) => (
              <Card key={i} className="border shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0"><item.icon className="w-5 h-5 text-muted-foreground" /></div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-sm font-medium">{item.value}</div>
                  <Button variant="outline" size="sm" className="text-xs h-7">Configure</Button>
                </CardContent>
              </Card>
            ))}
            
            {/* Reset Onboarding */}
            <Card className="border shadow-sm border-amber-200 bg-amber-50/30">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-amber-900">Reset Onboarding</h4>
                  <p className="text-xs text-amber-700">Clear all onboarding data and restart the setup process. You'll be logged out.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={handleResetOnboarding}
                >
                  Reset
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <div className="space-y-3">
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Theme</h4>
                <div className="flex gap-3">
                  {[
                    { label: "Light", active: true, preview: "bg-white border" },
                    { label: "Dark", active: false, preview: "bg-gray-900 border-gray-700" },
                    { label: "System", active: false, preview: "bg-gradient-to-r from-white to-gray-900" },
                  ].map(theme => (
                    <button key={theme.label} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${theme.active ? "border-[#3F5185]" : "border-transparent hover:border-border"}`}>
                      <div className={`w-16 h-10 rounded-lg ${theme.preview}`} />
                      <span className="text-xs font-medium">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Density</h4>
                <div className="flex gap-3">
                  {["Compact", "Comfortable", "Spacious"].map((d, i) => (
                    <button key={d} className={`flex-1 py-2 text-xs font-medium rounded-lg border-2 transition-all ${i === 1 ? "border-[#3F5185] bg-[#3F5185]/5" : "border-border hover:border-[#3F5185]/30"}`}>{d}</button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}