import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Pencil, X, ChevronDown, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EditableField — inline editable primitive for the User Workbench.
 * Every projected field uses this so the surface is operable, not passive.
 * Hover reveals the edit affordance; save/cancel commits or discards.
 * After edit, a subtle "edited" dot marks human provenance.
 */

type Common = {
  label?: string;
  className?: string;
  display?: (v: string) => ReactNode;
  placeholder?: string;
};

export function EditableText({
  value,
  onChange,
  multiline = false,
  display,
  className,
  placeholder = "Empty",
  label,
}: Common & {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editing, value]);

  const commit = () => {
    if (draft !== value) {
      onChange(draft);
      setTouched(true);
    }
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    const sharedProps = {
      value: draft,
      onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          commit();
        }
        if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      },
      className: cn(
        "w-full rounded-sm border border-brand bg-background px-1.5 py-0.5 text-[13px] text-foreground outline-none ring-1 ring-brand/30",
        multiline && "min-h-[64px] py-1",
        className
      ),
    };
    return multiline ? (
      <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} {...sharedProps} />
    ) : (
      <input ref={inputRef as React.RefObject<HTMLInputElement>} type="text" {...sharedProps} />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={label ? `Edit ${label}` : "Edit field"}
      className={cn(
        "group relative -mx-1 inline-flex w-[calc(100%+0.5rem)] items-start gap-1 rounded-sm px-1 py-0.5 text-left text-[13px] text-foreground hover:bg-brand/[0.06]",
        !value && "text-muted-foreground italic",
        className
      )}
    >
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
        {value ? (display ? display(value) : value) : placeholder}
      </span>
      <Pencil className="mt-0.5 size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      {touched && (
        <span
          aria-label="Edited by you"
          className="absolute right-0 top-0 size-1.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-trust"
        />
      )}
    </button>
  );
}

export function EditableSelect({
  value,
  onChange,
  options,
  label,
  className,
  pillClass,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  label?: string;
  className?: string;
  pillClass?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label ? `Edit ${label}` : "Edit"}
        className={cn(
          "group inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-[13px] text-foreground hover:bg-brand/[0.06]",
          pillClass?.(value)
        )}
      >
        <span>{value}</span>
        <ChevronDown className="size-3 opacity-60 transition-opacity group-hover:opacity-100" />
        {touched && <span aria-label="Edited" className="ml-0.5 size-1.5 rounded-full bg-trust" />}
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 min-w-[140px] overflow-hidden rounded-sm border border-border bg-popover shadow-lg"
        >
          {options.map((o) => (
            <li key={o}>
              <button
                type="button"
                onClick={() => {
                  if (o !== value) {
                    onChange(o);
                    setTouched(true);
                  }
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-2.5 py-1.5 text-left text-[12px] hover:bg-accent",
                  o === value && "bg-accent font-medium"
                )}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EditableNumber({
  value,
  onChange,
  min = 0,
  max = 100,
  suffix,
  label,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  label?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [touched, setTouched] = useState(false);

  const commit = () => {
    const n = Math.max(min, Math.min(max, Number(draft) || 0));
    if (n !== value) {
      onChange(n);
      setTouched(true);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={cn(
          "w-16 rounded-sm border border-brand bg-background px-1.5 py-0.5 text-[13px] outline-none ring-1 ring-brand/30",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      aria-label={label ? `Edit ${label}` : "Edit"}
      className={cn(
        "group inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-[13px] text-foreground hover:bg-brand/[0.06]",
        className
      )}
    >
      <span>
        {value}
        {suffix}
      </span>
      <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      {touched && <span className="ml-0.5 size-1.5 rounded-full bg-trust" />}
    </button>
  );
}

/** Editable ordered/unordered list of strings. */
export function EditableList({
  items,
  onChange,
  ordered = false,
  itemPlaceholder = "Add item",
}: {
  items: string[];
  onChange: (next: string[]) => void;
  ordered?: boolean;
  itemPlaceholder?: string;
}) {
  const update = (i: number, v: string) => {
    const next = items.slice();
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const add = () => onChange([...items, ""]);

  const Tag = ordered ? "ol" : "ul";
  return (
    <>
      <Tag className="space-y-1.5 text-[13px]">
        {items.map((it, i) => (
          <li key={i} className="group flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border bg-cloud text-[11px] font-semibold text-muted-foreground">
              {ordered ? i + 1 : "•"}
            </span>
            <div className="min-w-0 flex-1">
              <EditableText
                value={it}
                onChange={(v) => update(i, v)}
                placeholder={itemPlaceholder}
                multiline
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove item"
              className="mt-1 size-5 shrink-0 rounded-sm text-muted-foreground opacity-0 transition-opacity hover:bg-critical/10 hover:text-critical group-hover:opacity-100"
            >
              <Trash2 className="mx-auto size-3" />
            </button>
          </li>
        ))}
      </Tag>
      <button
        type="button"
        onClick={add}
        className="mt-2.5 inline-flex items-center gap-1 rounded-sm border border-dashed border-border px-2 py-1 text-[12px] font-medium text-muted-foreground hover:border-brand hover:text-brand"
      >
        <Plus className="size-3" /> Add step
      </button>
    </>
  );
}

/** Approve/Reject inline indicator with state. */
export function ApprovalControls({
  state,
  onChange,
}: {
  state: "pending" | "approved" | "rejected";
  onChange: (s: "pending" | "approved" | "rejected") => void;
}) {
  if (state === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm bg-trust/10 px-2 py-0.5 text-[11px] font-semibold text-trust">
        <Check className="size-3" /> Approved
        <button onClick={() => onChange("pending")} className="ml-1 text-trust/70 hover:text-trust">
          undo
        </button>
      </span>
    );
  }
  if (state === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm bg-critical/10 px-2 py-0.5 text-[11px] font-semibold text-critical">
        <X className="size-3" /> Rejected
        <button
          onClick={() => onChange("pending")}
          className="ml-1 text-critical/70 hover:text-critical"
        >
          undo
        </button>
      </span>
    );
  }
  return null;
}
