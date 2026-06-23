"use client";

import { X, FileText, Activity, Brain, ExternalLink, Link2, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router";

interface EvidenceRef {
  type: "truth" | "context" | "ai-chat";
  title: string;
  source: string;
  date: string;
  link?: string;
  preview?: string;
  confidence?: number;
}

interface EnhancedEvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  evidence: EvidenceRef[];
}

export function EnhancedEvidenceDrawer({
  isOpen,
  onClose,
  title,
  description,
  evidence,
}: EnhancedEvidenceDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  // Count evidence by type
  const truthCount = evidence.filter((e) => e.type === "truth").length;
  const contextCount = evidence.filter((e) => e.type === "context").length;
  const aiChatCount = evidence.filter((e) => e.type === "ai-chat").length;

  const evidenceTypeConfig = {
    truth: {
      icon: Activity,
      bg: "bg-purple-100",
      text: "text-purple-600",
      border: "border-purple-200",
      label: "Truth Evidence (Spine)",
    },
    context: {
      icon: FileText,
      bg: "bg-orange-100",
      text: "text-orange-600",
      border: "border-orange-200",
      label: "Context Evidence (Docs, Files)",
    },
    "ai-chat": {
      icon: Brain,
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      border: "border-yellow-200",
      label: "AI Chats Evidence (Session Memory)",
    },
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div
        className={`relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h3 className="font-semibold text-gray-900">Evidence & Grounding</h3>
            <p className="text-xs text-gray-500 mt-0.5">Provable traceability for AI decisions</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* A/B/C Evidence Counter */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-600 uppercase">Evidence Sources:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">{truthCount}</span>
                <span className="text-xs text-purple-600">Truth</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700">{contextCount}</span>
                <span className="text-xs text-orange-600">Context</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Brain className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-700">{aiChatCount}</span>
                <span className="text-xs text-yellow-600">AI Chats</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Decision Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">{title}</h4>
            {description && <p className="text-sm text-blue-700 leading-relaxed">{description}</p>}
          </div>

          {/* Evidence by Type */}
          {(["truth", "context", "ai-chat"] as const).map((type) => {
            const items = evidence.filter((e) => e.type === type);
            if (items.length === 0) return null;

            const config = evidenceTypeConfig[type];
            const Icon = config.icon;

            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-md ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.text}`} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-700">{config.label}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className={`p-3 bg-white border rounded-lg hover:shadow-sm transition-all group ${config.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className="font-medium">{item.source}</span>
                            <span>•</span>
                            <span>{item.date}</span>
                            {item.confidence && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-gray-700">
                                  {item.confidence}% match
                                </span>
                              </>
                            )}
                          </div>
                          {item.preview && (
                            <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded border border-gray-200 line-clamp-2">
                              {item.preview}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.preview && (
                            <button
                              onClick={() => setSelectedPreview(item.preview || null)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                          {item.link && (
                            <Link
                              to={item.link}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="Open in source system"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-500" />
                            </Link>
                          )}
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Link to entity"
                          >
                            <Link2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2d5a3d] text-white rounded-lg text-sm font-medium hover:bg-[#1a3a2a] transition-colors"
          >
            Close Evidence Panel
          </button>
        </div>
      </div>
    </div>
  );
}
