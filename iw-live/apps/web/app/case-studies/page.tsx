// Case Studies index page - Using design tokens
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { CloudinaryImage } from "@/components/media/CloudinaryImage"
import { getCollection } from "@/lib/cms/data-loaders"
import type { CaseStudy } from "@/lib/cms/types"
import Link from "next/link"
import { ArrowRight, Building2, TrendingUp } from "lucide-react"

export const revalidate = 60

export const metadata = {
  title: "Case Studies | IntegrateWise",
  description: "See how leading companies use IntegrateWise AI Workspace to unify their tools and boost productivity.",
}

export default async function CaseStudiesPage() {
  const caseStudies = await getCollection<CaseStudy>("caseStudies", { status: "published" })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero - Using design tokens */}
        <section className="py-20 px-4 bg-muted">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Customer Success Stories</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover how leading companies leverage IntegrateWise AI Workspace to unify their tools, automate
              workflows, and drive measurable business outcomes.
            </p>
          </div>
        </section>

        {/* Case Studies Grid */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {caseStudies.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {caseStudies.map((study) => (
                  <Link
                    key={study.id}
                    href={`/case-studies/${study.slug}`}
                    className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {study.coverAssetId ? (
                      <CloudinaryImage
                        publicId={study.coverAssetId}
                        alt={study.title}
                        preset="card"
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-muted-foreground/60" />
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-sm text-primary font-medium mb-2 uppercase tracking-wide">
                        {study.clientName}
                      </p>
                      <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {study.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 line-clamp-2">{study.summary}</p>
                      {study.impactMetrics && Object.keys(study.impactMetrics).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {Object.entries(study.impactMetrics)
                            .slice(0, 2)
                            .map(([key, value]) => (
                              <span
                                key={key}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm text-foreground"
                              >
                                <TrendingUp className="w-3 h-3 text-success" />
                                {value}
                              </span>
                            ))}
                        </div>
                      )}
                      <span className="inline-flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                        Read case study <ArrowRight className="w-4 h-4 ml-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Building2 className="w-16 h-16 text-muted-foreground/60 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Case studies coming soon</h3>
                <p className="text-muted-foreground">
                  We&apos;re documenting success stories from our customers. Check back soon!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA - Using semantic colors */}
        <section className="py-16 px-4 bg-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-background mb-4">Ready to become our next success story?</h2>
            <p className="text-background/70 mb-8 max-w-2xl mx-auto">
              Join hundreds of companies that have transformed their workflows with IntegrateWise AI Workspace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="btn-primary">
                Book a Demo
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 bg-background text-foreground font-medium rounded-lg hover:bg-muted transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
