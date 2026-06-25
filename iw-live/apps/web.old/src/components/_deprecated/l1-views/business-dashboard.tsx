import React from "react";
import { PageHeader } from "@/components/l2/spine/page-header";
import { MetricCard } from "@/components/l2/spine/metric-card";
import {
  Users,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Activity,
  AlertCircle,
  Clock,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BusinessDashboardProps {
  stats: {
    totalRevenue: string;
    revenueGrowth: string;
    activeUsers: number;
    systemHealth: number;
  };
  recentReleases: Array<{
    id: string;
    service: string;
    version: string;
    status: "stable" | "deploying" | "failed";
    timestamp: string;
  }>;
  provisioningSummary: {
    totalSeats: number;
    activeSeats: number;
    pendingInvites: number;
  };
}

export function BusinessDashboard({
  stats,
  recentReleases,
  provisioningSummary,
}: BusinessDashboardProps) {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Business Control Center"
        description="Unified oversight of revenue, operations, and system governance."
        stageId="BIZ-001"
      />

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Consolidated Revenue"
          value={stats.totalRevenue}
          trend={12.5}
          icon={<TrendingUp className="w-5 h-5" />}
          primary
          lens="business"
        />
        <MetricCard
          title="Active Users"
          value={stats.activeUsers.toString()}
          icon={<Users className="w-5 h-5" />}
          lens="business"
        />
        <MetricCard
          title="System Resilience"
          value={`${stats.systemHealth}%`}
          icon={<ShieldCheck className="w-5 h-5" />}
          lens="business"
        />
        <MetricCard
          title="Engine Operations"
          value="12/12 Stable"
          icon={<Rocket className="w-5 h-5" />}
          lens="business"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Release Control Dashboard */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2d5a3d]" />
              <h3 className="font-semibold text-gray-900">Release Control</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-sm text-[#2d5a3d]">
              View All Releases <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentReleases.map((release) => (
              <div
                key={release.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      release.status === "stable"
                        ? "bg-green-500"
                        : release.status === "deploying"
                          ? "bg-blue-500 animate-pulse"
                          : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{release.service}</p>
                    <p className="text-xs text-gray-500">Version {release.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-900 capitalize font-medium">{release.status}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {release.timestamp}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Rollback
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Provisioning Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2d5a3d]" />
            <h3 className="font-semibold text-gray-900">User Provisioning</h3>
          </div>
          <div className="p-6 flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                  Active Seats
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {provisioningSummary.activeSeats}/{provisioningSummary.totalSeats}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Invites</p>
                <p className="text-2xl font-bold text-gray-900">
                  {provisioningSummary.pendingInvites}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full bg-[#2d5a3d] hover:bg-[#2D5A3D]" size="lg">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite New Member
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                Seat Management
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                System Alerts
              </h4>
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  2 users awaiting Lens assignment in Marketing workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
