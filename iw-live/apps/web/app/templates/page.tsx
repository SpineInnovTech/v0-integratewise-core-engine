"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Check, Search, ShoppingCart, Download, FileJson, MessageSquare, Clock } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"

type Template = {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  price: number
  originalPrice?: number
  badge?: "popular" | "new" | "bundle"
  icon: string
  includes: string[]
}

const templates: Template[] = [
  {
    id: "health-score",
    title: "Health Score Calculator",
    description:
      "Automatically calculate customer health scores based on usage, engagement, and support metrics. Triggers alerts for at-risk accounts.",
    category: "customer-success",
    tags: ["n8n", "HubSpot", "Slack"],
    price: 2499,
    originalPrice: 4999,
    badge: "popular",
    icon: "📊",
    includes: ["JSON export", "Setup guide", "30-min support call"],
  },
  {
    id: "churn-detector",
    title: "Churn Risk Detector",
    description:
      "ML-powered churn prediction with automated playbook triggers. Integrates with your CRM to flag accounts before they leave.",
    category: "customer-success",
    tags: ["n8n", "Salesforce"],
    price: 3499,
    badge: "new",
    icon: "🚨",
    includes: ["JSON export", "ML model config", "Setup guide"],
  },
  {
    id: "lead-router",
    title: "Intelligent Lead Router",
    description:
      "Route leads to the right rep based on territory, industry, and capacity. Includes round-robin and weighted distribution.",
    category: "lead-management",
    tags: ["n8n", "HubSpot", "Slack"],
    price: 1999,
    icon: "🎯",
    includes: ["JSON export", "Setup guide", "Email support"],
  },
  {
    id: "lead-enrichment",
    title: "Lead Enrichment Pipeline",
    description:
      "Automatically enrich leads with company data, social profiles, and intent signals from multiple data providers.",
    category: "lead-management",
    tags: ["n8n", "Clearbit", "Apollo"],
    price: 2999,
    badge: "popular",
    icon: "✨",
    includes: ["JSON export", "API integrations", "Setup guide"],
  },
  {
    id: "data-sync",
    title: "Multi-CRM Data Sync",
    description: "Keep HubSpot, Salesforce, and Pipedrive in sync. Bidirectional sync with conflict resolution.",
    category: "operations",
    tags: ["n8n", "HubSpot", "Salesforce"],
    price: 3999,
    icon: "🔄",
    includes: ["JSON export", "Mapping config", "Priority support"],
  },
  {
    id: "weekly-report",
    title: "Automated Weekly Reports",
    description:
      "Generate and distribute weekly performance reports to stakeholders. Customizable metrics and visualizations.",
    category: "operations",
    tags: ["n8n", "Google Sheets", "Slack"],
    price: 0,
    icon: "📈",
    includes: ["JSON export", "Template docs", "Community support"],
  },
  {
    id: "success-pilot",
    title: "SuccessPilot AI Agent",
    description:
      "AI-powered customer success agent that monitors accounts, suggests actions, and automates routine follow-ups.",
    category: "ai-agents",
    tags: ["n8n", "OpenAI", "HubSpot"],
    price: 4999,
    badge: "new",
    icon: "🤖",
    includes: ["JSON export", "AI prompts", "1hr onboarding"],
  },
  {
    id: "churn-shield",
    title: "ChurnShield AI Agent",
    description:
      "Proactive churn prevention agent that identifies at-risk accounts and triggers retention playbooks automatically.",
    category: "ai-agents",
    tags: ["n8n", "OpenAI", "Slack"],
    price: 5999,
    icon: "🛡️",
    includes: ["JSON export", "AI prompts", "Custom playbooks"],
  },
  {
    id: "slack-hubspot",
    title: "Slack ↔ HubSpot Bridge",
    description:
      "Create HubSpot tasks from Slack messages, get deal updates in channels, and sync conversation history.",
    category: "integrations",
    tags: ["n8n", "Slack", "HubSpot"],
    price: 1499,
    icon: "🔗",
    includes: ["JSON export", "Setup guide"],
  },
  {
    id: "notion-crm",
    title: "Notion CRM Sync",
    description: "Sync your CRM data to Notion databases for custom views, reporting, and collaboration.",
    category: "integrations",
    tags: ["n8n", "Notion", "HubSpot"],
    price: 0,
    icon: "📝",
    includes: ["JSON export", "Template docs"],
  },
  {
    id: "email-sequences",
    title: "Smart Email Sequences",
    description: "AI-powered email sequences that adapt based on recipient engagement and behavior signals.",
    category: "lead-management",
    tags: ["n8n", "OpenAI", "SendGrid"],
    price: 2499,
    icon: "📧",
    includes: ["JSON export", "Email templates", "Setup guide"],
  },
  {
    id: "meeting-prep",
    title: "Meeting Prep Automator",
    description:
      "Automatically prepare briefing docs before customer meetings with recent activity, health score, and talking points.",
    category: "customer-success",
    tags: ["n8n", "Google Calendar", "Notion"],
    price: 1999,
    icon: "📅",
    includes: ["JSON export", "Template docs", "Setup guide"],
  },
]

