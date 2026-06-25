"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Check, Search, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { getSelectedTools, persistSelectedTools, TOOL_CATALOG } from "@/lib/config"
import type { ToolSelection } from "@/lib/config"

export function IntegrationsSelection() {
  const [selected, setSelected] = useState<ToolSelection>({
    ai: [],
    messaging: [],
    payments: [],
    data: [],
    platform: [],
  })
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const existing = getSelectedTools()
    if (existing) {
      setSelected(existing)
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
    toast({
      title: "Tools saved",
      description: "Configure secrets in Vercel (Doppler).",
    })
  }

  const categories = Object.keys(TOOL_CATALOG) as Array<keyof typeof TOOL_CATALOG>
  const totalSelected = Object.values(selected).flat().length

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-heading text-5xl font-bold text-[#0B1220] mb-4">Choose Your Tools</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Select the integrations you need. Configure environment variables in Vercel using Doppler.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="search"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-slate-300 focus:border-[#2563EB] bg-white"
            />
          </div>

          {/* Selected Count */}
          {totalSelected > 0 && (
            <div className="text-center">
              <Badge className="bg-blue-50 text-[#2563EB] border-blue-200 px-4 py-2">
                {totalSelected} tool{totalSelected !== 1 ? "s" : ""} selected
              </Badge>
            </div>
          )}
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="ai" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger value="ai">AI</TabsTrigger>
                <TabsTrigger value="messaging">Messaging</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="platform">Platform</TabsTrigger>
              </TabsList>
            </div>

            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {TOOL_CATALOG[category]
                    .filter(
                      (tool) =>
                        searchQuery === "" ||
                        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((tool) => {
                      const isSelected = selected[category].includes(tool.id)

                      return (
                        <Card
                          key={tool.id}
                          className={`p-6 border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#2563EB] bg-blue-50/50 shadow-md"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          onClick={() => handleToggle(category, tool.id)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-2xl">
                                {tool.icon}
                              </div>
                              <div>
                                <h3 className="font-bold text-[#0B1220] mb-1">{tool.name}</h3>
                                <Badge variant={tool.status === "stable" ? "default" : "secondary"} className="text-xs">
                                  {tool.status}
                                </Badge>
                              </div>
                            </div>
                            <Checkbox checked={isSelected} className="mt-1" />
                          </div>

                          <p className="text-sm text-slate-600 mb-4">{tool.description}</p>

                          {tool.envKeys.length > 0 && (
                            <div className="pt-4 border-t border-slate-200">
                              <p className="text-xs font-semibold text-slate-500 mb-2">Required variables:</p>
                              <div className="flex flex-wrap gap-1">
                                {tool.envKeys.slice(0, 2).map((key) => (
                                  <code key={key} className="text-xs bg-slate-100 px-2 py-1 rounded">
                                    {key}
                                  </code>
                                ))}
                                {tool.envKeys.length > 2 && (
                                  <span className="text-xs text-slate-500 px-2 py-1">
                                    +{tool.envKeys.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      )
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Apply Button */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h3 className="font-heading text-2xl font-bold text-[#0B1220] mb-4">Ready to configure?</h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Save your selection and configure the required environment variables in Vercel using Doppler for secret
              management.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={handleApply}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/30"
                disabled={totalSelected === 0}
              >
                <Check className="w-5 h-5 mr-2" />
                Apply Selection
              </Button>
              <Button size="lg" variant="outline" className="border-slate-300 bg-transparent" asChild>
                <Link href="/docs/setup">
                  View Setup Guide
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
