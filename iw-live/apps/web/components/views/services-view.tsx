"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Briefcase,
  TrendingUp,
  GraduationCap,
  Cloud,
  Package,
  Users,
  Search,
  Filter,
  ArrowRight,
  ShoppingCart,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const tierConfig = [
  {
    id: 1,
    name: "Professional",
    icon: Briefcase,
    color: "bg-blue-500",
    lightColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: 2,
    name: "Recurring",
    icon: TrendingUp,
    color: "bg-green-500",
    lightColor: "bg-green-50 text-green-700 border-green-200",
  },
  {
    id: 3,
    name: "Scalable",
    icon: GraduationCap,
    color: "bg-amber-500",
    lightColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: 4,
    name: "SaaS",
    icon: Cloud,
    color: "bg-orange-500",
    lightColor: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    id: 5,
    name: "Digital",
    icon: Package,
    color: "bg-pink-500",
    lightColor: "bg-pink-50 text-pink-700 border-pink-200",
  },
  {
    id: 6,
    name: "Community",
    icon: Users,
    color: "bg-teal-500",
    lightColor: "bg-teal-50 text-teal-700 border-teal-200",
  },
]

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.from("services").select("*").order("tier").order("name")
  if (error) throw error
  return data
}

export function ServicesView() {
  const { data: services, isLoading } = useSWR("services", fetcher)
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [search, setSearch] = useState("")

  const filteredServices = services?.filter((s: any) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())
    const matchesTier = !selectedTier || s.tier === selectedTier
    return matchesSearch && matchesTier
  })

  const tierCounts = tierConfig.map((t) => ({
    ...t,
    count: services?.filter((s: any) => s.tier === t.id).length || 0,
  }))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">IntegrateWise service catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
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
          All ({services?.length || 0})
        </Button>
        {tierCounts.map((tier) => {
          const Icon = tier.icon
          return (
            <Button
              key={tier.id}
              variant={selectedTier === tier.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTier(selectedTier === tier.id ? null : tier.id)}
              className="h-8"
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {tier.name} ({tier.count})
            </Button>
          )
        })}
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices?.map((service: any) => {
            const tier = tierConfig.find((t) => t.id === service.tier)
            const Icon = tier?.icon || Package

            return (
              <Card key={service.id} className="group hover:shadow-md transition-all border-border/50">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${tier?.lightColor || "bg-muted"}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{service.name}</h3>
                      <Badge variant="outline" className={`text-xs mt-1 ${tier?.lightColor}`}>
                        Tier {service.tier} - {tier?.name}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <Badge variant="secondary" className="text-xs">
                      {service.category || tier?.name}
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-8 px-3">
                      Details <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredServices?.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-foreground mb-1">No services found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  )
}
