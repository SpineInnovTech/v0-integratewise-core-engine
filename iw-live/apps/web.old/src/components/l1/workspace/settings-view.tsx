/**
 * Workspace Settings — Profile, notifications, integrations shortcut
 * Accessible from /app/settings or /app/work/settings
 */
import { User, Bell, Plug, Shield, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsView() {
  const navigate = useNavigate();

  const sections = [
    {
      id: "profile",
      icon: User,
      title: "Profile",
      description: "Name, email, and account details",
      path: "/app/personal/dashboard",
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Email and in-app notification preferences",
      path: "/app/work/dashboard",
    },
    {
      id: "integrations",
      icon: Plug,
      title: "Integrations & Fabric",
      description: "Connected apps, connectors, and Hydration Fabric",
      path: "/app/work/fabric-admin",
    },
    {
      id: "security",
      icon: Shield,
      title: "Security & compliance",
      description: "Audit logs, policies, and governance",
      path: "/app/work/fabric-admin",
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-page-surface-grey p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-page-navy-dark">Settings</h1>
          <p className="mt-1 text-sm text-page-slate">
            Manage your workspace, profile, and preferences
          </p>
        </div>
        <div className="space-y-4">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.id}
                className="cursor-pointer border-page-border-light transition-all hover:-translate-y-0.5 hover:bg-page-surface-hover"
                onClick={() => navigate(s.path)}
              >
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-page-primary/10">
                        <Icon className="w-5 h-5 text-page-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-medium">{s.title}</CardTitle>
                        <p className="mt-0.5 text-sm text-page-slate">{s.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-page-slate-light" />
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
