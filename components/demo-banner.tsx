"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AlertTriangle, X, Eye, Ban } from "lucide-react"

export function DemoBanner() {
  const [isDemoUser, setIsDemoUser] = useState(false)
  const [showRestricted, setShowRestricted] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    setIsDemoUser(document.cookie.includes("demo_session=true"))

    // Check if redirected from restricted route
    if (searchParams.get("demo_restricted") === "true") {
      setShowRestricted(true)
      // Remove the query param
      const url = new URL(window.location.href)
      url.searchParams.delete("demo_restricted")
      router.replace(url.pathname)
    }
  }, [searchParams, router])

  if (!isDemoUser || dismissed) return null

  return (
    <>
      {/* Restricted access toast */}
      {showRestricted && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2">
          <Ban className="h-5 w-5" />
          <span className="text-sm font-medium">This area is not available in demo mode</span>
          <button onClick={() => setShowRestricted(false)} className="ml-2 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Persistent demo banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              <strong>Demo Mode:</strong> You have limited access. Some features are view-only{" "}
              <Eye className="h-3.5 w-3.5 inline" /> and others are restricted <Ban className="h-3.5 w-3.5 inline" />.
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </>
  )
}
