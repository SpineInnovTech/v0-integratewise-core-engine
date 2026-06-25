"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import Link from "next/link"

const mockContacts = [
  {
    id: "CONT-00847",
    name: "Mike Johnson",
    title: "CTO",
    department: "Engineering",
    email: "mike.j@nexlify.com",
    phone: "(415) 555-0123",
    accountId: "2",
    accountName: "Nexlify",
    influenceLevel: "champion",
    relationshipStrength: "strong",
    lastContact: "2 days ago",
  },
]

export function CSContactsView() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Contacts & Stakeholders Hub</h1>
        <p className="text-base text-muted-foreground max-w-3xl">
          Customer relationships, champions, and MEDDIC influence mapping
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/95">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Total Contacts</div>
            <div className="text-3xl font-bold text-foreground mb-2">8</div>
            <div className="text-sm text-muted-foreground">Across all accounts</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search contacts by name, title, account, or email..."
            className="pl-11 h-10 rounded-lg"
          />
        </div>
        <Button variant="default" className="h-12 px-6 border-2">
          All Contacts
        </Button>
      </div>

      <Card className="border-3 border-border bg-muted">
        <CardHeader>
          <CardTitle className="text-lg">Stakeholder Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-5">
            {mockContacts.map((contact) => (
              <Card key={contact.id} className="border-2 border-border min-h-[200px]">
                <CardContent className="p-6">
                  <div className="font-mono text-xs text-muted-foreground mb-2">{contact.id}</div>
                  <div className="text-lg font-bold mb-2 text-foreground">{contact.name}</div>
                  <div className="text-sm text-muted-foreground mb-1">{contact.title}</div>
                  <div className="text-sm text-muted-foreground mb-3">{contact.department}</div>
                  <Badge variant="outline" className="border-2 mb-2">
                    {contact.influenceLevel.toUpperCase()}
                  </Badge>
                  <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
                    <div>Email: {contact.email}</div>
                    <div>Phone: {contact.phone}</div>
                    <div>Last Contact: {contact.lastContact}</div>
                    <div className="mt-2">
                      Account:{" "}
                      <Link
                        href={`/cs/accounts/${contact.accountId}`}
                        className="text-primary font-semibold hover:underline"
                      >
                        {contact.accountName}
                      </Link>
                    </div>
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
