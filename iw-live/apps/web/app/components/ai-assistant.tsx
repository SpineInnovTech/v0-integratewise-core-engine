"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Bot, Send, User, Loader2 } from "lucide-react"

interface AIAssistantProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const suggestedQuestions = [
  "How are we doing this month?",
  "Compare actual to targets",
  "What tasks need attention?",
  "Summarize recent activity",
]

export function AIAssistant({ open, onOpenChange }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI assistant with access to all your business metrics, documents, and tasks. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "I couldn't process that request." },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col bg-card">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">AI Chat</SheetTitle>
            <Button variant="outline" size="sm" className="text-primary border-primary bg-transparent">
              Upgrade Plan
            </Button>
          </div>
        </SheetHeader>

        <div className="py-3 px-4 bg-muted/50 rounded-lg my-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium">AI Assistant - Connected to your metrics and documents</p>
        </div>

        <ScrollArea className="flex-1 py-4">
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div key={idx} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="rounded-2xl px-4 py-2 bg-muted text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="mb-4">
          <p className="text-sm font-medium text-foreground mb-3">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                onClick={() => handleSuggestedQuestion(question)}
                className="text-sm px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-border">
          <Input
            placeholder="Ask me anything about your business..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="bg-muted/50"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
