import React from "react";
import { Layout } from "./Layout";
import { Heart, Target, Users, Lightbulb, TrendingUp, Award } from "lucide-react";

export function StoryPage() {
  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        {/* Hero */}
        <div className="py-16 md:py-24 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-semibold">Our Story</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              We Built the Intelligence Layer <span className="text-[#D46780]">We Needed</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
              IntegrateWise was born from a painful truth: Your tools don't talk. Your data lies scattered. And revenue leaks through the cracks.
            </p>
          </div>
        </div>

        {/* The Problem We Lived */}
        <div className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-[#1E2A4A] mb-8 text-center">The Problem We Lived</h2>
            <div className="prose prose-lg text-slate-700 max-w-none">
              <p className="text-lg leading-relaxed mb-6">
                In 2024, we were running a B2B SaaS company with $18M ARR. We had Salesforce, HubSpot, Zendesk, Stripe, 
                Mixpanel, Slack, and 8 other tools. Each told us a different version of "truth."
              </p>
              <p className="text-lg leading-relaxed mb-6">
                Salesforce said a deal was "Closed-Won." Zendesk showed 3 unresolved P1 bugs. Stripe reported a failed payment. 
                By the time we connected the dots, the champion had left and the account churned.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                <strong className="text-[#4256AB]">We lost $420k in annual recurring revenue because our tools didn't know how to talk to each other.</strong>
              </p>
              <p className="text-lg leading-relaxed">
                We tried Zapier, we tried Segment, we even hired a data engineer to build a custom warehouse. 
                Nothing solved the core problem: <em>integration without intelligence is just data shuffling.</em>
              </p>
            </div>
          </div>
        </div>

        {/* The Solution We Built */}
        <div className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1E2A4A] mb-4">So We Built IntegrateWise</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Not another integration platform. An intelligence layer that understands context, detects mismatches, and prevents revenue leakage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  principle: "Truth Over Volume",
                  desc: "One entity = one canonical record. No duplicates. No confusion. Just truth."
                },
                {
                  icon: Users,
                  principle: "Human-in-the-Loop Always",
                  desc: "AI proposes. Humans approve. No rogue automations. No black boxes."
                },
                {
                  icon: Lightbulb,
                  principle: "Context is King",
                  desc: "Dual-context fusion: Vendor truth + Client reality. Both matter."
                }
              ].map((item, i) => (
                <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-center hover:shadow-xl hover:border-[#4256AB]/30 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-[#4256AB] flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1E2A4A] mb-2">{item.principle}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Our Mission */}
        <div className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-[#4256AB] to-[#3F5185] rounded-3xl p-8 md:p-12 text-white text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Mission</h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                To make every B2B company's revenue stack intelligent, unified, and transparent—so no team ever loses revenue 
                to disconnected tools again.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1E2A4A] mb-4">Our Values</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  value: "Transparency Over Magic",
                  desc: "Every data point shows its source. Every AI decision is explainable. No hidden algorithms."
                },
                {
                  value: "Revenue Outcomes, Not Feature Lists",
                  desc: "We measure success in churn prevented, deals accelerated, and hours saved—not connectors shipped."
                },
                {
                  value: "Built With Revenue Teams, Not For Them",
                  desc: "Our roadmap comes from CS leaders, RevOps pros, and sales VPs who live this pain daily."
                },
                {
                  value: "Security & Compliance as Default",
                  desc: "Not a checkbox. Not an add-on. Baked into every line of code from day one."
                }
              ].map((item, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-[#1E2A4A] mb-2">{item.value}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Join Us CTA */}
        <div className="py-16 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Award className="w-16 h-16 mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-4">Join Us on This Mission</h3>
            <p className="text-xl text-white/80 mb-8">
              Whether you're a revenue team tired of scattered data, or an engineer who believes intelligence should be accessible—we'd love to work with you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/demo" className="bg-white text-[#4256AB] hover:bg-slate-100 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-xl">
                Book a Demo
              </a>
              <a href="/contact" className="bg-[#D46780] hover:bg-[#C5536C] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all">
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
