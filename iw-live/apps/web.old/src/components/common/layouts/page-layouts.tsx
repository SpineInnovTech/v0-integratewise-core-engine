import type { ReactNode } from "react";
import { PageHeader } from "@/components/l2/spine/page-header";

interface BaseLayoutProps {
  title: string;
  description?: string;
  stageId?: string;
  actions?: ReactNode;
  children: ReactNode;
}

// Standard container with consistent padding
export function PageContainer({ title, description, stageId, actions, children }: BaseLayoutProps) {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title={title} description={description} stageId={stageId} actions={actions} />
      {children}
    </div>
  );
}

// Dashboard layout with metric cards + charts
export function DashboardLayout({
  title,
  description,
  stageId,
  actions,
  children,
}: BaseLayoutProps) {
  return (
    <div className="p-6">
      <PageHeader title={title} description={description} stageId={stageId} actions={actions} />
      <div className="space-y-6">{children}</div>
    </div>
  );
}

// Grid layout for cards (clients, products, services)
interface GridLayoutProps extends BaseLayoutProps {
  columns?: 2 | 3 | 4;
}

export function GridLayout({
  title,
  description,
  stageId,
  actions,
  columns = 3,
  children,
}: GridLayoutProps) {
  return (
    <div className="p-6">
      <PageHeader title={title} description={description} stageId={stageId} actions={actions} />
      <div
        className={`grid gap-4 ${columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-4" : "grid-cols-3"}`}
      >
        {children}
      </div>
    </div>
  );
}

// List layout for tables/rows (tasks, users, pipeline)
export function ListLayout({ title, description, stageId, actions, children }: BaseLayoutProps) {
  return (
    <div className="p-6">
      <PageHeader title={title} description={description} stageId={stageId} actions={actions} />
      <div className="bg-card rounded-xl border border-border overflow-hidden">{children}</div>
    </div>
  );
}

// Standardized Card Component
interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-card rounded-xl border border-border p-5 ${hover ? "hover:shadow-lg hover:border-muted-foreground/20 transition-all cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// Standardized Stat Card
interface StatCardProps {
  label: string;
  value: string | number;
  color?: "gray" | "blue" | "yellow" | "green" | "red";
}

export function StatCard({ label, value, color = "gray" }: StatCardProps) {
  const colorClasses = {
    gray: "bg-muted",
    blue: "bg-blue-100 dark:bg-blue-900/30",
    yellow: "bg-yellow-100 dark:bg-yellow-900/30",
    green: "bg-green-100 dark:bg-green-900/30",
    red: "bg-red-100 dark:bg-red-900/30",
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-4`}>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// Standardized Empty State
interface StandardEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function StandardEmptyState({ icon, title, description, action }: StandardEmptyStateProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-12 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      {action && action}
    </div>
  );
}

// Standardized Section Container
interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, children, className = "" }: SectionProps) {
  return (
    <div className={`bg-card rounded-xl border border-border p-5 ${className}`}>
      {title && <h3 className="font-semibold text-foreground mb-4">{title}</h3>}
      {children}
    </div>
  );
}

// Standardized Metric Card
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: any;
  primary?: boolean;
}

export function MetricCard({ title, value, change, icon: Icon, primary = false }: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${primary ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {change > 0 ? "+" : ""}
              {change}%
            </p>
          )}
        </div>
        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
      </div>
    </div>
  );
}
