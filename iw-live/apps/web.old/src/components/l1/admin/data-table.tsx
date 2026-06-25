"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
  getValue?: (row: T) => unknown;
};

export function DataTable<T extends { id?: string }>(props: {
  title?: string;
  rows: T[];
  columns: Array<DataTableColumn<T>>;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
}) {
  const { title, rows, columns, onRowClick } = props;
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => {
      return columns.some((col) => {
        const value = col.getValue ? col.getValue(row) : (row as any)[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(q);
      });
    });
  }, [rows, columns, query]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {title ? <h2 className="text-sm font-semibold">{title}</h2> : <div />}
        <div className="w-full max-w-sm">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={props.searchPlaceholder ?? "Search…"}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((row, idx) => {
          const key = (row.id as string | undefined) ?? String(idx);
          const firstCol = columns[0];
          const titleValue = firstCol
            ? firstCol.render
              ? firstCol.render(row)
              : String((row as any)[firstCol.key] ?? "")
            : "";

          const bodyCols = columns.slice(1);

          const content = (
            <Card className="p-4 hover:shadow-sm transition-shadow">
              <div className="text-sm font-semibold text-slate-900 truncate">{titleValue}</div>
              <div className="mt-3 grid gap-2">
                {bodyCols.map((col) => {
                  const value = col.render ? col.render(row) : String((row as any)[col.key] ?? "");
                  return (
                    <div key={col.key} className="flex items-center justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                        {col.header}
                      </div>
                      <div className="text-sm text-slate-700 text-right truncate max-w-[60%]">
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );

          return onRowClick ? (
            <button key={key} type="button" onClick={() => onRowClick(row)} className="text-left">
              {content}
            </button>
          ) : (
            <div key={key}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
