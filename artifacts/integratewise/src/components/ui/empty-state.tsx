import * as React from "react";
import { CheckSquare, FileText, Plug, Search, Bell, type LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "./utils";

interface EmptyStateProps {
  variant?:
    | "no-tasks"
    | "no-documents"
    | "no-integrations"
    | "no-results"
    | "no-notifications"
    | "custom";
  icon?: LucideIcon;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onAction?: () => void;
  className?: string;
}

const VARIANTS: Record<
  string,
  { icon: LucideIcon; title: string; description: string; ctaLabel?: string }
> = {
  "no-tasks": {
    icon: CheckSquare,
    title: "No tasks yet",
    description: "Create your first task to get started",
    ctaLabel: "Create Task",
  },
  "no-documents": {
    icon: FileText,
    title: "No documents uploaded",
    description: "Upload documents to start building your knowledge base",
    ctaLabel: "Upload Document",
  },
  "no-integrations": {
    icon: Plug,
    title: "No integrations connected",
    description: "Connect your first tool to unify your workspace",
    ctaLabel: "Browse Integrations",
  },
  "no-results": {
    icon: Search,
    title: "No results found",
    description: "Try different keywords or check your spelling",
    ctaLabel: "Clear Search",
  },
  "no-notifications": {
    icon: Bell,
    title: "All caught up!",
    description: "You have no new notifications",
  },
};

export function EmptyState({
  variant = "custom",
  icon,
  title,
  description,
  ctaLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const config = variant !== "custom" ? VARIANTS[variant] : null;

  const Icon = icon || config?.icon || Search;
  const displayTitle = title || config?.title || "Nothing here yet";
  const displayDesc = description || config?.description || "";
  const displayCta = ctaLabel || config?.ctaLabel;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center max-w-sm mx-auto py-16 px-6",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2 font-sans">{displayTitle}</h3>
      {displayDesc && <p className="text-sm text-gray-500 mb-6 leading-relaxed">{displayDesc}</p>}
      {displayCta && onAction && (
        <Button onClick={onAction} size="default">
          {displayCta}
        </Button>
      )}
    </div>
  );
}
