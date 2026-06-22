import React from "react";
import { Layout } from "./Layout";
import { Shield, FileText } from "lucide-react";

export function PrivacyPage() {
  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        {/* Hero */}
        <div className="py-16 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-black mb-4">Privacy Policy</h1>
            <p className="text-lg text-white/80">Last updated: March 24, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">1. Introduction</h2>
                <p className="text-slate-700 leading-relaxed">
                  IntegrateWise AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you use our integration intelligence platform.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Account Information</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  When you create an IntegrateWise account, we collect your name, email address, company name, and billing information.
                </p>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Integration Data</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  We collect data from your connected third-party tools (Salesforce, HubSpot, Zendesk, etc.) solely to provide our services. 
                  This includes CRM records, support tickets, billing data, and activity logs as authorized by you.
                </p>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Usage Data</h3>
                <p className="text-slate-700 leading-relaxed">
                  We automatically collect information about how you interact with IntegrateWise, including login times, features used, 
                  and technical data (IP address, browser type, device information).
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">3. How We Use Your Information</h2>
                <ul className="space-y-2 text-slate-700">
                  <li>• <strong>Provide Services:</strong> Process, normalize, and unify data across your connected tools</li>
                  <li>• <strong>AI Intelligence:</strong> Train and improve our AI models to detect mismatches and surface insights</li>
                  <li>• <strong>Communication:</strong> Send service updates, security alerts, and billing notifications</li>
                  <li>• <strong>Support:</strong> Respond to your requests and troubleshoot issues</li>
                  <li>• <strong>Compliance:</strong> Meet legal obligations and protect against fraud</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">4. Data Sharing and Disclosure</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  <strong>We do not sell your data.</strong> We only share your information in these limited circumstances:
                </p>
                <ul className="space-y-2 text-slate-700">
                  <li>• <strong>Service Providers:</strong> AWS (hosting), Stripe (payments), SendGrid (emails) under strict data processing agreements</li>
                  <li>• <strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
                  <li>• <strong>Business Transfers:</strong> In the event of a merger or acquisition (with your notification)</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">5. Data Security</h2>
                <p className="text-slate-700 leading-relaxed">
                  We implement industry-standard security measures including AES-256 encryption at rest, TLS 1.3 in transit, SOC 2 Type II certification, 
                  regular security audits, and multi-factor authentication.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">6. Your Rights</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Depending on your location, you may have the right to:
                </p>
                <ul className="space-y-2 text-slate-700">
                  <li>• Access your personal data</li>
                  <li>• Correct inaccurate data</li>
                  <li>• Request deletion of your data</li>
                  <li>• Export your data in a portable format</li>
                  <li>• Opt-out of marketing communications</li>
                  <li>• Withdraw consent at any time</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-4">
                  To exercise these rights, contact us at <a href="mailto:privacy@integratewise.ai" className="text-[#4256AB] hover:underline">privacy@integratewise.ai</a>.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">7. Data Retention</h2>
                <p className="text-slate-700 leading-relaxed">
                  We retain your data for as long as your account is active or as needed to provide services. Upon account deletion, 
                  we delete your data within 30 days, except where retention is required by law.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">8. International Data Transfers</h2>
                <p className="text-slate-700 leading-relaxed">
                  Your data is primarily stored in AWS us-east-1 (or your chosen region). If you're outside the United States, 
                  your data may be transferred to and processed in the U.S. under appropriate safeguards.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">9. Children's Privacy</h2>
                <p className="text-slate-700 leading-relaxed">
                  IntegrateWise is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">10. Changes to This Policy</h2>
                <p className="text-slate-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the platform. 
                  Your continued use after changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">11. Contact Us</h2>
                <p className="text-slate-700 leading-relaxed">
                  For privacy questions or concerns, contact us at:
                </p>
                <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-slate-700"><strong>Email:</strong> privacy@integratewise.ai</p>
                  <p className="text-slate-700 mt-2"><strong>Address:</strong> IntegrateWise AI, San Francisco, CA / Bangalore, India</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
