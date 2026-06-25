import { Button } from "@/components/ui/button"
import { Shield, Lock, Eye } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-balance mb-6">
            Secure, seamless, and always in your control
          </h1>
          <p className="text-xl text-gray-600 text-balance mb-8">
            IntegrateWise is designed to act as a secure router and normaliser—not a permanent data owner unless you
            choose. Modern authentication, strict boundaries, and a platform built for safe automation and safe
            analytics.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              View Security Details
            </Button>
            <Button size="lg" variant="outline">
              Book Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Control</h3>
              <p className="text-gray-600">You decide what connects, what syncs, and what stays read-only.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Boundaries</h3>
              <p className="text-gray-600">Strict permissions and routing ensure automation stays safe and scoped.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Transparency</h3>
              <p className="text-gray-600">Audit trails, event logs, and policy enforcement designed for real ops.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Handling */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Your data stays yours</h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="mb-4">IntegrateWise connects to your tools using secure auth and scoped permissions.</p>
            <p className="mb-4">Depending on your configuration:</p>
            <ul className="space-y-2 mb-6">
              <li>IntegrateWise can act as a secure router (moving signals + metadata)</li>
              <li>or as a normaliser (building structured views)</li>
              <li>or as a read-only analyzer (Render Only mode)</li>
            </ul>
            <p>You control the boundaries between "stored", "synced", and "read-only".</p>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="px-6 pb-20 bg-gray-50">
        <div className="max-w-4xl mx-auto py-16">
          <h2 className="text-3xl font-bold mb-6">Modern authentication and access controls</h2>
          <ul className="space-y-3">
            {[
              "OAuth / API keys (per tool)",
              "Optional SSO (Business/Enterprise)",
              "Role-based permissions",
              "Workspace-level separation",
              "Principle of least privilege",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Webhooks */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Secure webhooks with verification and replay protection</h2>
          <ul className="space-y-3">
            {[
              "Signed requests (HMAC)",
              "Timestamp validation (anti-replay)",
              "Idempotency keys",
              "Retry policies + Dead Letter Queues",
              "Monitoring & alerting",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* DataSentinel */}
      <section className="px-6 pb-20 bg-indigo-50">
        <div className="max-w-4xl mx-auto py-16">
          <h2 className="text-3xl font-bold mb-6">DataSentinel: policy, privacy, and lineage</h2>
          <p className="text-lg text-gray-600 mb-6">DataSentinel helps you:</p>
          <ul className="space-y-3 mb-8">
            {[
              "Detect and redact PII",
              "Enforce policy rules",
              "Track lineage across workflows",
              "Keep audit trails for outputs and decisions",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-600">
            This is especially powerful when using Render outputs (docs/emails/decks), agent automation, and cross-tool
            data unification.
          </p>
        </div>
      </section>

      {/* BYOM */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Bring your own AI model</h2>
          <p className="text-lg text-gray-600">
            Start with built-in models for a smooth experience. When you're ready, connect your own model using your API
            key. You keep the benefit of shared context and structured workflows—while choosing the model you trust.
          </p>
        </div>
      </section>

      {/* Modes */}
      <section className="px-6 pb-20 bg-gray-50">
        <div className="max-w-5xl mx-auto py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Full Integration or Render Only</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 border-2 border-indigo-600">
              <h3 className="text-2xl font-bold mb-4">Full Integration</h3>
              <ul className="space-y-3">
                {["Two-way sync", "Automation", "Approvals & guardrails"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold mb-4">Render Only</h3>
              <ul className="space-y-3">
                {[
                  "Read-only dashboards + analytics",
                  "Zero write access",
                  "Safest default for compliance-first workflows",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-teal-600 rounded-full" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center bg-indigo-600 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Want to see IntegrateWise in a regulated setup?</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Book Demo
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              Talk to Security
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
