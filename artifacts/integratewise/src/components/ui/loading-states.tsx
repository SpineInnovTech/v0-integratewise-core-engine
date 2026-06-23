import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./utils";
import { Skeleton } from "./skeleton";

/** Inline spinner for button or text-adjacent loading */
export function InlineSpinner({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Button loading state — replaces content with spinner */
export function ButtonLoading({
  className,
  children = "Loading...",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      disabled
      className={cn(
        "inline-flex items-center justify-center gap-2 h-11 px-4 py-2.5 rounded-md bg-primary text-primary-foreground opacity-60 cursor-not-allowed text-sm font-medium",
        className
      )}
    >
      <Loader2 className="w-4 h-4 animate-spin" />
      {children}
    </button>
  );
}

/** Skeleton card — matches typical card layout */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-gray-200 p-6 space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

/** Skeleton table rows */
export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-gray-200">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

/** Progress bar with optional percentage */
export function ProgressBar({
  value = 0,
  showLabel = true,
  className,
}: {
  value?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-primary">{clamped}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
