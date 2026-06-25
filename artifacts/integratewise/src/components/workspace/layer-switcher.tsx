import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Brain, Users, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const layers = [
  { id: "l1-personal", label: "Personal (L1)", icon: Users, description: "Your workspace & decisions", route: "/" },
  { id: "l2-operations", label: "Operations (L2)", icon: Zap, description: "Role-based views & execution", route: "/cockpit" },
  { id: "l3-twin-home", label: "Twin Home (L3)", icon: Brain, description: "AI reasoning & proposals", route: "/twin" },
  { id: "l4-governance", label: "Governance (L4)", icon: Shield, description: "Approvals & compliance", route: "/governance" },
];

export function LayerSwitcher() {
  const [, navigate] = useLocation();
  const [activeLayer, setActiveLayer] = useState("l1-personal");

  const handleSwitch = (layerId: string, route: string) => {
    setActiveLayer(layerId);
    navigate(route);
  };

  return (
    <div className="px-2 py-3 space-y-1.5">
      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
        Continuity Layers
      </div>
      {layers.map((layer) => {
        const Icon = layer.icon;
        const isActive = activeLayer === layer.id;
        return (
          <button
            key={layer.id}
            onClick={() => handleSwitch(layer.id, layer.route)}
            className={cn(
              "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col items-start gap-0.5 flex-1 text-left">
              <div className="font-semibold text-xs">{layer.label}</div>
              <div className="text-[10px] text-sidebar-foreground/50 leading-tight">{layer.description}</div>
            </div>
            {isActive && <Badge variant="default" className="text-[10px] px-1.5 py-0">Active</Badge>}
          </button>
        );
      })}
      <div className="h-px bg-sidebar-border mt-2" />
    </div>
  );
}
