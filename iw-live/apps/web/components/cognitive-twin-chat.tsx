"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Sparkles, CheckCircle2, FileText, Lightbulb, Send } from "lucide-react"

interface CognitiveTwinChatProps {
  className?: string
}

export function CognitiveTwinChat({ className }: CognitiveTwinChatProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I'm your Cognitive Twin. I can help you with questions, extract tasks, summarize content, and find connections across your workspace.",
    },
  ])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    // Simulate AI response (in real app, call API)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm processing your request. In the full implementation, I'll retrieve context from The Spine, surface relevant insights, and propose actions.",
        },
      ])
    }, 1000)
  }

  return (
    <Card className={cn("bg-gradient-to-br from-card to-card/95 border-border/50 shadow-lg", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Cognitive Twin</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
        <CardDescription>Ask questions, get summaries, extract tasks, or draft content from your knowledge</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask Cognitive Twin anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" size="sm" className="text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Extract Tasks
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Summarize
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            <Lightbulb className="h-3 w-3 mr-1" />
            Find Connections
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
