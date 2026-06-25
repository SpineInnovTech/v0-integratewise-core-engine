"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import {
  Search,
  Star,
  ExternalLink,
  Building2,
  Users,
  Crown,
  GraduationCap,
  Presentation,
  Award,
  FileText,
  Bot,
  Wand2,
  Database,
  Share2,
  Users2,
  ArrowRight,
  Filter,
  ShoppingCart,
} from "lucide-react"
import Link from "next/link"

interface Product {
  id: string
  name: string
  description: string
  tier: number
  tier_name: string
  category: string
  pricing_model: string
  price_min: number
  price_max: number
  currency: string
  is_featured: boolean
  is_active: boolean
  icon: string
  features: string[]
  ideal_for: string
  external_url: string | null
}

const tierConfig = [
  {
    id: 1,
    name: "Professional Services",
    color: "bg-blue-500",
    lightColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: 2,
    name: "Recurring Revenue",
    color: "bg-amber-500",
    lightColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  { id: 3, name: "Scalable", color: "bg-teal-500", lightColor: "bg-teal-50 text-teal-700 border-teal-200" },
  {
    id: 4,
    name: "Digital + SaaS",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  { id: 5, name: "Community", color: "bg-rose-500", lightColor: "bg-rose-50 text-rose-700 border-rose-200" },
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Users,
  Crown,
  GraduationCap,
  Presentation,
  Award,
  FileText,
  Bot,
  Wand2,
  Database,
  Share2,
  Users2,
}

function formatPrice(min: number, max: number, currency: string, model: string): string {
  if (model === "free" || (min === 0 && max === 0)) return "Free"
  const symbol = currency === "USD" ? "$" : "₹"
  const formatNum = (n: number) => {
    if (currency === "USD") return n.toLocaleString()
    if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
    return n.toLocaleString()
  }
  const suffix = model === "monthly" ? "/mo" : model === "yearly" ? "/yr" : ""
  if (min === max) return `${symbol}${formatNum(min)}${suffix}`
  return `${symbol}${formatNum(min)} - ${symbol}${formatNum(max)}${suffix}`
}

export function ProductsView() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedTier, setSelectedTier] = useState<number | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("tier", { ascending: true })
        .order("is_featured", { ascending: false })
      if (!error && data) setProducts(data)
      setLoading(false)
    }
    fetchProducts()
  }, [])

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
    const matchesTier = !selectedTier || p.tier === selectedTier
    return matchesSearch && matchesTier
  })

  const tierCounts = tierConfig.map((t) => ({
    ...t,
    count: products.filter((p) => p.tier === t.id).length,
  }))

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} offerings across 5 tiers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button size="sm" className="h-9 shrink-0" asChild>
            <Link href="/sales">
              <ShoppingCart className="h-4 w-4 mr-1.5" />
              Sales Hub
            </Link>
          </Button>
        </div>
      </div>

      {/* Tier Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTier === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTier(null)}
          className="h-8"
        >
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          All ({products.length})
        </Button>
        {tierCounts.map((tier) => (
          <Button
            key={tier.id}
            variant={selectedTier === tier.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTier(selectedTier === tier.id ? null : tier.id)}
            className="h-8"
          >
            <span className={`h-2 w-2 rounded-full ${tier.color} mr-1.5`} />
            {tier.name} ({tier.count})
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const IconComponent = iconMap[product.icon] || Building2
          const tier = tierConfig.find((t) => t.id === product.tier)

          return (
            <Card key={product.id} className="group hover:shadow-md transition-all border-border/50">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${tier?.lightColor || "bg-muted"}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                      {product.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                    </div>
                    <Badge variant="outline" className={`text-xs mt-1 ${tier?.lightColor}`}>
                      {product.tier_name || tier?.name}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <Badge variant="secondary" className="text-xs">
                    {product.category || "General"}
                  </Badge>
                  <div className="flex gap-2">
                    {product.external_url ? (
                      <Button size="sm" variant="ghost" className="h-8 px-3" asChild>
                        <a href={product.external_url} target="_blank" rel="noopener noreferrer">
                          View <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-8 px-3">
                        Details <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-foreground mb-1">No products found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  )
}
