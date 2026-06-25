"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { getSelectedTools, persistSelectedTools, TOOL_CATALOG } from "@/lib/config"
import type { ToolSelection } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"

export function OnboardingWizard() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ToolSelection>({
    ai: [],
    messaging: [],
    payments: [],
    data: [],
    platform: [],
  })
  const { toast } = useToast()

  useEffect(() => {
    const existing = getSelectedTools()
    if (!existing) {
      setOpen(true)
    }
  }, [])

  const handleToggle = (category: keyof ToolSelection, toolId: string) => {
    setSelected((prev) => ({
      ...prev,
      [category]: prev[category].includes(toolId)
        ? prev[category].filter((id) => id !== toolId)
        : [...prev[category], toolId],
    }))
  }

  const handleApply = () => {
    persistSelectedTools(selected)
    setOpen(false)
    toast({
      title: "Tools saved",
      description: "Configure secrets in Vercel (Doppler).",
    })
  }

  const categories = Object.keys(TOOL_CATALOG) as Array<keyof typeof TOOL_CATALOG>
  const totalSelected = Object.values(selected).flat().length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Choose Your Tools</DialogTitle>
          <DialogDescription>
            Select the integrations you'll use. You can change this later in Settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="ai" className="flex-1">
              AI
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex-1">
              Messaging
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1">
              Payments
            </TabsTrigger>
            <TabsTrigger value="data" className="flex-1">
              Data
            </TabsTrigger>
            <TabsTrigger value="platform" className="flex-1">
              Platform
            </TabsTrigger>
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="grid md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {TOOL_CATALOG[category].map((tool) => {
                  const isSelected = selected[category].includes(tool.id)

                  return (
                    <div
                      key={tool.id}
                      className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                        isSelected ? "border-[#2563EB] bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => handleToggle(category, tool.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{tool.icon}</span>
                          <div>
                            <h4 className="font-semibold text-sm">{tool.name}</h4>
                            <Badge
                              variant={tool.status === "stable" ? "default" : "secondary"}
                              className="text-xs mt-1"
                            >
                              {tool.status}
                            </Badge>
                          </div>
                        </div>
                        <Checkbox checked={isSelected} />
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{tool.description}</p>
                      {tool.envKeys.length > 0 && (
                        <p className="text-xs text-slate-500">Requires {tool.envKeys.length} env variable(s)</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-slate-600">
            {totalSelected > 0 ? (
              <span className="font-medium">
                {totalSelected} tool{totalSelected !== 1 ? "s" : ""} selected
              </span>
            ) : (
              <span>No tools selected yet</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Skip
            </Button>
            <Button onClick={handleApply} disabled={totalSelected === 0} className="bg-[#2563EB] hover:bg-[#1d4ed8]">
              <Check className="w-4 h-4 mr-2" />
              Apply Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
