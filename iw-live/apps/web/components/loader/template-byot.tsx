"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Link2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Send,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/app/hooks/use-toast"

interface TemplateAnalysis {
  type: "notion" | "confluence"
  properties: Array<{
    name: string
    type: string
    options?: string[]
    required?: boolean
  }>
  title: string
  description?: string
}

interface BYOTProps {
  workspaceId: string
  normalizedData?: Record<string, any>
}

export function TemplateBYOT({ workspaceId, normalizedData }: BYOTProps) {
  const { toast } = useToast()
  const [templateUrl, setTemplateUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false)
  const [isRendering, setIsRendering] = useState(false)
  const [analysis, setAnalysis] = useState<TemplateAnalysis | null>(null)
  const [schema, setSchema] = useState<any>(null)
  const [mappedData, setMappedData] = useState<Record<string, any>>({})
  const [renderResult, setRenderResult] = useState<{ pageId?: string; url?: string } | null>(null)

  const handleAnalyze = async () => {
    if (!templateUrl.trim()) {
      toast({
        title: "Template URL required",
        description: "Please paste a Notion or Confluence template URL",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/loader/analyze-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateUrl,
          workspaceId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze template")
      }

      setAnalysis(result.structure)
      toast({
        title: "Template analyzed",
        description: `Found ${result.structure.properties.length} properties`,
      })
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerateSchema = async () => {
    if (!analysis) return

    setIsGeneratingSchema(true)
    try {
      const response = await fetch("/api/loader/generate-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateStructure: analysis,
          workspaceId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate schema")
      }

      setSchema(result.schema)
      
      // Auto-map normalized data if available
      if (normalizedData) {
        const mapped: Record<string, any> = {}
        for (const prop of analysis.properties) {
          // Try to find matching field in normalized data
          const key = Object.keys(normalizedData).find(
            (k) => k.toLowerCase() === prop.name.toLowerCase()
          )
          if (key) {
            mapped[prop.name] = normalizedData[key]
          }
        }
        setMappedData(mapped)
      }

      toast({
        title: "Schema generated",
        description: "JSON Schema created successfully",
      })
    } catch (error: any) {
      toast({
        title: "Schema generation failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSchema(false)
    }
  }

  const handleRender = async () => {
    if (!schema || !analysis) return

    setIsRendering(true)
    try {
      const response = await fetch("/api/loader/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          templateId: analysis.title, // Use title as template ID for now
          data: mappedData,
          targetDatabaseId: analysis.type === "notion" ? undefined : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to render")
      }

      setRenderResult(result)
      toast({
        title: "Rendered successfully",
        description: "Your data has been rendered to the template",
      })
    } catch (error: any) {
      toast({
        title: "Render failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRendering(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Bring Your Own Template (BYOT)
          </CardTitle>
          <CardDescription>
            Paste a Notion or Confluence template URL, and we'll analyze it and help you fill it with your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-url">Template URL</Label>
            <div className="flex gap-2">
              <Input
                id="template-url"
                placeholder="https://notion.so/templates/..."
                value={templateUrl}
                onChange={(e) => setTemplateUrl(e.target.value)}
                disabled={isAnalyzing}
              />
              <Button onClick={handleAnalyze} disabled={isAnalyzing || !templateUrl.trim()}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>

          {analysis && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">Template Analyzed: {analysis.title}</span>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Type: <Badge variant="outline">{analysis.type}</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Properties: {analysis.properties.length}
                </p>
                {analysis.description && (
                  <p className="text-sm text-muted-foreground">{analysis.description}</p>
                )}
              </div>

              <div className="mt-4">
                <Button
                  onClick={handleGenerateSchema}
                  disabled={isGeneratingSchema}
                  variant="outline"
                >
                  {isGeneratingSchema ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Schema...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Schema
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {schema && (
            <Tabs defaultValue="schema" className="mt-4">
              <TabsList>
                <TabsTrigger value="schema">Schema</TabsTrigger>
                <TabsTrigger value="mapping">Data Mapping</TabsTrigger>
              </TabsList>

              <TabsContent value="schema" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Generated JSON Schema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-64">
                      {JSON.stringify(schema, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mapping" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Map Your Data</CardTitle>
                    <CardDescription>
                      Review and adjust how your data maps to the template fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.properties.map((prop) => (
                      <div key={prop.name} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <Label className="font-medium">{prop.name}</Label>
                          <p className="text-xs text-muted-foreground">
                            {prop.type}
                            {prop.required && <Badge variant="destructive" className="ml-2">Required</Badge>}
                          </p>
                        </div>
                        <Input
                          className="w-48"
                          value={mappedData[prop.name] || ""}
                          onChange={(e) =>
                            setMappedData({ ...mappedData, [prop.name]: e.target.value })
                          }
                          placeholder="Enter value..."
                        />
                      </div>
                    ))}

                    <Button
                      onClick={handleRender}
                      disabled={isRendering}
                      className="w-full"
                    >
                      {isRendering ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Rendering...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Render to Template
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {renderResult && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900 dark:text-green-100">
                  Successfully Rendered!
                </span>
              </div>
              {renderResult.url && (
                <a
                  href={renderResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 dark:text-green-300 hover:underline flex items-center gap-1 mt-2"
                >
                  View in {analysis?.type === "notion" ? "Notion" : "Confluence"}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
