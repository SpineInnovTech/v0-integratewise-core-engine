// Individual blog post page - SSOT v3.2
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { CloudinaryImage } from "@/components/media/CloudinaryImage"
import { getArticleBySlug, generateBlogStaticParams } from "@/lib/cms/data-loaders"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, User, Calendar, Tag } from "lucide-react"
import type { Metadata } from "next"

export const revalidate = 60

export async function generateStaticParams() {
  return generateBlogStaticParams()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return { title: "Article Not Found | IntegrateWise" }
  }

  return {
    title: `${article.seoTitle || article.title} | IntegrateWise Blog`,
    description: article.seoDescription || article.summary,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-12 px-4 bg-[#F3F4F6]">
          <div className="max-w-4xl mx-auto">
            <Link href="/blog" className="inline-flex items-center text-[#3F51B5] hover:text-[#303F9F] mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Articles
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1E2A4A] mb-4">{article.title}</h1>
            <p className="text-xl text-[#64748B] mb-6">{article.summary}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748B]">
              {article.authors?.[0] && (
                <div className="flex items-center gap-2">
                  {article.authors[0].avatar && (
                    <img
                      src={article.authors[0].avatar || "/placeholder.svg"}
                      alt={article.authors[0].name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {article.authors[0].name}
                  </span>
                </div>
              )}
              {article.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
              {article.readTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.readTime} min read
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Cover Image */}
        {article.coverAssetId && (
          <section className="px-4">
            <div className="max-w-5xl mx-auto -mt-4">
              <CloudinaryImage
                publicId={article.coverAssetId}
                alt={article.title}
                preset="hero"
                className="w-full rounded-xl shadow-lg"
              />
            </div>
          </section>
        )}

        {/* Content */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-lg max-w-none prose-headings:text-[#1E2A4A] prose-p:text-[#64748B] prose-a:text-[#3F51B5] prose-code:bg-[#F3F4F6] prose-code:px-1 prose-code:rounded">
              <div dangerouslySetInnerHTML={{ __html: article.body || "" }} />
            </article>
          </div>
        </section>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <section className="py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 flex-wrap">
                <Tag className="w-4 h-4 text-[#64748B]" />
                {article.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-[#F3F4F6] text-sm text-[#64748B] rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 px-4 bg-[#F3F4F6]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">Ready to transform your workflow?</h2>
            <p className="text-[#64748B] mb-8">See IntegrateWise AI Workspace in action.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo"
                className="px-8 py-3 bg-[#3F51B5] text-white font-medium rounded-lg hover:bg-[#303F9F] transition-colors"
              >
                Book a Demo
              </Link>
              <Link
                href="/blog"
                className="px-8 py-3 border border-[#3F51B5] text-[#3F51B5] font-medium rounded-lg hover:bg-[#3F51B5] hover:text-white transition-colors"
              >
                More Articles
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
