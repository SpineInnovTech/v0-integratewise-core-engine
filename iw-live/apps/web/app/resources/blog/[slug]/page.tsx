import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, User, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { cms } from "@/lib/cms"
import { CloudinaryImage } from "@/components/media/CloudinaryImage"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await cms.getBlogPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <article className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/resources/blog"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>

          {/* Article Header */}
          <header className="mt-8">
            <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {post.category}
            </div>
            <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">{post.title}</h1>
            <p className="mt-6 text-pretty text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>

            {/* Meta */}
            <div className="mt-8 flex flex-wrap items-center gap-6 border-y border-border py-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {post.readTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime} min read</span>
                </div>
              )}
            </div>
          </header>

          {post.coverImagePublicId && (
            <div className="mt-12">
              <CloudinaryImage
                publicId={post.coverImagePublicId}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full rounded-lg object-cover"
                priority
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg prose-slate mt-12 max-w-none dark:prose-invert">
            {/* For now, render content as markdown-like text */}
            {/* In production, you'd use a markdown parser like react-markdown */}
            <div className="whitespace-pre-wrap">{post.content}</div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 border-t border-border pt-8">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 rounded-lg border-2 border-primary/20 bg-primary/5 p-8 text-center">
            <h3 className="text-2xl font-bold">Ready to experience effortless work?</h3>
            <p className="mt-3 text-muted-foreground">
              Start using IntegrateWise today and transform how your team works.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/">Start Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">Book Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  )
}
