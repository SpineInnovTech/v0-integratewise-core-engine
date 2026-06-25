import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { cms } from "@/lib/cms"
import { CloudinaryImage } from "@/components/media/CloudinaryImage"

export default async function CaseStudiesPage() {
  const caseStudies = await cms.getCaseStudies()

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">Customer Success Stories</h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              See how teams across industries use IntegrateWise to achieve effortless work.
            </p>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {caseStudies.length === 0 ? (
            <div className="text-center">
              <p className="text-muted-foreground">
                No case studies available yet. Check back soon or connect your CMS to add content.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-16">
              {caseStudies.map((study) => (
                <Card key={study.id} className="border-2 border-border">
                  <CardContent className="p-8 lg:p-12">
                    <div className="grid gap-12 lg:grid-cols-2">
                      <div>
                        {study.logoPublicId && (
                          <div className="mb-6">
                            <CloudinaryImage
                              publicId={study.logoPublicId}
                              alt={`${study.company} logo`}
                              width={200}
                              height={60}
                              className="h-12 w-auto object-contain"
                              crop="fit"
                            />
                          </div>
                        )}
                        <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {study.industry}
                        </div>
                        <h2 className="mt-4 text-2xl font-bold lg:text-3xl">{study.title}</h2>
                        <div className="mt-6">
                          <p className="leading-relaxed text-muted-foreground">{study.excerpt}</p>
                        </div>
                        <Button className="mt-8" asChild>
                          <Link href={`/resources/case-studies/${study.slug}`}>
                            Read Full Story <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      <div className="flex flex-col justify-center rounded-lg border-2 border-primary/20 bg-primary/5 p-8">
                        <h3 className="font-semibold">Results</h3>
                        <div className="mt-6 space-y-4">
                          {study.results.map((result) => (
                            <div key={result.metric} className="flex items-start gap-3">
                              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                              <div>
                                <p className="text-lg font-medium">{result.value}</p>
                                <p className="text-sm text-muted-foreground">{result.metric}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to write your own success story?
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              Join hundreds of teams using IntegrateWise to transform how they work.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#">Book Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
