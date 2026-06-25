import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Video } from "lucide-react"
import Link from "next/link"

const mockMeetings = [
  {
    id: "MEET-00523",
    title: "Weekly Check-in Meeting",
    accountId: "2",
    accountName: "Nexlify",
    date: "2025-11-01",
    time: "14:00",
    duration: 60,
    type: "check-in",
    status: "scheduled",
    attendees: ["Sarah Kim", "Mike Johnson"],
  },
]

export function CSMeetingsView() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Meetings & Calls</h1>
        <p className="text-base text-muted-foreground max-w-3xl">
          Customer engagement calendar and call management
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search meetings by title or account..."
            className="pl-11 h-10 rounded-lg"
          />
        </div>
        <Button variant="default" className="h-12 px-6 border-2">
          All Meetings
        </Button>
        <Button variant="outline" className="h-12 px-6 border-2">
          Check-ins
        </Button>
        <Button variant="outline" className="h-12 px-6 border-2">
          QBRs
        </Button>
      </div>

      <Card className="border-3 border-border bg-muted">
        <CardHeader>
          <CardTitle className="text-lg">Scheduled Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockMeetings.map((meeting) => (
              <Card key={meeting.id} className="border-2 border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-mono text-xs text-muted-foreground mb-2">{meeting.id}</div>
                      <div className="text-lg font-bold text-foreground mb-2">{meeting.title}</div>
                      <div className="flex gap-2 mb-3">
                        <Badge variant="outline" className="border-2">
                          {meeting.type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="border-2">
                          {meeting.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Account: {meeting.accountName}</div>
                        <div>
                          Date: {meeting.date} at {meeting.time} ({meeting.duration} min)
                        </div>
                        <div>Attendees: {meeting.attendees.join(", ")}</div>
                      </div>
                    </div>
                    <Video className="w-5 h-5 text-muted-foreground mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
