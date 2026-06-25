'use client';

import React, { useState } from 'react';
import { ArrowRight, Check, Zap, Brain, Link2, Shield } from 'lucide-react';

export default function Landing() {
  const [activeTab, setActiveTab] = useState('features');

  return (
    <div className="min-h-screen bg-[var(--iw-paper)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[var(--iw-paper)] border-b border-[var(--iw-forest)]/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-serif font-bold text-[var(--iw-forest)]">
            Continuity Bridge
          </div>
          <div className="flex gap-8 items-center">
            <a href="#features" className="text-sm text-[var(--iw-forest)]/70 hover:text-[var(--iw-forest)]">Features</a>
            <a href="#pillars" className="text-sm text-[var(--iw-forest)]/70 hover:text-[var(--iw-forest)]">Platform</a>
            <a href="#technical" className="text-sm text-[var(--iw-forest)]/70 hover:text-[var(--iw-forest)]">Docs</a>
            <button className="px-6 py-2 bg-[var(--iw-forest)] text-white rounded-lg text-sm font-medium hover:bg-[var(--iw-forest)]/90">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-[var(--iw-gold)]/10 rounded-full mb-8">
            <span className="text-sm text-[var(--iw-forest)] font-medium">Enterprise Integration Platform</span>
          </div>
          <h1 className="text-6xl font-serif font-bold text-[var(--iw-forest)] mb-6 leading-tight">
            Continuity from Chaos
          </h1>
          <p className="text-xl text-[var(--iw-forest)]/70 mb-8 max-w-2xl mx-auto">
            Unify your SaaS stack with intelligent entity mapping, AI-powered reasoning, governed actions, and complete audit trails. Stop managing tools. Start orchestrating.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-3 bg-[var(--iw-forest)] text-white rounded-lg font-medium hover:bg-[var(--iw-forest)]/90 flex items-center gap-2">
              Start Free <ArrowRight size={20} />
            </button>
            <button className="px-8 py-3 border-2 border-[var(--iw-forest)] text-[var(--iw-forest)] rounded-lg font-medium hover:bg-[var(--iw-forest)]/5">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Four Pillars */}
      <section id="pillars" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-center text-[var(--iw-forest)] mb-20">
            Four Pillars of Integration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Spine */}
            <div className="p-8 bg-[var(--iw-paper)] rounded-lg border-2 border-[var(--iw-forest)]/20 hover:border-[var(--iw-gold)]/50 transition">
              <div className="w-14 h-14 bg-[var(--iw-forest)]/10 rounded-lg flex items-center justify-center mb-6">
                <Link2 className="text-[var(--iw-forest)]" size={28} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[var(--iw-forest)] mb-4">Spine</h3>
              <p className="text-[var(--iw-forest)]/70 mb-4">
                Canonical entity store. Relationships, signals, and memory persist across all integrations. Encrypted vault for sensitive data.
              </p>
              <ul className="space-y-2 text-sm text-[var(--iw-forest)]/60">
                <li className="flex items-center gap-2"><Check size={16} />Deterministic partitioning</li>
                <li className="flex items-center gap-2"><Check size={16} />Autonomous lifecycle (triage/consolidate/age)</li>
                <li className="flex items-center gap-2"><Check size={16} />Complete audit trail</li>
              </ul>
            </div>

            {/* Twin */}
            <div className="p-8 bg-[var(--iw-paper)] rounded-lg border-2 border-[var(--iw-forest)]/20 hover:border-[var(--iw-gold)]/50 transition">
              <div className="w-14 h-14 bg-[var(--iw-forest)]/10 rounded-lg flex items-center justify-center mb-6">
                <Brain className="text-[var(--iw-forest)]" size={28} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[var(--iw-forest)] mb-4">Twin</h3>
              <p className="text-[var(--iw-forest)]/70 mb-4">
                AI reasoning layer. Iterative problem-solving grounded in your Spine data. Proposes actions for human approval.
              </p>
              <ul className="space-y-2 text-sm text-[var(--iw-forest)]/60">
                <li className="flex items-center gap-2"><Check size={16} />gpt-5-mini reasoning</li>
                <li className="flex items-center gap-2"><Check size={16} />Spine-grounded context</li>
                <li className="flex items-center gap-2"><Check size={16} />Proposal workflow</li>
              </ul>
            </div>

            {/* Connector */}
            <div className="p-8 bg-[var(--iw-paper)] rounded-lg border-2 border-[var(--iw-forest)]/20 hover:border-[var(--iw-gold)]/50 transition">
              <div className="w-14 h-14 bg-[var(--iw-forest)]/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="text-[var(--iw-forest)]" size={28} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[var(--iw-forest)] mb-4">Connector</h3>
              <p className="text-[var(--iw-forest)]/70 mb-4">
                50+ integrations. Real-time webhooks + polling sync. Schema-driven normalizer. Native entity mapping.
              </p>
              <ul className="space-y-2 text-sm text-[var(--iw-forest)]/60">
                <li className="flex items-center gap-2"><Check size={16} />Webhook ingress (HubSpot, Salesforce, Stripe)</li>
                <li className="flex items-center gap-2"><Check size={16} />8-stage normalizer (NA0-NA5)</li>
                <li className="flex items-center gap-2"><Check size={16} />Nango OAuth per-tenant</li>
              </ul>
            </div>

            {/* Governance */}
            <div className="p-8 bg-[var(--iw-paper)] rounded-lg border-2 border-[var(--iw-forest)]/20 hover:border-[var(--iw-gold)]/50 transition">
              <div className="w-14 h-14 bg-[var(--iw-forest)]/10 rounded-lg flex items-center justify-center mb-6">
                <Shield className="text-[var(--iw-forest)]" size={28} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[var(--iw-forest)] mb-4">Governance</h3>
              <p className="text-[var(--iw-forest)]/70 mb-4">
                Role-based access. Approval gates. Activity audit (5 tables, complete trace). Fail-safe by default.
              </p>
              <ul className="space-y-2 text-sm text-[var(--iw-forest)]/60">
                <li className="flex items-center gap-2"><Check size={16} />Auto-approve threshold: 0.85</li>
                <li className="flex items-center gap-2"><Check size={16} />Owner/assignee control</li>
                <li className="flex items-center gap-2"><Check size={16} />Compliance audit trail</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-center text-[var(--iw-forest)] mb-20">
            Built for Every Role
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                role: 'CTO',
                problem: 'Managing integrations across 20+ tools',
                solution: 'Unified connector registry, schema-driven normalization, one API contract',
              },
              {
                role: 'Integrations Lead',
                problem: 'No audit trail for integration changes',
                solution: '5-table audit log captures every read/propose/approve/execute/result',
              },
              {
                role: 'Enterprise Customer',
                problem: 'Data scattered across disconnected tools',
                solution: 'Canonical entity store with automated memory consolidation',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-8 bg-[var(--iw-paper)] rounded-lg">
                <div className="text-sm font-bold text-[var(--iw-gold)] mb-2">FOR {item.role}</div>
                <h4 className="text-lg font-serif font-bold text-[var(--iw-forest)] mb-3">
                  {item.problem}
                </h4>
                <p className="text-[var(--iw-forest)]/70">
                  <strong className="text-[var(--iw-forest)]">Our answer:</strong> {item.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical */}
      <section id="technical" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-center text-[var(--iw-forest)] mb-8">
            Built on Modern Infrastructure
          </h2>
          <p className="text-center text-[var(--iw-forest)]/70 mb-16 max-w-2xl mx-auto">
            Cloudflare Workers, D1 SQLite, Nango OAuth, OpenRouter gpt-5-mini, MCP protocol for AI access, complete audit logging
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-xl font-serif font-bold text-[var(--iw-forest)] mb-6">
                API Routes (100+)
              </h4>
              <div className="space-y-3 text-sm text-[var(--iw-forest)]/70 font-mono bg-[var(--iw-paper)] p-6 rounded-lg">
                <div>/auth/* (OAuth + CF Access)</div>
                <div>/workspace/* (tenant, users, roles)</div>
                <div>/connector/* (integrations, sync, status)</div>
                <div>/intelligence/* (Twin reasoning, proposals)</div>
                <div>/knowledge/* (memory, TriageBot, consolidation)</div>
                <div>/governance/* (approvals, audit)</div>
                <div>/admin/* (Metrics, system health)</div>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-serif font-bold text-[var(--iw-forest)] mb-6">
                50+ Connectors
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-[var(--iw-forest)]/70">
                {['Salesforce', 'HubSpot', 'Pipedrive', 'Stripe', 'Zendesk', 'Mailchimp', 'Jira', 'GitHub', 'Slack', 'Asana', 'Quickbooks', 'Netsuite'].map((tool, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check size={16} className="text-[var(--iw-gold)]" />
                    {tool}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[var(--iw-forest)] text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-serif font-bold mb-6">
            Ready to Stop Managing Tools?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Start your free trial today. No credit card required. Full platform access.
          </p>
          <button className="px-8 py-4 bg-[var(--iw-gold)] text-[var(--iw-forest)] rounded-lg font-bold text-lg hover:bg-[var(--iw-gold)]/90 inline-flex items-center gap-2">
            Get Started Free <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--iw-paper)] border-t border-[var(--iw-forest)]/10 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-[var(--iw-forest)]/70">
          <div>
            <div className="font-bold text-[var(--iw-forest)] mb-4">Continuity Bridge</div>
            <p>Enterprise integration platform built for governance.</p>
          </div>
          <div>
            <div className="font-bold text-[var(--iw-forest)] mb-4">Product</div>
            <div className="space-y-2"><a href="#" className="hover:text-[var(--iw-forest)]">Features</a><br/><a href="#" className="hover:text-[var(--iw-forest)]">Pricing</a><br/><a href="#" className="hover:text-[var(--iw-forest)]">Docs</a></div>
          </div>
          <div>
            <div className="font-bold text-[var(--iw-forest)] mb-4">Company</div>
            <div className="space-y-2"><a href="#" className="hover:text-[var(--iw-forest)]">About</a><br/><a href="#" className="hover:text-[var(--iw-forest)]">Blog</a><br/><a href="#" className="hover:text-[var(--iw-forest)]">Contact</a></div>
          </div>
          <div>
            <div className="font-bold text-[var(--iw-forest)] mb-4">Legal</div>
            <div className="space-y-2"><a href="#" className="hover:text-[var(--iw-forest)]">Privacy</a><br/><a href="#" className="hover:text-[var(--iw-forest)]">Terms</a><br/><a href="#" className="hover:text-[var(--iw-forest)]">Security</a></div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-[var(--iw-forest)]/10 text-center text-xs text-[var(--iw-forest)]/50">
          © 2026 Integrate-wise. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
