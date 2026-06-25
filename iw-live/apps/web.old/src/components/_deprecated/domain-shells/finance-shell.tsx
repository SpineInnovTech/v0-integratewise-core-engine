/**
 * Finance Domain Shell — Revenue, expenses, invoices, and forecasting
 * Views: Dashboard, Revenue, Expenses, Invoices, Reports, Forecasting, Budget
 */
import { useState } from "react";
import {
  LayoutDashboard,
  DollarSign,
  CreditCard,
  FileText,
  TrendingUp,
  PieChart,
  Search,
  Bell,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { FinanceDashboard } from "./dashboard";
import {
  FinanceRevenueView,
  FinanceExpensesView,
  FinanceInvoicesView,
  FinanceReportsView,
  FinanceForecastingView,
  FinanceBudgetView,
} from "./finance-views";
import { useSpine } from "@/components/l2/spine/spine-client";

const domain = domainConfigs["finance"];

const navItems: NavItem[] = [
  { id: "dashboard", label: "Finance Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "revenue", label: "Revenue", icon: <DollarSign className="w-4 h-4" /> },
  { id: "expenses", label: "Expenses", icon: <CreditCard className="w-4 h-4" /> },
  { id: "invoices", label: "Invoices", icon: <FileText className="w-4 h-4" />, badge: "8" },
  { id: "reports", label: "Reports", icon: <FileText className="w-4 h-4" />, section: "Analysis" },
  {
    id: "forecasting",
    label: "Forecasting",
    icon: <TrendingUp className="w-4 h-4" />,
    section: "Analysis",
  },
  { id: "budget", label: "Budget", icon: <PieChart className="w-4 h-4" />, section: "Analysis" },
];

interface FinanceShellProps {
  onSwitchDomain: () => void;
}

export function FinanceShell({ onSwitchDomain }: FinanceShellProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const spine = useSpine();

  const viewTitles: Record<string, string> = {
    dashboard: "Finance Dashboard",
    revenue: "Revenue",
    expenses: "Expenses",
    invoices: "Invoices",
    reports: "Reports",
    forecasting: "Forecasting",
    budget: "Budget",
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <FinanceDashboard />;
      case "revenue":
        return <FinanceRevenueView />;
      case "expenses":
        return <FinanceExpensesView />;
      case "invoices":
        return <FinanceInvoicesView />;
      case "reports":
        return <FinanceReportsView />;
      case "forecasting":
        return <FinanceForecastingView />;
      case "budget":
        return <FinanceBudgetView />;
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
              {domain.icon} {viewTitles[activeView] || "Finance"}
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
