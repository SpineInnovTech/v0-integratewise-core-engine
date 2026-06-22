import React from "react";
import { Layout } from "./Layout";
import { Shield, Lock, CheckCircle2, FileCheck, Database, Eye, Globe, Award } from "lucide-react";

export function SecurityPage() {
  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        {/* Hero */}
        <div className="py-16 md:py-24 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-semibold">Enterprise-Grade Security</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              Your Data. <span className="text-[#D46780]">Your Control.</span> Always.
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
              IntegrateWise is built with security, compliance, and transparency at the core.
            </p>
          </div>
        </div>

        {/* Certifications */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1E2A4A] mb-4">Compliance & Certifications</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "SOC 2 Type II", desc: "Certified", icon: Award },
                { name: "GDPR", desc: "Compliant", icon: Shield },
                { name: "ISO 27001", desc: "In Progress", icon: FileCheck },
                { name: "HIPAA", desc: "Ready", icon: Lock }
              ].map((cert, i) => (
                <div key={i} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 text-center hover:shadow-xl hover:border-[#4256AB]/30 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-[#4256AB]/10 flex items-center justify-center mx-auto mb-4">
                    <cert.icon className="w-8 h-8 text-[#4256AB]" />
                  </div>
                  <div className="font-bold text-slate-900 mb-1">{cert.name}</div>
                  <div className="text-sm text-slate-500">{cert.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1E2A4A] mb-4">How We Protect Your Data</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: Lock,
                  title: "Encryption Everywhere",
                  desc: "AES-256 encryption at rest. TLS 1.3 in transit. Your data is encrypted from the moment it enters our system until it's displayed in your browser."
                },
                {
                  icon: Database,
                  title: "Data Isolation",
                  desc: "Every customer gets their own isolated Spine instance. No shared databases. Your data never mingles with other tenants."
                },
                {
                  icon: Eye,
                  title: "Audit Logs",
                  desc: "Full activity logs for every data access, change, and export. Know exactly who touched what, when, and why."
                },
                {
                  icon: Shield,
                  title: "RBAC & Permissions",
                  desc: "Role-based access control with granular permissions. Control who can view, edit, approve, or export data."
                },
                {
                  icon: Globe,
                  title: "Data Residency",
                  desc: "Enterprise customers can choose where their data lives: US, EU, or APAC regions."
                },
                {
                  icon: FileCheck,
                  title: "Right to Delete",
                  desc: "Full data export and deletion within 48 hours of request. No questions asked."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#4256AB]/30 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-[#4256AB]/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-[#4256AB]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Infrastructure */}
        <div className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1E2A4A] mb-4">Infrastructure & Operations</h2>
            </div>
            <div className="space-y-6">
              {[
                {
                  title: "Hosted on AWS with Multi-AZ Redundancy",
                  desc: "Your data lives in AWS us-east-1 (or region of choice) with automatic failover across availability zones."
                },
                {
                  title: "99.9% Uptime SLA (Enterprise)",
                  desc: "Monitored 24/7. Automatic scaling. Sub-30-minute incident response."
                },
                {
                  title: "Automated Backups Every 6 Hours",
                  desc: "Point-in-time recovery up to 30 days. Enterprise customers get 90-day retention."
                },
                {
                  title: "Penetration Testing Quarterly",
                  desc: "Third-party security audits every quarter. Vulnerability scans weekly."
                }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 bg-slate-50 rounded-2xl p-6">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust CTA */}
        <div className="py-16 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">Questions About Security?</h3>
            <p className="text-xl text-white/80 mb-8">
              Our security team is happy to walk through our architecture, compliance posture, and data handling practices.
            </p>
            <a href="/contact" className="inline-block bg-white text-[#4256AB] hover:bg-slate-100 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-xl">
              Contact Security Team
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
