import { useState } from "react";
import {
  Settings,
  Bell,
  Users,
  HeartPulse,
  Database,
  Globe,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSpine } from "@/components/l2/spine/spine-client";

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function SettingsView() {
  const spine = useSpine();
  const connectedApps = spine.connectedApps ?? [];
  const [notificationSettings, setNotificationSettings] = useState<SettingToggle[]>([
    {
      id: "health-alerts",
      label: "Health Score Alerts",
      description: "Notify when an account's health drops below threshold",
      enabled: true,
    },
    {
      id: "renewal-reminders",
      label: "Renewal Reminders",
      description: "Alerts for upcoming renewals within 60 days",
      enabled: true,
    },
    {
      id: "risk-escalations",
      label: "Risk Escalations",
      description: "Immediate alerts for critical risk register changes",
      enabled: true,
    },
    {
      id: "engagement-digest",
      label: "Engagement Digest",
      description: "Daily summary of engagement activity across accounts",
      enabled: false,
    },
    {
      id: "insight-notifications",
      label: "AI Insight Notifications",
      description: "L2 intelligence insights pushed to notification center",
      enabled: true,
    },
  ]);

  const dataSettings: SettingToggle[] = [
    {
      id: "auto-refresh",
      label: "Auto-Refresh Data",
      description: "Automatically refresh projections every 5 minutes",
      enabled: true,
    },
    {
      id: "stale-indicators",
      label: "Stale Data Indicators",
      description: "Show visual indicators when data is past TTL",
      enabled: true,
    },
    {
      id: "offline-cache",
      label: "Offline Cache",
      description: "Cache latest snapshot for offline access",
      enabled: false,
    },
  ];

  const toggleSetting = (settingId: string) => {
    setNotificationSettings((prev) =>
      prev.map((s) => (s.id === settingId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Account Success Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure notifications, data preferences, and team settings for the CSM workspace.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-iw-gold" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-sm font-medium">{setting.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{setting.description}</div>
                </div>
                <button onClick={() => toggleSetting(setting.id)} className="flex-shrink-0">
                  {setting.enabled ? (
                    <ToggleRight className="w-8 h-8 text-[var(--iw-success)]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                  )}
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-iw-slate-mid" />
              Data Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-sm font-medium">{setting.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{setting.description}</div>
                </div>
                <div className="flex-shrink-0">
                  {setting.enabled ? (
                    <ToggleRight className="w-8 h-8 text-[var(--iw-success)]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-iw-forest-bright" />
              Health Score Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground">Healthy</div>
                <div className="text-2xl font-semibold text-iw-forest-mid mt-1">&ge; 80</div>
                <div className="text-xs text-muted-foreground mt-1">No action required</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground">At Risk</div>
                <div className="text-2xl font-semibold text-iw-gold mt-1">60 – 79</div>
                <div className="text-xs text-muted-foreground mt-1">Monitor closely</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground">Critical</div>
                <div className="text-2xl font-semibold text-iw-red mt-1">&lt; 60</div>
                <div className="text-xs text-muted-foreground mt-1">Immediate intervention</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-iw-slate-mid" />
              Team & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium">Default View</div>
                <div className="text-xs text-muted-foreground">
                  Landing page when entering Account Success
                </div>
              </div>
              <Badge variant="secondary">Home Dashboard</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium">Intelligence Access</div>
                <div className="text-xs text-muted-foreground">
                  L2 cognitive overlay permissions
                </div>
              </div>
              <Badge className="bg-iw-slate-mid/10 text-iw-slate">Full Access</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium">Data Sources</div>
                <div className="text-xs text-muted-foreground">
                  Connected systems feeding the CSM model
                </div>
              </div>
              <Badge className="bg-iw-slate/10 text-iw-slate">
                {connectedApps.length > 0 ? `${connectedApps.length} Connected` : "None"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-iw-forest-bright" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectedApps.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No integrations connected yet.</p>
                <p className="text-xs mt-1">
                  Connect tools from the Integrations page to see them here.
                </p>
              </div>
            ) : (
              connectedApps.map((app: any) => (
                <div
                  key={app.id || app.name}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="text-sm font-medium">{app.name || app.id}</div>
                  <span className="text-xs font-medium capitalize text-iw-forest-mid">
                    connected
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { SettingsView };
