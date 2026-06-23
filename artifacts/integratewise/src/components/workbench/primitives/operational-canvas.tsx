"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

export interface CanvasSection {
  id: string;
  label: string;
  component: React.ReactNode;
  width: "full" | "half" | "third";
}

export interface OperationalCanvasProps {
  title: string;
  subtitle?: string;
  sections: CanvasSection[];
  className?: string;
}

export function OperationalCanvas({
  title,
  subtitle,
  sections,
  className,
}: OperationalCanvasProps) {
  return (
    <Card className={cn("p-0 gap-0 overflow-hidden", className)}>
      <CardHeader className="px-4 py-3 border-b border-[#d8d0c0]">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-12 gap-4">
          {sections.map((section) => {
            const colSpan =
              section.width === "full"
                ? "col-span-12"
                : section.width === "half"
                  ? "col-span-12 md:col-span-6"
                  : "col-span-12 md:col-span-6 lg:col-span-4";

            return (
              <div key={section.id} className={colSpan}>
                <div className="flex flex-col gap-1.5 mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {section.label}
                  </span>
                </div>
                {section.component}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
