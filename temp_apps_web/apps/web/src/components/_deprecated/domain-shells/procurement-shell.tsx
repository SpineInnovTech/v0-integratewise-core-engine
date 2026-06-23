/**
 * Procurement Domain Shell — Vendors, orders, contracts, spend analysis
 * Views: Dashboard, Vendors, Orders, Contracts, Spend Analysis, Savings
 */
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  FileText,
  PieChart,
  TrendingDown,
  Search,
  Bell,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { ProcurementDashboard } from "./dashboard";
import {
  ProcurementVendorsView,
  ProcurementOrdersView,
  ProcurementContractsView,
  ProcurementSpendView,
  ProcurementSavingsView,
} from "./procurement-views";
import { useSpine } from "@/components/l2/spine/spine-client";

const domain = domainConfigs["procurement"];

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Procurement Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  { id: "vendors", label: "Vendors", icon: <Building2 className="w-4 h-4" /> },
  { id: "orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" />, badge: "14" },
  { id: "contracts", label: "Contracts", icon: <FileText className="w-4 h-4" /> },
  {
    id: "spend",
    label: "Spend Analysis",
    icon: <PieChart className="w-4 h-4" />,
    section: "Analysis",
  },
  {
    id: "savings",
    label: "Savings",
    icon: <TrendingDown className="w-4 h-4" />,
    section: "Analysis",
  },
];

interface ProcurementShellProps {
  onSwitchDomain: () => void;
}

export function ProcurementShell({ onSwitchDomain }: ProcurementShellProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const spine = useSpine();

  const viewTitles: Record<string, string> = {
    dashboard: "Procurement Dashboard",
    vendors: "Vendors",
    orders: "Orders",
    contracts: "Contracts",
    spend: "Spend Analysis",
    savings: "Savings",
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <ProcurementDashboard />;
      case "vendors":
        return <ProcurementVendorsView />;
      case "orders":
        return <ProcurementOrdersView />;
      case "contracts":
        return <ProcurementContractsView />;
      case "spend":
        return <ProcurementSpendView />;
      case "savings":
        return <ProcurementSavingsView />;
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
              {domain.icon} {viewTitles[activeView] || "Procurement"}
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
