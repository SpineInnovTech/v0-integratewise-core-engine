/**
 * Marketing Domain Shell — Campaigns, leads, content, and attribution
 * Views: Dashboard, Campaigns, Leads, Analytics, Email, Social, Blog, Website
 */
import { useState } from "react";
import {
  LayoutDashboard,
  Target,
  Users,
  BarChart3,
  Mail,
  Share2,
  FileEdit,
  Globe,
  Search,
  Bell,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { MarketingDashboard } from "./dashboard";
import {
  MarketingCampaignsView,
  MarketingLeadsView,
  MarketingAnalyticsView,
  MarketingEmailView,
  MarketingSocialView,
  MarketingBlogView,
  MarketingWebsiteView,
} from "./marketing-views";
import { useSpine } from "@/components/l2/spine/spine-client";

const domain = domainConfigs["marketing"];

const navItems: NavItem[] = [
  { id: "dashboard", label: "Marketing Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "campaigns", label: "Campaigns", icon: <Target className="w-4 h-4" />, badge: "6" },
  { id: "leads", label: "Leads", icon: <Users className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "email", label: "Email Studio", icon: <Mail className="w-4 h-4" />, section: "Content" },
  { id: "social", label: "Social", icon: <Share2 className="w-4 h-4" />, section: "Content" },
  { id: "blog", label: "Blog", icon: <FileEdit className="w-4 h-4" />, section: "Content" },
  { id: "website", label: "Website", icon: <Globe className="w-4 h-4" />, section: "Content" },
];

interface MarketingShellProps {
  onSwitchDomain: () => void;
}

export function MarketingShell({ onSwitchDomain }: MarketingShellProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const spine = useSpine();

  const viewTitles: Record<string, string> = {
    dashboard: "Marketing Dashboard",
    campaigns: "Campaigns",
    leads: "Leads",
    analytics: "Analytics",
    email: "Email Studio",
    social: "Social",
    blog: "Blog",
    website: "Website",
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <MarketingDashboard />;
      case "campaigns":
        return <MarketingCampaignsView />;
      case "leads":
        return <MarketingLeadsView />;
      case "analytics":
        return <MarketingAnalyticsView />;
      case "email":
        return <MarketingEmailView />;
      case "social":
        return <MarketingSocialView />;
      case "blog":
        return <MarketingBlogView />;
      case "website":
        return <MarketingWebsiteView />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="text-3xl">{domain.icon}</div>
              <p className="text-sm text-muted-foreground capitalize">{activeView} — Coming soon</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans">
      <DomainSidebar
        domain={domain}
        navItems={navItems}
        activeView={activeView}
        onViewChange={setActiveView}
        onBackToConsole={onSwitchDomain}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-shrink-0 h-12 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ fontWeight: 600, color: domain.accentColor }}>
              {domain.icon} {viewTitles[activeView] || "Marketing"}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {spine.connectedApps.length} sources · SSOT live
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors relative">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--iw-danger)]" />
            </button>
          </div>
        </div>
        <main className="flex-1 overflow-hidden bg-background">{renderView()}</main>
      </div>
    </div>
  );
}
