import Link from "next/link"
import { ArrowRight, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { cms } from "@/lib/cms"
import { CloudinaryImage } from "@/components/media/CloudinaryImage"

export default async function BlogPage() {
  const posts = await cms.getBlogPosts()

  const categories = [
    "All Posts",
    "Productivity OS",
    "Second Brain",
    "Integrations",
    "Architecture",
    "Automation & Agents",
    "Render",
    "Customer Success",
    "Security",
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">The Effortless Work Journal</h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Ideas, playbooks, and product updates—about productivity, tools, AI thinking, and workflow design.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Categories */}
      <section className="border-b border-border bg-muted/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((category, idx) => (
              <Button key={category} variant={idx === 0 ? "outline" : "ghost"} size="sm">
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center">
              <p className="text-muted-foreground">
                No blog posts found. Connect your Sanity or Notion CMS to manage content.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card key={post.slug} className="flex flex-col border-border transition-colors hover:border-primary">
                  {post.coverImagePublicId && (
                    <CloudinaryImage
                      publicId={post.coverImagePublicId}
                      alt={post.title}
                      width={600}
                      height={400}
                      className="w-full rounded-t-lg object-cover"
                      crop="fill"
                      gravity="auto"
                    />
                  )}
                  <CardContent className="flex flex-1 flex-col p-6">
                    <div className="mb-4 inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {post.category}
                    </div>
                    <h3 className="text-balance text-xl font-bold leading-tight">
                      <Link href={`/resources/blog/${post.slug}`} className="hover:text-primary">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-3 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                    <div className="mt-6 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{post.author.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Link
                      href={`/resources/blog/${post.slug}`}
                      className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      Read article <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="border-t border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Stay Updated</h2>
            <p className="mt-4 text-muted-foreground">
              Subscribe to get the latest insights on effortless work, productivity patterns, and product updates
              delivered to your inbox.
            </p>
            <div className="mt-8 flex max-w-md flex-col gap-3 sm:mx-auto sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button>
                Subscribe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No spam. Unsubscribe anytime. We respect your privacy.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
