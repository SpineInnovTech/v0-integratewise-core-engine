"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Search, Folder } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface Document {
  id: string
  title: string
  category: string
  created_at: string
  view_count: number
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    let query = supabase.from("documents").select("*").order("created_at", { ascending: false })

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      setDocuments(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDocuments()
  }, [searchQuery])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Knowledge Base
        </h1>
        <p className="text-foreground/60 mt-2">Your personal documents and insights</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">Loading documents...</CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">No documents yet</CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-2">
                  <Folder className="h-5 w-5 flex-shrink-0 mt-1 text-blue-500" />
                  <span className="line-clamp-2">{doc.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm text-foreground/60">
                  <span>{doc.category}</span>
                  <span>{doc.view_count} views</span>
                </div>
                <div className="text-xs text-foreground/50">{new Date(doc.created_at).toLocaleDateString()}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
