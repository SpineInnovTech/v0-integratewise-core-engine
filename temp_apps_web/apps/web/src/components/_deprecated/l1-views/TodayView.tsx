import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, CheckSquare } from "lucide-react";

type Priority = "low" | "medium" | "high";

interface FocusItem {
  id: string;
  title: string;
  time?: string;
  priority: Priority;
}

interface MeetingItem {
  id: string;
  title: string;
  time: string;
  attendees: number;
}

const mockFocus: FocusItem[] = [
  { id: "t1", title: "Review priorities for the week", time: "10:00 AM", priority: "high" },
  { id: "t2", title: "Finish sprint planning notes", time: "2:00 PM", priority: "medium" },
  { id: "t3", title: "Send project status update", time: "4:30 PM", priority: "low" },
];

const mockMeetings: MeetingItem[] = [
  { id: "m1", title: "Team Standup", time: "9:00 AM - 9:15 AM", attendees: 8 },
  { id: "m2", title: "Project Review", time: "11:00 AM - 12:00 PM", attendees: 5 },
  { id: "m3", title: "Customer Sync", time: "3:30 PM - 4:00 PM", attendees: 6 },
];

export default function TodayView() {
  const badgeVariantFor = (priority: Priority) => {
    if (priority === "high") return "destructive" as const;
    if (priority === "medium") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Today</h1>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Focus
              <Badge variant="secondary" className="ml-2">
                {mockFocus.length}
              </Badge>
            </CardTitle>
            <CardDescription>Work items for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockFocus.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <Checkbox className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{item.title}</div>
                      <Badge variant={badgeVariantFor(item.priority)}>{item.priority}</Badge>
                    </div>
                    {item.time ? (
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.time}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </CardTitle>
            <CardDescription>Meetings and time blocks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockMeetings.map((meeting) => (
                <div key={meeting.id} className="p-3 border rounded-lg bg-card">
                  <div className="text-sm font-medium">{meeting.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{meeting.time}</span>
                    <span>•</span>
                    <span>{meeting.attendees} attendees</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="w-full">
                New task
              </Button>
              <Button variant="outline" className="w-full">
                Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
