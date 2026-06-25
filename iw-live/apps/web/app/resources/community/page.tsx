import Link from "next/link"
import { ArrowRight, MessageCircle, Users, Calendar, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
              Join the IntegrateWise Community
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Connect with other users, share workflows, get help, and shape the future of effortless work.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="#">
                  Join Discord <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MessageCircle,
                title: "Discussion Forums",
                desc: "Ask questions, share tips, and learn from other users.",
              },
              {
                icon: Users,
                title: "User Groups",
                desc: "Join groups for your role, industry, or use case.",
              },
              {
                icon: Calendar,
                title: "Events & Webinars",
                desc: "Attend live sessions, workshops, and product demos.",
              },
              {
                icon: Award,
                title: "Champions Program",
                desc: "Become a community leader and get exclusive benefits.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="border-border">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="border-t border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Popular Topics</h2>
            <p className="mt-4 text-muted-foreground">See what the community is talking about</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Best integration setups", replies: 45, views: 1200 },
              { title: "How to use ChurnShield agent effectively", replies: 32, views: 890 },
              { title: "Template library for sales teams", replies: 28, views: 750 },
              { title: "BYOM setup guide", replies: 56, views: 1500 },
              { title: "Second Brain workflows", replies: 41, views: 980 },
              { title: "Customer Success playbooks", replies: 38, views: 850 },
            ].map((topic) => (
              <Card key={topic.title} className="border-border transition-colors hover:border-primary">
                <CardContent className="p-6">
                  <h3 className="font-semibold">
                    <Link href="#" className="hover:text-primary">
                      {topic.title}
                    </Link>
                  </h3>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{topic.replies} replies</span>
                    <span>•</span>
                    <span>{topic.views} views</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline">View All Topics</Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Start contributing today</h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              Your experience and insights can help others succeed with IntegrateWise.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#">
                  Join Discord <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#">Browse Forums</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
