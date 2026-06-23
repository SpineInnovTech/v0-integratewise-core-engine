import React from "react";
import { Database, ShieldAlert } from "lucide-react";

interface ContextChipProps {
  memoriesCount?: number;
  rulesCount?: number;
  title: string;
  className?: string;
}

export function ContextChip({
  memoriesCount = 0,
  rulesCount = 0,
  title,
  className = "",
}: ContextChipProps) {
  if (memoriesCount === 0 && rulesCount === 0) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Dispatch custom event to trigger memory drawer
    window.dispatchEvent(
      new CustomEvent("iw:memory-drawer:open", {
        detail: {
          title,
          memoriesCount,
          rulesCount,
        },
      })
    );
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border border-iw-forest/20 bg-iw-forest/5 text-iw-forest hover:bg-iw-forest/10 hover:border-iw-forest/30 transition-all cursor-pointer ${className}`}
    >
      <Database className="size-3" />
      <span>{memoriesCount} memories</span>
      {rulesCount > 0 && (
        <>
          <span className="text-slate-600 font-sans font-semibold">·</span>
          <ShieldAlert className="size-3 text-amber-500" />
          <span className="text-amber-500">
            {rulesCount} rule{rulesCount > 1 ? "s" : ""}
          </span>
        </>
      )}
    </button>
  );
}
