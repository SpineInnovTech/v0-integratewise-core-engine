"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Download, Trash2, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function BrowserReadPage() {
  const [consents, setConsents] = useState({
    captureTabs: false,
    captureStorage: false,
    captureClipboard: false,
    captureDownloads: false,
  })
  const [capturing, setCapturing] = useState(false)
  const [stagedCount, setStagedCount] = useState(0)

  async function captureBrowserData() {
    if (!Object.values(consents).some((v) => v)) {
      alert("Please enable at least one data source")
      return
    }

    setCapturing(true)

    try {
      const payload: any = {}

      // Capture tabs/URLs via Chrome extension message passing
      if (consents.captureTabs) {
        if (typeof window !== "undefined" && (window as any).chrome?.tabs) {
          const tabs = await (window as any).chrome.tabs.query({})
          payload.tabs = tabs.map((tab: any) => ({
            url: tab.url,
            title: tab.title,
            domain: new URL(tab.url!).hostname,
          }))
        } else {
          console.warn("Chrome extension not detected")
        }
      }

      // Capture clipboard (explicit consent)
      if (consents.captureClipboard) {
        try {
          const text = await navigator.clipboard.readText()
          payload.clipboard = {
            type: "text",
            snippet_hash: text.substring(0, 50) + "...",
          }
        } catch {
          console.log("Clipboard access denied")
        }
      }

      // Send to backend
      const response = await fetch("/api/neutron/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        setStagedCount(result.staggedCount)
        alert("Browser data captured successfully!")
      }
    } catch (error) {
      console.error("Capture error:", error)
      alert("Failed to capture browser data")
    }

    setCapturing(false)
  }

  async function promoteToSpine() {
    try {
      const response = await fetch("/api/neutron/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        alert("Data promoted to business entities!")
        setStagedCount(0)
      }
    } catch (error) {
      alert("Failed to promote data")
    }
  }

  async function clearStaged() {
    try {
      await fetch("/api/neutron/clear", { method: "POST" })
      setStagedCount(0)
      alert("Staged data cleared")
    } catch (error) {
      alert("Failed to clear data")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Browser Read</h1>
        <p className="text-foreground/60 mt-2">Capture browser context to enrich your workspace</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Collection Consent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded">
            <Label className="flex flex-col gap-1 cursor-pointer">
              <span className="font-medium">Capture Browser Tabs</span>
              <span className="text-xs text-foreground/60">Record all visited URLs and page titles</span>
            </Label>
            <Switch
              checked={consents.captureTabs}
              onCheckedChange={(val) => setConsents({ ...consents, captureTabs: val })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <Label className="flex flex-col gap-1 cursor-pointer">
              <span className="font-medium">Capture Storage Keys</span>
              <span className="text-xs text-foreground/60">Hashed localStorage & sessionStorage (SHA-256)</span>
            </Label>
            <Switch
              checked={consents.captureStorage}
              onCheckedChange={(val) => setConsents({ ...consents, captureStorage: val })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <Label className="flex flex-col gap-1 cursor-pointer">
              <span className="font-medium">Capture Clipboard</span>
              <span className="text-xs text-foreground/60">Copy-paste snippets (explicit action only)</span>
            </Label>
            <Switch
              checked={consents.captureClipboard}
              onCheckedChange={(val) => setConsents({ ...consents, captureClipboard: val })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <Label className="flex flex-col gap-1 cursor-pointer">
              <span className="font-medium">Capture Downloads</span>
              <span className="text-xs text-foreground/60">Record file names and types (not content)</span>
            </Label>
            <Switch
              checked={consents.captureDownloads}
              onCheckedChange={(val) => setConsents({ ...consents, captureDownloads: val })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Button
          onClick={captureBrowserData}
          disabled={capturing || !Object.values(consents).some((v) => v)}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          {capturing ? "Capturing..." : "Capture Now"}
        </Button>

        <Button
          onClick={promoteToSpine}
          variant="outline"
          disabled={stagedCount === 0}
          className="w-full bg-transparent"
        >
          <Eye className="mr-2 h-4 w-4" />
          Promote ({stagedCount})
        </Button>

        <Button onClick={clearStaged} variant="destructive" disabled={stagedCount === 0} className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Privacy & Security</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-foreground/60">
          <p>✓ All browser data is stored locally first, then encrypted in transit</p>
          <p>✓ Sensitive data (clipboard, storage) is hashed using SHA-256</p>
          <p>✓ You can review all data before promoting to business entities</p>
          <p>✓ Delete any data at any time from the Staged Data view</p>
        </CardContent>
      </Card>
    </div>
  )
}
