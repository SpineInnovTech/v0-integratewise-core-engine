import { AppShell } from "@/components/app-shell"
import { CSMeetingsView } from "@/components/views/cs-meetings-view"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

export default function MeetingsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div>Loading...</div>}>
        <CSMeetingsView />
      </Suspense>
    </AppShell>
  )
}
