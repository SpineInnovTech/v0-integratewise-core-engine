import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const savedDismissed = sessionStorage.getItem("demoBannerDismissed")
    if (savedDismissed) setDismissed(true)
  }, [])

  if (dismissed) return null

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-700">
            <strong>Demo Mode:</strong> Viewing IntegrateWise OS with sample data.
          </span>
        </div>
        <button
          onClick={() => {
            setDismissed(true)
            sessionStorage.setItem("demoBannerDismissed", "true")
          }}
          className="text-amber-600 hover:text-amber-700 text-sm font-medium"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
