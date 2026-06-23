/**
 * Schema-Driven Section Component
 *
 * Renders a UI section based on schema definition.
 * PRINCIPLE: Schema is Backend IP - Component NEVER sees entity_type or field names.
 *
 * Props received from BFF (organic only):
 * - section: { id, title, description, fields, icon }
 * - entities: [{ display_name, fields: [{ label, value, type }] }]
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as Icons from "lucide-react";

// Types matching BFF transform output
export interface UIField {
  label: string;
  value: unknown;
  type: "text" | "number" | "date" | "score" | "currency" | "status" | "badge";
  format?: {
    currency?: string;
    decimals?: number;
  };
}

export interface UITransformedEntity {
  display_name: string;
  section_id: string;
  fields: UIField[];
}

export interface UISection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  entity_count?: number;
}

export interface SchemaSectionProps {
  section: UISection;
  entities: UITransformedEntity[];
  /** Loading state */
  isLoading?: boolean;
  /** Empty state handler */
  emptyMessage?: string;
  /** Card click handler */
  onEntityClick?: (entity: UITransformedEntity) => void;
  /** Max entities to show before "View all" */
  maxEntities?: number;
}

/**
 * SchemaSection - Renders a section of entities from schema
 *
 * The BFF has already transformed technical names to organic labels.
 * This component only renders what it receives.
 */
export function SchemaSection({
  section,
  entities,
  isLoading = false,
  emptyMessage = `No ${section.title.toLowerCase()} found`,
  onEntityClick,
  maxEntities = 5,
}: SchemaSectionProps) {
  const IconComponent = getIconComponent(section.icon);
  const displayEntities = entities.slice(0, maxEntities);
  const hasMore = entities.length > maxEntities;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entities.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
            <CardTitle className="text-base font-medium">{section.title}</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">{section.description}</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
            <CardTitle className="text-base font-medium">{section.title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {entities.length}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{section.description}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayEntities.map((entity, index) => (
          <EntityCard
            key={`${entity.section_id}-${index}`}
            entity={entity}
            onClick={() => onEntityClick?.(entity)}
          />
        ))}

        {hasMore && (
          <button className="w-full py-2 text-sm text-primary hover:underline text-center">
            View all {entities.length} {section.title.toLowerCase()}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * EntityCard - Renders a single entity with its fields
 */
function EntityCard({ entity, onClick }: { entity: UITransformedEntity; onClick?: () => void }) {
  // Show first 3 fields as preview
  const previewFields = entity.fields.slice(0, 3);
  const hasMore = entity.fields.length > 3;

  return (
    <div
      onClick={onClick}
      className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
    >
      <h4 className="font-medium text-sm mb-2">{entity.display_name}</h4>

      <div className="flex flex-wrap gap-2">
        {previewFields.map((field, idx) => (
          <FieldBadge key={idx} field={field} />
        ))}
        {hasMore && (
          <Badge variant="outline" className="text-xs">
            +{entity.fields.length - 3} more
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * FieldBadge - Renders a field value with appropriate styling
 */
function FieldBadge({ field }: { field: UIField }) {
  const value = formatFieldValue(field);

  // Score fields get color-coded badges
  if (field.type === "score") {
    const score = Number(field.value) || 0;
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";

    if (score >= 80)
      variant = "default"; // Green
    else if (score >= 60)
      variant = "secondary"; // Yellow
    else variant = "destructive"; // Red

    return (
      <Badge variant={variant} className="text-xs">
        {field.label}: {value}
      </Badge>
    );
  }

  // Status fields
  if (field.type === "status") {
    return (
      <Badge
        variant={field.value === "active" ? "default" : "outline"}
        className="text-xs capitalize"
      >
        {value}
      </Badge>
    );
  }

  // Currency fields
  if (field.type === "currency") {
    return (
      <Badge variant="outline" className="text-xs font-mono">
        {value}
      </Badge>
    );
  }

  // Default text display
  return (
    <span className="text-xs text-muted-foreground">
      {field.label}: <span className="text-foreground">{value}</span>
    </span>
  );
}

/**
 * Format field value for display
 */
function formatFieldValue(field: UIField): string {
  if (field.value === null || field.value === undefined) return "-";

  if (field.type === "date") {
    return String(field.value);
  }

  if (field.type === "currency") {
    return String(field.value);
  }

  if (field.type === "number") {
    const num = Number(field.value);
    if (field.format?.decimals !== undefined) {
      return num.toFixed(field.format.decimals);
    }
    return num.toLocaleString();
  }

  return String(field.value);
}

/**
 * Get Lucide icon component by name
 */
function getIconComponent(iconName?: string): React.ComponentType<{ className?: string }> | null {
  if (!iconName) return null;
  const iconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return iconMap[iconName] || Icons.Box;
}

export default SchemaSection;
