"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sparkles, X, Eye, Ban } from "lucide-react"
import { useEffect, useState } from "react"

function DemoBannerContent() {
  const [showRestricted, setShowRestricted] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get("demo_restricted") === "true") {
      setShowRestricted(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("demo_restricted")
      router.replace(url.pathname)
    }
  }, [searchParams, router])

  if (dismissed) return null

  return (
    <>
      {/* Restricted access toast */}
      {showRestricted && (
        <div className="fixed top-4 right-4 z-50 bg-destructive text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2">
          <Ban className="h-5 w-5" />
          <span className="text-sm font-medium">This area is not available in demo mode</span>
          <button onClick={() => setShowRestricted(false)} className="ml-2 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Persistent demo banner */}
      <div className="bg-primary/5 border-b border-primary/10 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm text-foreground">
              <strong className="text-primary">Demo Mode:</strong>{" "}
              <span className="text-muted-foreground">
                Some features are view-only <Eye className="h-3.5 w-3.5 inline text-primary" /> 
                and others are restricted <Ban className="h-3.5 w-3.5 inline text-muted-foreground" />.
              </span>
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </>
  )
}

export function DemoBanner() {
  return (
    <Suspense fallback={null}>
      <DemoBannerContent />
    </Suspense>
  )
}
