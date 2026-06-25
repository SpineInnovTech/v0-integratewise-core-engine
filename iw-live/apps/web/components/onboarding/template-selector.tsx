"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check, ChevronRight, Search, Sparkles, ArrowRight, Zap } from "lucide-react"
import { INDUSTRY_TEMPLATES, type IndustryTemplate, getTemplateById } from "@/lib/templates/industry-templates"

interface TemplateSelectorProps {
  onSelectTemplate: (template: IndustryTemplate | null) => void
  onSkip: () => void
}

export function TemplateSelector({ onSelectTemplate, onSkip }: TemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<IndustryTemplate | null>(null)

  const filteredTemplates = INDUSTRY_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const popularTemplates = filteredTemplates.filter((t) => t.popular)
  const otherTemplates = filteredTemplates.filter((t) => !t.popular)

  const handlePreview = (template: IndustryTemplate) => {
    setPreviewTemplate(template)
    setShowPreview(true)
  }

  const handleSelect = () => {
    if (selectedId) {
      const template = getTemplateById(selectedId)
      if (template) {
        onSelectTemplate(template)
      }
    }
  }

  const colorClasses: Record<string, string> = {
    blue: "border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5",
    green: "border-green-500/30 hover:border-green-500/60 bg-green-500/5",
    purple: "border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5",
    cyan: "border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/5",
    yellow: "border-yellow-500/30 hover:border-yellow-500/60 bg-yellow-500/5",
    red: "border-red-500/30 hover:border-red-500/60 bg-red-500/5",
    indigo: "border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5",
    orange: "border-orange-500/30 hover:border-orange-500/60 bg-orange-500/5",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-6xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">One-Click Setup</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Choose Your Business Template
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get a fully configured workspace in seconds. Pre-filled pipeline, accounts,
            tax settings, and dashboards tailored to your industry.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Popular Templates */}
        {popularTemplates.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Popular Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    colorClasses[template.color] || ""
                  } ${
                    selectedId === template.id
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  }`}
                  onClick={() => setSelectedId(template.id)}
                >
                  {selectedId === template.id && (
                    <div className="absolute top-3 right-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="text-4xl mb-2">{template.icon}</div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {template.pipeline.length - 1} stages
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {template.chartOfAccounts.length} accounts
                      </Badge>
                      {template.services.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {template.services.length} services
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto text-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePreview(template)
                      }}
                    >
                      Preview details <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Templates */}
        {otherTemplates.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4">More Industries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    colorClasses[template.color] || ""
                  } ${
                    selectedId === template.id
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  }`}
                  onClick={() => setSelectedId(template.id)}
                >
                  {selectedId === template.id && (
                    <div className="absolute top-3 right-3">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="text-4xl mb-2">{template.icon}</div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto text-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePreview(template)
                      }}
                    >
                      Preview details <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button variant="outline" onClick={onSkip}>
            Start from scratch
          </Button>
          <Button
            size="lg"
            disabled={!selectedId}
            onClick={handleSelect}
            className="min-w-[200px]"
          >
            Apply Template
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {previewTemplate && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span className="text-3xl">{previewTemplate.icon}</span>
                    {previewTemplate.name} Template
                  </DialogTitle>
                  <DialogDescription>
                    {previewTemplate.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Pipeline */}
                  <div>
                    <h4 className="font-medium mb-2">Sales Pipeline Stages</h4>
                    <div className="flex flex-wrap gap-2">
                      {previewTemplate.pipeline.map((stage, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          style={{ borderColor: stage.color, color: stage.color }}
                        >
                          {stage.name} ({stage.probability}%)
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Chart of Accounts */}
                  <div>
                    <h4 className="font-medium mb-2">
                      Chart of Accounts ({previewTemplate.chartOfAccounts.length} accounts)
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {previewTemplate.chartOfAccounts.slice(0, 8).map((acc, i) => (
                        <div key={i} className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-mono text-xs bg-muted px-1 rounded">
                            {acc.code}
                          </span>
                          {acc.name}
                        </div>
                      ))}
                      {previewTemplate.chartOfAccounts.length > 8 && (
                        <div className="text-muted-foreground">
                          +{previewTemplate.chartOfAccounts.length - 8} more...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Services */}
                  {previewTemplate.services.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Pre-configured Services</h4>
                      <div className="space-y-1">
                        {previewTemplate.services.map((svc, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span>{svc.name}</span>
                            <span className="text-muted-foreground">
                              {svc.hourlyRate
                                ? `₹${svc.hourlyRate}/hr`
                                : svc.fixedPrice
                                ? `₹${svc.fixedPrice.toLocaleString()}`
                                : "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* KPIs */}
                  <div>
                    <h4 className="font-medium mb-2">Key Performance Indicators</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {previewTemplate.kpis.map((kpi, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-muted/50 text-sm"
                        >
                          <div className="font-medium">{kpi.name}</div>
                          <div className="text-muted-foreground">
                            Target: {kpi.target?.toLocaleString()} {kpi.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tax Config */}
                  <div>
                    <h4 className="font-medium mb-2">Tax Configuration</h4>
                    <div className="flex gap-4 text-sm">
                      <Badge variant="outline">
                        {previewTemplate.taxConfig.taxType.toUpperCase()}
                      </Badge>
                      <span className="text-muted-foreground">
                        Default rate: {previewTemplate.taxConfig.defaultTaxRate}%
                      </span>
                      <span className="text-muted-foreground">
                        Currency: {previewTemplate.defaultCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedId(previewTemplate.id)
                      setShowPreview(false)
                    }}
                  >
                    Select this template
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
