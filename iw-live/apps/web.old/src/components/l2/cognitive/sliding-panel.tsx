"use client";

import { useEffect, useCallback } from "react";
import { X, Minimize2, Maximize2, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PanelPosition = "right" | "left" | "bottom" | "full";
export type PanelSize = "sm" | "md" | "lg" | "xl" | "full";

interface SlidingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  position?: PanelPosition;
  size?: PanelSize;
  isPinned?: boolean;
  onPinToggle?: () => void;
  isMaximized?: boolean;
  onMaximizeToggle?: () => void;
  showOverlay?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-[320px]",
  md: "w-[480px]",
  lg: "w-[640px]",
  xl: "w-[800px]",
  full: "w-full",
};

const positionStyles = {
  right: "top-0 right-0 h-full border-l",
  left: "top-0 left-0 h-full border-r",
  bottom: "bottom-0 left-0 right-0 h-[50vh] border-t",
  full: "inset-0",
};

export function SlidingPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  position = "right",
  size = "md",
  isPinned = false,
  onPinToggle,
  isMaximized = false,
  onMaximizeToggle,
  showOverlay = true,
  className,
}: SlidingPanelProps) {
  // Handle ESC key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPinned) {
        onClose();
      }
    },
    [onClose, isPinned]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen && !isPinned) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, isPinned]);

  if (!isOpen) return null;

  const actualSize = isMaximized ? "full" : size;
  const isHorizontal = position === "right" || position === "left";

  return (
    <>
      {/* Overlay */}
      {showOverlay && !isPinned && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 bg-background shadow-2xl flex flex-col",
          "transform transition-transform duration-300 ease-out",
          positionStyles[position],
          isHorizontal && sizeMap[actualSize],
          position === "right" && (isOpen ? "translate-x-0" : "translate-x-full"),
          position === "left" && (isOpen ? "translate-x-0" : "-translate-x-full"),
          position === "bottom" && (isOpen ? "translate-y-0" : "translate-y-full"),
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            {icon && <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>}
            <div>
              <h2 id="panel-title" className="font-semibold text-lg">
                {title}
              </h2>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onPinToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPinToggle}
                className="h-8 w-8"
                title={isPinned ? "Unpin panel" : "Pin panel"}
              >
                {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
            )}
            {onMaximizeToggle && !isPinned && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMaximizeToggle}
                className="h-8 w-8"
                title={isMaximized ? "Minimize" : "Maximize"}
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </>
  );
}
