/**
 * Product & Engineering Domain Shell — Roadmap, features, bugs, sprints
 * Views: Dashboard, Roadmap, Features, Bugs, Sprints, Tasks, Releases
 */
import { useState } from "react";
import {
  LayoutDashboard,
  Map,
  Zap,
  AlertTriangle,
  Repeat,
  CheckSquare,
  Package,
  Search,
  Bell,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { ProductDashboard } from "./dashboard";
import {
  ProductRoadmapView,
  ProductFeaturesView,
  ProductBugsView,
  ProductSprintsView,
  ProductTasksView,
  ProductReleasesView,
} from "./product-views";
import { useSpine } from "@/components/l2/spine/spine-client";

const domain = domainConfigs["product-engineering"];

const navItems: NavItem[] = [
  { id: "dashboard", label: "Product Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "roadmap", label: "Roadmap", icon: <Map className="w-4 h-4" /> },
  { id: "features", label: "Features", icon: <Zap className="w-4 h-4" />, badge: "8" },
  { id: "bugs", label: "Bugs", icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "sprints", label: "Sprints", icon: <Repeat className="w-4 h-4" />, section: "Development" },
  {
    id: "tasks",
    label: "Tasks",
    icon: <CheckSquare className="w-4 h-4" />,
    section: "Development",
  },
  {
    id: "releases",
    label: "Releases",
    icon: <Package className="w-4 h-4" />,
    section: "Development",
  },
];

interface ProductShellProps {
  onSwitchDomain: () => void;
}

export function ProductShell({ onSwitchDomain }: ProductShellProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const spine = useSpine();

  const viewTitles: Record<string, string> = {
    dashboard: "Product Dashboard",
    roadmap: "Roadmap",
    features: "Features",
    bugs: "Bugs",
    sprints: "Sprints",
    tasks: "Tasks",
    releases: "Releases",
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <ProductDashboard />;
      case "roadmap":
        return <ProductRoadmapView />;
      case "features":
        return <ProductFeaturesView />;
      case "bugs":
        return <ProductBugsView />;
      case "sprints":
        return <ProductSprintsView />;
      case "tasks":
        return <ProductTasksView />;
      case "releases":
        return <ProductReleasesView />;
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
              {domain.icon} {viewTitles[activeView] || "Product"}
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
