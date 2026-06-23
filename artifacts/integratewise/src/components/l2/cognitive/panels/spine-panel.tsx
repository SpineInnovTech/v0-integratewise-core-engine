"use client";

/**
 * L2 Spine Panel (v0 style)
 * Shows entity completeness, discovered schema, missing fields
 * Connects L3 (Adaptive Spine) → L2 (Cognitive Analysis)
 */

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  spineClient,
  type SpineEntity,
  type CompletenessScore,
  type SchemaField,
} from "@/lib/spine-client";

interface SpinePanelProps {
  entityId?: string;
  entityType?: string;
  tenantId?: string;
}

export function SpinePanel({ entityId, entityType = "account", tenantId }: SpinePanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [entity, setEntity] = useState<SpineEntity | null>(null);
  const [completeness, setCompleteness] = useState<CompletenessScore | null>(null);
  const [schema, setSchema] = useState<SchemaField[]>([]);

  useEffect(() => {
    if (entityId) {
      loadEntityData();
    } else if (entityType && tenantId) {
      loadSchemaData();
    }
  }, [entityId, entityType, tenantId]);

  const loadEntityData = async () => {
    if (!entityId) return;
    setIsLoading(true);
    try {
      const [entityData, completenessData] = await Promise.all([
        spineClient.getEntity(entityType || "account", entityId),
        spineClient.getCompleteness(entityType || "account", entityId),
      ]);
      setEntity(entityData);
      setCompleteness(completenessData);
    } catch (error) {
      console.error("Failed to load entity data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchemaData = async () => {
    if (!entityType) return;
    setIsLoading(true);
    try {
      const schemaData = await spineClient.getSchema(entityType);
      setSchema(schemaData);
    } catch (error) {
      console.error("Failed to load schema:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const completenessScore = completeness?.completeness_score || entity?.completeness_score || 0;
  const fieldsPresent = completeness?.fields_present || entity?.fields_present || 0;
  const fieldsExpected = completeness?.fields_expected || entity?.fields_expected || 1;

  return (
    <div className="p-6 space-y-6 bg-[#E9E5DD] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3d7a50] to-[#1a3a2a] flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a3a2a]">Adaptive Spine</h2>
            <p className="text-sm text-gray-600">Entity completeness & schema analysis</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (entityId ? loadEntityData() : loadSchemaData())}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Completeness Score Card */}
      <Card className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1a3a2a]">Completeness Score</h3>
          <Badge
            className={
              completenessScore >= 80
                ? "bg-iw-forest/10 text-iw-forest border-0"
                : completenessScore >= 50
                  ? "bg-yellow-100 text-yellow-700 border-0"
                  : "bg-red-100 text-red-700 border-0"
            }
          >
            {completenessScore}% Complete
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <Progress value={completenessScore} className="h-3" />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{fieldsPresent} fields present</span>
            <span>{fieldsExpected} expected</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-iw-forest/5 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">{fieldsPresent}</div>
            <div className="text-xs text-gray-600">Present</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-700">
              {completeness?.missing_expected?.length || 0}
            </div>
            <div className="text-xs text-gray-600">Missing Expected</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-700">
              {completeness?.missing_required?.length || 0}
            </div>
            <div className="text-xs text-gray-600">Missing Required</div>
          </div>
        </div>
      </Card>

      {/* Missing Required Fields */}
      {completeness?.missing_required && completeness.missing_required.length > 0 && (
        <Card className="bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-[#1a3a2a]">Missing Required Fields</h3>
            <Badge className="bg-red-100 text-red-700 border-0">
              {completeness.missing_required.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {completeness.missing_required.map((field) => (
              <div
                key={field}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <span className="font-mono text-sm text-red-700">{field}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  Suggest Value
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Missing Expected Fields */}
      {completeness?.missing_expected && completeness.missing_expected.length > 0 && (
        <Card className="bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-[#1a3a2a]">Enrichment Opportunities</h3>
            <Badge className="bg-yellow-100 text-yellow-700 border-0">
              {completeness.missing_expected.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {completeness.missing_expected.slice(0, 5).map((field) => (
              <div
                key={field}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
              >
                <span className="font-mono text-sm text-gray-700">{field}</span>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Find Data
                </Button>
              </div>
            ))}
            {completeness.missing_expected.length > 5 && (
              <Button variant="outline" className="w-full mt-2" size="sm">
                Show {completeness.missing_expected.length - 5} More
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Discovered Schema */}
      {schema.length > 0 && (
        <Card className="bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1a3a2a]">Discovered Schema</h3>
            <Badge className="bg-[#3d7a50] text-white border-0">{schema.length} fields</Badge>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {schema.map((field) => (
              <div
                key={field.field_key}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-[#1a3a2a]">
                      {field.field_key}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {field.data_type}
                    </Badge>
                    <Badge
                      className={
                        field.status === "required"
                          ? "bg-red-100 text-red-700 border-0"
                          : field.status === "observed"
                            ? "bg-iw-forest/10 text-iw-forest border-0"
                            : "bg-gray-100 text-gray-700 border-0"
                      }
                    >
                      {field.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Seen {field.occurrence_count}x • Last:{" "}
                    {field.last_seen_at
                      ? new Date(field.last_seen_at).toLocaleDateString()
                      : "Never"}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Entity Data Preview */}
      {entity?.data && (
        <Card className="bg-white p-6">
          <h3 className="font-semibold text-[#1a3a2a] mb-4">Entity Data</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(entity.data).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                <span className="font-mono text-xs text-gray-600 min-w-[120px]">{key}:</span>
                <span className="text-xs text-[#1a3a2a] flex-1 break-words">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-[#3d7a50] to-[#1a3a2a] p-6 text-white">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            className="w-full bg-white/10 hover:bg-white/20 text-white border-0"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Enrich
          </Button>
          <Button
            variant="secondary"
            className="w-full bg-white/10 hover:bg-white/20 text-white border-0"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View in Spine
          </Button>
        </div>
      </Card>
    </div>
  );
}
