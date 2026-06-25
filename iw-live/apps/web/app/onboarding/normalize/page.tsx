"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe,
  Database,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  Upload,
  Link2,
  Loader2,
} from "lucide-react"

type Step = "company" | "data-sources" | "import" | "team" | "complete"

const STEPS: { id: Step; title: string; icon: React.ReactNode }[] = [
  { id: "company", title: "Company Profile", icon: <Building2 className="h-4 w-4" /> },
  { id: "data-sources", title: "Connect Sources", icon: <Database className="h-4 w-4" /> },
  { id: "import", title: "Import Data", icon: <FileSpreadsheet className="h-4 w-4" /> },
  { id: "team", title: "Team Setup", icon: <Users className="h-4 w-4" /> },
]

const DATA_SOURCES = [
  { id: "hubspot", name: "HubSpot", category: "CRM", icon: "🟠" },
  { id: "salesforce", name: "Salesforce", category: "CRM", icon: "☁️" },
  { id: "pipedrive", name: "Pipedrive", category: "CRM", icon: "🟢" },
  { id: "zoho", name: "Zoho CRM", category: "CRM", icon: "🔴" },
  { id: "quickbooks", name: "QuickBooks", category: "Accounting", icon: "📗" },
  { id: "xero", name: "Xero", category: "Accounting", icon: "🔵" },
  { id: "tally", name: "Tally", category: "Accounting", icon: "📊" },
  { id: "google-calendar", name: "Google Calendar", category: "Calendar", icon: "📅" },
  { id: "outlook", name: "Outlook Calendar", category: "Calendar", icon: "📆" },
  { id: "gmail", name: "Gmail", category: "Email", icon: "📧" },
  { id: "sheets", name: "Google Sheets", category: "Spreadsheet", icon: "📋" },
  { id: "excel", name: "Excel Files", category: "Spreadsheet", icon: "📑" },
]

const COUNTRIES = [
  { code: "IN", name: "India", currency: "INR", taxSystem: "GST" },
  { code: "US", name: "United States", currency: "USD", taxSystem: "Sales Tax" },
  { code: "GB", name: "United Kingdom", currency: "GBP", taxSystem: "VAT" },
  { code: "AU", name: "Australia", currency: "AUD", taxSystem: "GST" },
  { code: "CA", name: "Canada", currency: "CAD", taxSystem: "GST/HST" },
  { code: "SG", name: "Singapore", currency: "SGD", taxSystem: "GST" },
  { code: "AE", name: "UAE", currency: "AED", taxSystem: "VAT" },
  { code: "DE", name: "Germany", currency: "EUR", taxSystem: "VAT" },
]

export default function NormalizePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>("company")
  const [isProcessing, setIsProcessing] = useState(false)

  // Form states
  const [companyName, setCompanyName] = useState("")
  const [country, setCountry] = useState("")
  const [industry, setIndustry] = useState("")
  const [connectedSources, setConnectedSources] = useState<string[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [teamEmails, setTeamEmails] = useState("")

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const selectedCountry = COUNTRIES.find((c) => c.code === country)

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
    } else {
      // Complete onboarding
      setCurrentStep("complete")
      setTimeout(() => {
        router.push("/")
      }, 2000)
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  const handleConnectSource = (sourceId: string) => {
    if (connectedSources.includes(sourceId)) {
      setConnectedSources(connectedSources.filter((s) => s !== sourceId))
    } else {
      setConnectedSources([...connectedSources, sourceId])
    }
  }

  const handleImportData = async () => {
    setIsProcessing(true)
    // Simulate import progress
    for (let i = 0; i <= 100; i += 10) {
      setImportProgress(i)
      await new Promise((r) => setTimeout(r, 300))
    }
    setIsProcessing(false)
    handleNext()
  }

  // Complete screen
  if (currentStep === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
            <p className="text-muted-foreground">
              Your workspace is ready. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-3xl mx-auto py-12 px-4">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  index <= currentStepIndex ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index < currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : index === currentStepIndex
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-muted"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step content */}
        <Card>
          {/* Step 1: Company Profile */}
          {currentStep === "company" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Profile
                </CardTitle>
                <CardDescription>
                  Tell us about your business to customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Acme Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name} ({c.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCountry && (
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">
                        <Globe className="h-3 w-3 mr-1" />
                        {selectedCountry.currency}
                      </Badge>
                      <Badge variant="secondary">
                        {selectedCountry.taxSystem}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="agency">Digital Agency</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Data Sources */}
          {currentStep === "data-sources" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Connect Your Data Sources
                </CardTitle>
                <CardDescription>
                  Connect your existing tools to import and sync data automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DATA_SOURCES.map((source) => (
                    <Card
                      key={source.id}
                      className={`cursor-pointer transition-all ${
                        connectedSources.includes(source.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => handleConnectSource(source.id)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <span className="text-2xl">{source.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {source.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {source.category}
                          </div>
                        </div>
                        {connectedSources.includes(source.id) && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {connectedSources.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1">
                      {connectedSources.length} source(s) selected
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Data will be imported and normalized in the next step
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* Step 3: Import Data */}
          {currentStep === "import" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Import & Normalize Data
                </CardTitle>
                <CardDescription>
                  We'll clean, deduplicate, and standardize your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isProcessing ? (
                  <>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                      <div className="font-medium mb-1">
                        Upload CSV or Excel files
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        Contacts, leads, transactions, or any business data
                      </div>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>

                    {connectedSources.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Connected sources ready for import:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {connectedSources.map((id) => {
                            const source = DATA_SOURCES.find((s) => s.id === id)
                            return source ? (
                              <Badge key={id} variant="secondary">
                                <Link2 className="h-3 w-3 mr-1" />
                                {source.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    <Button className="w-full" onClick={handleImportData}>
                      Start Import & Normalization
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium mb-2">
                        Processing your data...
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {importProgress < 30 && "Importing records..."}
                        {importProgress >= 30 && importProgress < 60 && "Deduplicating entries..."}
                        {importProgress >= 60 && importProgress < 90 && "Normalizing fields..."}
                        {importProgress >= 90 && "Finalizing..."}
                      </div>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* Step 4: Team Setup */}
          {currentStep === "team" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Invite Your Team
                </CardTitle>
                <CardDescription>
                  Add team members to collaborate (you can skip and do this later)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="team-emails">Team Email Addresses</Label>
                  <Input
                    id="team-emails"
                    placeholder="john@company.com, jane@company.com"
                    value={teamEmails}
                    onChange={(e) => setTeamEmails(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple emails with commas
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">Team members will be able to:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• View and manage deals & pipeline</li>
                    <li>• Access shared dashboards</li>
                    <li>• Collaborate on projects</li>
                    <li>• Create and send invoices</li>
                  </ul>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep !== "import" && (
                <Button variant="ghost" onClick={handleNext}>
                  Skip
                </Button>
              )}
              {currentStep !== "import" && (
                <Button onClick={handleNext}>
                  {currentStepIndex === STEPS.length - 1 ? "Finish" : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
