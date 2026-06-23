"use client";

import {
  DashboardLayout,
  Section,
  StandardEmptyState,
} from "@/components/common/layouts/page-layouts";
import { FileText, HardDrive, Mail, Search, Filter } from "lucide-react";
import { useState } from "react";

export function ContextDashboard({ artifacts }: { artifacts: any[] }) {
  const [search, setSearch] = useState("");

  const filtered = artifacts.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Context"
      description="Unified library of documents, files, and communications."
      stageId="CONTEXT-033"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search across all context..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20 focus:border-[#2d5a3d]"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <Section title="Recent Artifacts">
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.length > 0 ? (
            filtered.map((item: any, i: number) => {
              const Icon =
                item.type === "email" ? Mail : item.type === "file" ? HardDrive : FileText;
              return (
                <div
                  key={i}
                  className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        item.type === "email"
                          ? "bg-blue-50 text-blue-600"
                          : item.type === "file"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="capitalize">{item.type}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <StandardEmptyState
              icon={<FileText className="w-12 h-12 text-gray-300" />}
              title="No Artifacts Found"
              description="Try adjusting your search or connect more data sources."
            />
          )}
        </div>
      </Section>
    </DashboardLayout>
  );
}