const bundles = [
  {
    id: "cs-starter",
    title: "CS Starter Pack",
    description: "Everything you need to launch a data-driven CS program",
    templates: ["Health Score Calculator", "Churn Risk Detector", "Meeting Prep Automator"],
    price: 5999,
    originalPrice: 7997,
    savings: "25%",
  },
  {
    id: "lead-gen",
    title: "Lead Gen Bundle",
    description: "Complete lead management from capture to conversion",
    templates: ["Intelligent Lead Router", "Lead Enrichment Pipeline", "Smart Email Sequences"],
    price: 5499,
    originalPrice: 7497,
    savings: "27%",
  },
  {
    id: "ai-ops",
    title: "AI Operations Suite",
    description: "Automate operations with AI-powered agents",
    templates: ["SuccessPilot AI Agent", "ChurnShield AI Agent", "Automated Weekly Reports"],
    price: 8999,
    originalPrice: 10998,
    savings: "18%",
  },
]

const categories = [
  { id: "all", label: "All Categories" },
  { id: "customer-success", label: "Customer Success" },
  { id: "lead-management", label: "Lead Management" },
  { id: "operations", label: "Operations" },
  { id: "ai-agents", label: "AI Agents" },
  { id: "integrations", label: "Integrations" },
]

export default function TemplatesPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "premium">("all")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "all" || t.category === category
    const matchesPrice =
      priceFilter === "all" || (priceFilter === "free" && t.price === 0) || (priceFilter === "premium" && t.price > 0)
    return matchesSearch && matchesCategory && matchesPrice
  })

  const formatPrice = (price: number) => {
    if (price === 0) return "Free"
    return `₹${price.toLocaleString("en-IN")}`
  }

  const handleBuyNow = (template: Template) => {
    if (template.price === 0) {
      // Free template - direct download
      window.location.href = `/api/templates/download?id=${template.id}`
    } else {
      // Paid template - Stripe checkout
      window.location.href = `/api/billing/checkout?template=${template.id}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-white to-gray-50 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">Production-Ready Automation Templates</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            n8n workflows built by integration architects. Import, configure, deploy — in minutes, not weeks.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-40 bg-white border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full md:min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12"
              />
            </div>
            <div className="flex gap-2">
              <Button variant={priceFilter === "all" ? "default" : "outline"} onClick={() => setPriceFilter("all")}>
                All
              </Button>
              <Button variant={priceFilter === "free" ? "default" : "outline"} onClick={() => setPriceFilter("free")}>
                Free
              </Button>
              <Button
                variant={priceFilter === "premium" ? "default" : "outline"}
                onClick={() => setPriceFilter("premium")}
              >
                Premium
              </Button>
            </div>
          </div>
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? "bg-primary text-white"
                    : "bg-white border border-gray-200 hover:border-primary hover:text-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">All Templates</h2>
            <span className="text-gray-500">{filteredTemplates.length} templates</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="h-44 bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center text-6xl relative">
                  {template.icon}
                  {template.badge && (
                    <span
                      className={`absolute top-3 right-3 px-3 py-1 rounded-md text-xs font-semibold text-white ${
                        template.badge === "popular"
                          ? "bg-amber-500"
                          : template.badge === "new"
                            ? "bg-primary"
                            : "bg-purple-500"
                      }`}
                    >
                      {template.badge === "popular" ? "Popular" : template.badge === "new" ? "New" : "Bundle"}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{template.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div>
                      <span className={`text-xl font-bold ${template.price === 0 ? "text-emerald-600" : ""}`}>
                        {formatPrice(template.price)}
                      </span>
                      {template.originalPrice && (
                        <span className="text-sm text-gray-400 line-through ml-2">
                          ₹{template.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setPreviewOpen(true)
                        }}
                      >
                        Preview
                      </Button>
                      <Button size="sm" onClick={() => handleBuyNow(template)}>
                        {template.price === 0 ? "Download" : "Buy Now"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bundles */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Save with Bundles</h2>
          <p className="text-center text-gray-400 mb-12">Get multiple templates at a discount</p>
          <div className="grid md:grid-cols-3 gap-8">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-2">{bundle.title}</h3>
                <p className="text-gray-400 mb-6">{bundle.description}</p>
                <ul className="space-y-2 mb-6">
                  {bundle.templates.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-3xl font-bold">₹{bundle.price.toLocaleString("en-IN")}</span>
                  <span className="text-gray-500 line-through">₹{bundle.originalPrice.toLocaleString("en-IN")}</span>
                  <span className="px-2 py-1 bg-emerald-500 text-white text-xs rounded font-semibold">
                    Save {bundle.savings}
                  </span>
                </div>
                <Button className="w-full" asChild>
                  <Link href={`/api/billing/checkout?bundle=${bundle.id}`}>Get Bundle</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
            <div>
              <FileJson className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h4 className="font-semibold mb-2">Instant JSON Export</h4>
              <p className="text-sm text-gray-600">Import directly into n8n with one click</p>
            </div>
            <div>
              <MessageSquare className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h4 className="font-semibold mb-2">Setup Support</h4>
              <p className="text-sm text-gray-600">Premium templates include 30-min onboarding</p>
            </div>
            <div>
              <Clock className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h4 className="font-semibold mb-2">Lifetime Updates</h4>
              <p className="text-sm text-gray-600">Get future improvements at no extra cost</p>
            </div>
            <div>
              <Download className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h4 className="font-semibold mb-2">Unlimited Downloads</h4>
              <p className="text-sm text-gray-600">Download and use across all your projects</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Template?</h2>
          <p className="text-gray-600 mb-8">
            Our integration architects can build custom workflows for your specific needs.
          </p>
          <Button size="lg" asChild>
            <Link href="/contact?type=custom-template">Request Custom Template</Link>
          </Button>
        </div>
      </section>

      <Footer />

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedTemplate.title}</DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <div className="h-48 bg-gradient-to-br from-blue-50 to-sky-100 rounded-xl flex items-center justify-center text-7xl mb-6">
                  {selectedTemplate.icon}
                </div>
                <div className="flex gap-2 mb-4">
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h4 className="font-semibold mb-2">What's included:</h4>
                <ul className="space-y-2">
                  {selectedTemplate.includes.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <DialogFooter className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold">{formatPrice(selectedTemplate.price)}</span>
                  {selectedTemplate.originalPrice && (
                    <span className="text-gray-400 line-through ml-2">
                      ₹{selectedTemplate.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <Button onClick={() => handleBuyNow(selectedTemplate)}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {selectedTemplate.price === 0 ? "Download Free" : "Buy Now"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
