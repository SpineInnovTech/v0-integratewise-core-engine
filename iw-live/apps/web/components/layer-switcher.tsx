"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Brain, Users, Shield, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Layer {
  id: string
  label: string
  icon: typeof Brain
  description: string
  color: string
}

const layers: Layer[] = [
  {
    id: "l1-personal",
    label: "Personal (L1)",
    icon: Users,
    description: "Your workspace & decisions",
    color: "bg-blue-50 text-blue-900",
  },
  {
    id: "l2-operations",
    label: "Operations (L2)",
    icon: Zap,
    description: "Role-based views & execution",
    color: "bg-emerald-50 text-emerald-900",
  },
  {
    id: "l3-twin-home",
    label: "Twin Home (L3)",
    icon: Brain,
    description: "AI reasoning & proposals",
    color: "bg-purple-50 text-purple-900",
  },
  {
    id: "l4-governance",
    label: "Governance (L4)",
    icon: Shield,
    description: "Approvals & compliance",
    color: "bg-orange-50 text-orange-900",
  },
]

export function LayerSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeLayer, setActiveLayer] = useState<string>("l1-personal")

  const handleLayerSwitch = (layerId: string) => {
    setActiveLayer(layerId)
    // Route to layer-specific page
    const routeMap: Record<string, string> = {
      "l1-personal": "/workspace",
      "l2-operations": "/cockpit",
      "l3-twin-home": "/twin-home",
      "l4-governance": "/governance",
    }
    router.push(routeMap[layerId] || "/")
  }

  return (
    <div className="px-2 py-3 space-y-2">
      <div className="px-2 py-1 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
        Continuity Layers
      </div>

      <div className="space-y-1.5">
        {layers.map((layer) => {
          const LayerIcon = layer.icon
          const isActive = activeLayer === layer.id

          return (
            <button
              key={layer.id}
              onClick={() => handleLayerSwitch(layer.id)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground",
              )}
            >
              <LayerIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col items-start gap-0.5 flex-1">
                <div className="font-medium text-xs">{layer.label}</div>
                <div className="text-xs text-sidebar-foreground/50">{layer.description}</div>
              </div>
              {isActive && <Badge variant="default" className="text-xs">Active</Badge>}
            </button>
          )
        })}
      </div>

      <div className="h-px bg-sidebar-border my-2" />

      <div className="px-2 py-1 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
        Current Layer Content
      </div>
    </div>
  )
}
