'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Zap, AlertCircle, Check, Clock, Activity, Server } from 'lucide-react';

export default function FounderDashboard() {
  const [metrics, setMetrics] = useState({
    tenants: 24,
    activeConnectors: 156,
    pendingApprovals: 8,
    mrr: 45600,
    connectorSyncHealth: 98,
    workerUptime: 99.97,
    d1Queries24h: 2450000,
    avgLatency: 147,
    activityCount24h: 12847,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In production, this would fetch real metrics from /admin/metrics
    setLoading(false);
  }, []);

  const MetricCard = ({ icon: Icon, label, value, unit = '', trend = null as { up: boolean; value: number } | null, color = 'forest' }) => (
    <div className={`p-6 bg-[var(--iw-paper)] rounded-lg border-2 border-[var(--iw-${color})]/20 hover:border-[var(--iw-gold)]/50 transition`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-[var(--iw-${color})]/10 rounded-lg flex items-center justify-center`}>
          <Icon className={`text-[var(--iw-${color})]`} size={24} />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${trend.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend.up ? '+' : '-'}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--iw-forest)]/70 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-[var(--iw-forest)]">{value.toLocaleString()}</span>
        {unit && <span className="text-sm text-[var(--iw-forest)]/60">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--iw-paper)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--iw-forest)]/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--iw-forest)]">Founder Dashboard</h1>
            <p className="text-sm text-[var(--iw-forest)]/60 mt-1">Real-time platform metrics & system health</p>
          </div>
          <button className="px-4 py-2 bg-[var(--iw-forest)] text-white rounded-lg text-sm font-medium hover:bg-[var(--iw-forest)]/90">
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Business Metrics */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-[var(--iw-forest)] mb-6">Business Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={Users}
              label="Active Tenants"
              value={metrics.tenants}
              trend={{ up: true, value: 12 }}
              color="forest"
            />
            <MetricCard
              icon={Zap}
              label="Active Connectors"
              value={metrics.activeConnectors}
              trend={{ up: true, value: 23 }}
              color="forest"
            />
            <MetricCard
              icon={Clock}
              label="Pending Approvals"
              value={metrics.pendingApprovals}
              trend={{ up: false, value: 8 }}
              color="gold"
            />
            <MetricCard
              icon={TrendingUp}
              label="Monthly Recurring Revenue"
              value={metrics.mrr}
              unit="$"
              trend={{ up: true, value: 18 }}
              color="forest"
            />
          </div>
        </section>

        {/* System Health */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-[var(--iw-forest)] mb-6">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-[var(--iw-paper)] rounded-lg border-2 border-green-500/20 hover:border-green-500/50 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="text-green-600" size={24} />
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">Good</span>
              </div>
              <p className="text-sm text-[var(--iw-forest)]/70 mb-2">Connector Sync Health</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">{metrics.connectorSyncHealth}%</span>
              </div>
              <p className="text-xs text-[var(--iw-forest)]/60 mt-3">All 50+ connectors operational</p>
            </div>

            <div className="p-6 bg-[var(--iw-paper)] rounded-lg border-2 border-green-500/20 hover:border-green-500/50 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Server className="text-green-600" size={24} />
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">Excellent</span>
              </div>
              <p className="text-sm text-[var(--iw-forest)]/70 mb-2">Worker Uptime (30d)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">{metrics.workerUptime}%</span>
              </div>
              <p className="text-xs text-[var(--iw-forest)]/60 mt-3">All Cloudflare Workers stable</p>
            </div>

            <div className="p-6 bg-[var(--iw-paper)] rounded-lg border-2 border-[var(--iw-forest)]/20 hover:border-[var(--iw-gold)]/50 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[var(--iw-forest)]/10 rounded-lg flex items-center justify-center">
                  <Activity className="text-[var(--iw-forest)]" size={24} />
                </div>
              </div>
              <p className="text-sm text-[var(--iw-forest)]/70 mb-2">D1 Queries (24h)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--iw-forest)]">{(metrics.d1Queries24h / 1000000).toFixed(1)}M</span>
              </div>
              <p className="text-xs text-[var(--iw-forest)]/60 mt-3">Spine in excellent performance</p>
            </div>

            <div className="p-6 bg-[var(--iw-paper)] rounded-lg border-2 border-[var(--iw-forest)]/20 hover:border-[var(--iw-gold)]/50 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[var(--iw-forest)]/10 rounded-lg flex items-center justify-center">
                  <Zap className="text-[var(--iw-forest)]" size={24} />
                </div>
              </div>
              <p className="text-sm text-[var(--iw-forest)]/70 mb-2">Avg API Latency</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--iw-forest)]">{metrics.avgLatency}</span>
                <span className="text-sm text-[var(--iw-forest)]/60">ms</span>
              </div>
              <p className="text-xs text-[var(--iw-forest)]/60 mt-3">CF edge network optimal</p>
            </div>
          </div>
        </section>

        {/* Platform Status */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-[var(--iw-forest)] mb-6">Platform Status</h2>
          <div className="bg-white rounded-lg border-2 border-[var(--iw-forest)]/20 overflow-hidden">
            <div className="px-6 py-4 bg-[var(--iw-paper)] border-b border-[var(--iw-forest)]/10">
              <h3 className="font-serif font-bold text-[var(--iw-forest)]">All Systems Operational</h3>
            </div>
            <div className="divide-y divide-[var(--iw-forest)]/10">
              {[
                { name: 'Spine (Entity Store)', status: 'operational', uptime: '99.99%' },
                { name: 'Twin (Reasoning Engine)', status: 'operational', uptime: '99.97%' },
                { name: 'Connector (Integrations)', status: 'operational', uptime: '98.4%' },
                { name: 'Knowledge (Memory + TriageBot)', status: 'operational', uptime: '99.92%' },
                { name: 'Gateway (API Router)', status: 'operational', uptime: '99.98%' },
                { name: 'Pipeline (Normalizer + Consolidation)', status: 'operational', uptime: '99.95%' },
              ].map((service, idx) => (
                <div key={idx} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Check className="text-green-600" size={20} />
                    <div>
                      <p className="font-medium text-[var(--iw-forest)]">{service.name}</p>
                      <p className="text-xs text-[var(--iw-forest)]/60">Uptime: {service.uptime}</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                    {service.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Activity Log */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-[var(--iw-forest)] mb-6">Activity (24h)</h2>
          <div className="bg-white rounded-lg border-2 border-[var(--iw-forest)]/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-[var(--iw-forest)]/70">Total Activities Logged</p>
                <p className="text-3xl font-bold text-[var(--iw-forest)]">{metrics.activityCount24h.toLocaleString()}</p>
              </div>
              <Activity className="text-[var(--iw-gold)]" size={40} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-4 bg-[var(--iw-paper)] rounded-lg">
                <p className="text-[var(--iw-forest)]/60 mb-2">API Calls</p>
                <p className="text-2xl font-bold text-[var(--iw-forest)]">4,203</p>
              </div>
              <div className="p-4 bg-[var(--iw-paper)] rounded-lg">
                <p className="text-[var(--iw-forest)]/60 mb-2">Connector Syncs</p>
                <p className="text-2xl font-bold text-[var(--iw-forest)]">847</p>
              </div>
              <div className="p-4 bg-[var(--iw-paper)] rounded-lg">
                <p className="text-[var(--iw-forest)]/60 mb-2">Approvals Granted</p>
                <p className="text-2xl font-bold text-[var(--iw-forest)]">1,204</p>
              </div>
              <div className="p-4 bg-[var(--iw-paper)] rounded-lg">
                <p className="text-[var(--iw-forest)]/60 mb-2">Entities Updated</p>
                <p className="text-2xl font-bold text-[var(--iw-forest)]">6,593</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
