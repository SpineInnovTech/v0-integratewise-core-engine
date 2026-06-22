import React from "react";
import { Layout } from "./Layout";
import { FileText, Scale } from "lucide-react";

export function TermsPage() {
  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        {/* Hero */}
        <div className="py-16 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Scale className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-black mb-4">Terms of Service</h1>
            <p className="text-lg text-white/80">Last updated: March 24, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">1. Acceptance of Terms</h2>
                <p className="text-slate-700 leading-relaxed">
                  By accessing or using IntegrateWise ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                  If you do not agree, do not use the Service.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">2. Description of Service</h2>
                <p className="text-slate-700 leading-relaxed">
                  IntegrateWise provides an AI-native integration intelligence platform that unifies data across your business tools, 
                  surfaces insights, and enables intelligent workflows. The Service includes data normalization, entity resolution, 
                  AI intelligence, and human-in-the-loop approval gates.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">3. Account Registration and Use</h2>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Eligibility</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  You must be at least 18 years old and have the authority to bind your organization to these Terms.
                </p>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Account Security</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                </p>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Acceptable Use</h3>
                <p className="text-slate-700 leading-relaxed">
                  You agree not to: (a) violate any laws, (b) infringe intellectual property rights, (c) transmit malware, 
                  (d) attempt unauthorized access, or (e) use the Service to harm others.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">4. Data and Privacy</h2>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Your Data</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  You retain all rights to your data. By using the Service, you grant us a limited license to process your data 
                  solely to provide the Service as described in our Privacy Policy.
                </p>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Data Security</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  We implement commercially reasonable security measures. However, no method is 100% secure, and we cannot guarantee absolute security.
                </p>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Third-Party Integrations</h3>
                <p className="text-slate-700 leading-relaxed">
                  You are responsible for authorizing IntegrateWise to access your third-party tools (Salesforce, HubSpot, etc.). 
                  We are not responsible for data loss or issues arising from third-party services.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">5. Fees and Payment</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  <strong>Subscription Plans:</strong> Fees are based on your selected plan (Starter, Growth, Enterprise) as listed on our Pricing page.
                </p>
                <p className="text-slate-700 leading-relaxed mb-4">
                  <strong>Billing:</strong> You will be billed monthly or annually (as selected) in advance. All fees are non-refundable except as required by law.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Late Payments:</strong> Late payments may result in service suspension. We reserve the right to charge interest on overdue amounts.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">6. Service Level and Availability</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  <strong>Uptime:</strong> We strive for 99.9% uptime (Enterprise SLA). We are not liable for downtime caused by factors beyond our reasonable control.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Maintenance:</strong> We may perform scheduled maintenance with advance notice. Emergency maintenance may occur with minimal notice.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">7. Intellectual Property</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  <strong>Our IP:</strong> IntegrateWise retains all rights to the Service, including software, algorithms, trademarks, and documentation.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Feedback:</strong> If you provide feedback or suggestions, we may use them without obligation to you.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">8. Termination</h2>
                <h3 className="text-xl font-bold text-slate-800 mb-2">By You</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  You may cancel your account at any time. Monthly plans require 30 days notice. Annual plans require 90 days notice or prorated refund.
                </p>
                <h3 className="text-xl font-bold text-slate-800 mb-2">By Us</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  We may suspend or terminate your account if you violate these Terms or fail to pay fees.
                </p>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Effect of Termination</h3>
                <p className="text-slate-700 leading-relaxed">
                  Upon termination, your access ends immediately. We will provide data export within 48 hours and delete your data within 30 days.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">9. Warranties and Disclaimers</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  <strong>AS IS:</strong> The Service is provided "AS IS" without warranties of any kind, express or implied.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>No Guarantee:</strong> We do not guarantee that the Service will be error-free, secure, or meet your specific requirements.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">10. Limitation of Liability</h2>
                <p className="text-slate-700 leading-relaxed">
                  To the maximum extent permitted by law, IntegrateWise shall not be liable for indirect, incidental, special, or consequential damages 
                  (including lost profits, data loss, or business interruption). Our total liability shall not exceed the fees paid by you in the 12 months 
                  preceding the claim.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">11. Indemnification</h2>
                <p className="text-slate-700 leading-relaxed">
                  You agree to indemnify and hold IntegrateWise harmless from any claims arising from your use of the Service, 
                  your violation of these Terms, or your infringement of any third-party rights.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">12. Governing Law and Disputes</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  These Terms are governed by the laws of California, USA, without regard to conflict of law principles.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Any disputes shall be resolved through binding arbitration in San Francisco, CA, except you may bring claims in small claims court.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">13. Changes to Terms</h2>
                <p className="text-slate-700 leading-relaxed">
                  We may modify these Terms at any time. Material changes will be notified via email or in-app notification. 
                  Continued use after changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#1E2A4A] mb-4">14. Contact Information</h2>
                <p className="text-slate-700 leading-relaxed">
                  For questions about these Terms, contact us at:
                </p>
                <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-slate-700"><strong>Email:</strong> legal@integratewise.ai</p>
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
