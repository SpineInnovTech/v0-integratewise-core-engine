// Individual case study page - SSOT v3.2
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { CloudinaryImage } from "@/components/media/CloudinaryImage"
import { getCaseStudyBySlug, generateCaseStudyStaticParams } from "@/lib/cms/data-loaders"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Calendar, Tag } from "lucide-react"
import type { Metadata } from "next"

export const revalidate = 60

export async function generateStaticParams() {
  return generateCaseStudyStaticParams()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const caseStudy = await getCaseStudyBySlug(slug)

  if (!caseStudy) {
    return { title: "Case Study Not Found | IntegrateWise" }
  }

  return {
    title: `${caseStudy.seoTitle || caseStudy.title} | IntegrateWise`,
    description: caseStudy.seoDescription || caseStudy.summary,
  }
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const caseStudy = await getCaseStudyBySlug(slug)

  if (!caseStudy) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-12 px-4 bg-[#F3F4F6]">
          <div className="max-w-4xl mx-auto">
            <Link href="/case-studies" className="inline-flex items-center text-[#3F51B5] hover:text-[#303F9F] mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Case Studies
            </Link>
            <p className="text-sm text-[#3F51B5] font-medium uppercase tracking-wide mb-2">{caseStudy.clientName}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1E2A4A] mb-4">{caseStudy.title}</h1>
            <p className="text-xl text-[#64748B] mb-6">{caseStudy.summary}</p>
            {caseStudy.publishedAt && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Calendar className="w-4 h-4" />
                {new Date(caseStudy.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
          </div>
        </section>

        {/* Cover Image */}
        {caseStudy.coverAssetId && (
          <section className="px-4">
            <div className="max-w-5xl mx-auto -mt-4">
              <CloudinaryImage
                publicId={caseStudy.coverAssetId}
                alt={caseStudy.title}
                preset="hero"
                className="w-full rounded-xl shadow-lg"
              />
            </div>
          </section>
        )}

        {/* Impact Metrics */}
        {caseStudy.impactMetrics && Object.keys(caseStudy.impactMetrics).length > 0 && (
          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold text-[#1E2A4A] mb-6">Key Results</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(caseStudy.impactMetrics).map(([key, value]) => (
                  <div key={key} className="p-4 bg-white border border-[#E5E7EB] rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-[#3F51B5]">{value}</p>
                    <p className="text-sm text-[#64748B] capitalize">{key.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-lg max-w-none prose-headings:text-[#1E2A4A] prose-p:text-[#64748B] prose-a:text-[#3F51B5]">
              <div dangerouslySetInnerHTML={{ __html: caseStudy.body || "" }} />
            </article>
          </div>
        </section>

        {/* Hub Tag */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#64748B]" />
              <span className="text-sm text-[#64748B]">Hub:</span>
              <span className="px-3 py-1 bg-[#3F51B5] text-white text-sm rounded-full capitalize">{caseStudy.hub}</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-[#F3F4F6]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">Achieve similar results for your team</h2>
            <p className="text-[#64748B] mb-8">See how IntegrateWise AI Workspace can transform your workflows.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo"
                className="px-8 py-3 bg-[#3F51B5] text-white font-medium rounded-lg hover:bg-[#303F9F] transition-colors"
              >
                Book a Demo
              </Link>
              <Link
                href="/case-studies"
                className="px-8 py-3 border border-[#3F51B5] text-[#3F51B5] font-medium rounded-lg hover:bg-[#3F51B5] hover:text-white transition-colors"
              >
                More Case Studies
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
