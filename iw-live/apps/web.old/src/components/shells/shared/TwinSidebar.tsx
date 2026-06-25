"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, PanelRightClose, PanelRightOpen } from "lucide-react";
import { AIChat } from "@/components/_deprecated/l2-removed/ai-chat";
import { type CTXEnum } from "@/components/l2/spine/types";
import { cn } from "@/lib/utils";

interface TwinSidebarProps {
  viewScope: "personal" | "work";
  department?: string;
  entityId?: string;
  entityName?: string;
  className?: string;
}

function resolveCtx(viewScope: "personal" | "work", department?: string): CTXEnum {
  if (viewScope === "personal") return "CTX_PERSONAL";
  if (department) {
    const map: Record<string, CTXEnum> = {
      CUSTOMER_SUCCESS: "CTX_CS",
      SALES: "CTX_SALES",
      REVOPS: "CTX_SALES",
      MARKETING: "CTX_MARKETING",
      PRODUCT_ENGINEERING: "CTX_TECH",
      FINANCE: "CTX_FINANCE",
      SERVICE: "CTX_SUPPORT",
      PROCUREMENT: "CTX_BIZOPS",
      IT_ADMIN: "CTX_BIZOPS",
      BIZOPS: "CTX_BIZOPS",
    };
    return map[department] || "CTX_BIZOPS";
  }
  return "CTX_BIZOPS";
}

export function TwinSidebar({
  viewScope,
  department,
  entityId,
  entityName,
  className,
}: TwinSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeCtx = resolveCtx(viewScope, department);

  const toggle = useCallback(() => setCollapsed((p) => !p), []);

  return (
    <div
      className={cn(
        "h-full border-l border-[#ebe5d8] bg-white flex flex-col shrink-0 transition-all duration-300",
        collapsed ? "w-[48px]" : "w-[380px]",
        className
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={toggle}
        className="h-10 flex items-center justify-center border-b border-[#ebe5d8] hover:bg-[#f4f0e8] transition-colors"
        title={collapsed ? "Expand Twin" : "Collapse Twin"}
      >
        {collapsed ? (
          <PanelRightOpen className="w-4 h-4 text-[#8a8580]" />
        ) : (
          <PanelRightClose className="w-4 h-4 text-[#8a8580]" />
        )}
      </button>

      <AnimatePresence mode="wait">
        {!collapsed ? (
          <motion.div
            key="twin-open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-hidden"
          >
            <AIChat activeCtx={activeCtx} entityId={entityId} entityName={entityName} />
          </motion.div>
        ) : (
          <motion.div
            key="twin-collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center pt-4 gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2d5a3d] to-[#c79f4a] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="w-px h-8 bg-[#ebe5d8]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
