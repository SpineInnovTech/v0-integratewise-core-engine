"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { mutate } from "swr"

interface AddProjectDialogProps {
  clientId?: string
}

export function AddProjectDialog({ clientId }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_id: clientId || "",
    name: "",
    description: "",
    type: "integration",
    priority: "medium",
    start_date: "",
    target_date: "",
    tech_stack: "",
    team_members: "",
    estimated_hours: 0,
    budget: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("client_projects").insert({
        ...formData,
        tech_stack: formData.tech_stack.split(",").map((t) => t.trim()),
        team_members: formData.team_members.split(",").map((t) => t.trim()),
        status: "planning",
        progress: 0,
      })

      if (error) throw error

      mutate("client-projects")
      setOpen(false)
      setFormData({
        client_id: clientId || "",
        name: "",
        description: "",
        type: "integration",
        priority: "medium",
        start_date: "",
        target_date: "",
        tech_stack: "",
        team_members: "",
        estimated_hours: 0,
        budget: 0,
      })
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Start a new client project or implementation</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="API Gateway Implementation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Implement centralized API gateway with MuleSoft..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Project Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mulesoft">MuleSoft</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="saas">SaaS Development</SelectItem>
                  <SelectItem value="automation">Automation</SelectItem>
                  <SelectItem value="training">Training Program</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tech_stack">Tech Stack (comma-separated)</Label>
            <Input
              id="tech_stack"
              placeholder="Next.js, Supabase, Vercel"
              value={formData.tech_stack}
              onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_members">Team Members (comma-separated)</Label>
            <Input
              id="team_members"
              placeholder="Nirmal Prince, Dev Team"
              value={formData.team_members}
              onChange={(e) => setFormData({ ...formData, team_members: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number.parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
