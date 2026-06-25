"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, TrendingUp, FileText, MessageSquare, Settings, User, Link2, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSearch } from "@/lib/hooks/use-data"
import { useRouter } from "next/navigation"

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  const { data: searchResults, isLoading } = useSearch(query)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchResults])

  const navigateTo = (path: string) => {
    router.push(path)
    onOpenChange(false)
    setQuery("")
  }

  // Static settings items (always shown)
  const staticSettings = [
    { icon: User, title: "Profile", path: "/settings", type: "setting" },
    { icon: Link2, title: "Integrations", path: "/integrations", type: "setting" },
    { icon: CreditCard, title: "Billing", path: "/settings", type: "setting" },
  ]

  const hasResults =
    searchResults &&
    (searchResults.documents?.length > 0 || searchResults.tasks?.length > 0 || searchResults.metrics?.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-card overflow-hidden">
        <DialogDescription className="sr-only">
          Search for documents, tasks, metrics, and settings across IntegrateWise
        </DialogDescription>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search everything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-20 h-12 text-base bg-card border-border"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium">
                Cmd+K
              </span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto px-2 pb-4">
          {isLoading && query ? (
            <div className="px-2 py-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Metrics Results */}
              {searchResults?.metrics && searchResults.metrics.length > 0 && (
                <div className="px-2 py-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Metrics</p>
                  {searchResults.metrics.map((item: any, idx: number) => (
                    <button
                      key={item.id || idx}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                      onClick={() => navigateTo("/metrics")}
                    >
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.metric_name}: {item.metric_value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.change_direction} {item.change_percentage}%
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Documents Results */}
              {searchResults?.documents && searchResults.documents.length > 0 && (
                <div className="px-2 py-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Documents</p>
                  {searchResults.documents.map((item: any, idx: number) => (
                    <button
                      key={item.id || idx}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                        idx === 0 && query ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                      onClick={() => navigateTo(`/knowledge/${item.category}`)}
                    >
                      <FileText
                        className={cn("h-4 w-4", idx === 0 && query ? "text-primary-foreground" : "text-primary")}
                      />
                      <div className="flex-1">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            idx === 0 && query ? "text-primary-foreground" : "text-foreground",
                          )}
                        >
                          {item.title}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            idx === 0 && query ? "text-primary-foreground/70" : "text-muted-foreground",
                          )}
                        >
                          {item.category} • {item.description?.slice(0, 50)}...
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks Results */}
              {searchResults?.tasks && searchResults.tasks.length > 0 && (
                <div className="px-2 py-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tasks</p>
                  {searchResults.tasks.map((item: any, idx: number) => (
                    <button
                      key={item.id || idx}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                      onClick={() => navigateTo("/tasks")}
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.status} • {item.priority} priority
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results message */}
              {query && !isLoading && !hasResults && (
                <div className="px-4 py-8 text-center">
                  <p className="text-muted-foreground">No results found for "{query}"</p>
                </div>
              )}

              {/* Settings - Always shown */}
              <div className="px-2 py-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Settings</p>
                {staticSettings.map((item, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                    onClick={() => navigateTo(item.path)}
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                    </div>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
