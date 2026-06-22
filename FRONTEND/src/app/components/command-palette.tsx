import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Plug,
  Building2,
  Globe,
  Megaphone,
  DollarSign,
  FileText,
  Users,
  GitBranch,
  Settings,
  Sparkles,
  ArrowRight,
  CornerDownLeft,
  Shield,
  UserCog,
  Landmark,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string, view: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  action: () => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Quick Actions
    { id: "new-account", label: "Create Account", description: "Add a new customer account", icon: Plus, category: "Quick Actions", action: () => { onNavigate("ops", "accounts"); onClose(); } },
    { id: "new-integration", label: "Add Integration", description: "Connect a new tool", icon: Plug, category: "Quick Actions", action: () => { onNavigate("ops", "integrations"); onClose(); } },
    { id: "new-deal", label: "Create Deal", description: "Add a new sales deal", icon: DollarSign, category: "Quick Actions", action: () => { onNavigate("sales", "pipeline"); onClose(); } },
    { id: "view-intelligence", label: "Open Intelligence", description: "View AI insights", icon: Sparkles, category: "Quick Actions", action: () => onClose() },

    // Pages
    { id: "ops-dashboard", label: "Business Ops Dashboard", icon: Building2, category: "Pages", action: () => { onNavigate("ops", "dashboard"); onClose(); } },
    { id: "integration-hub", label: "Integration Hub", icon: Plug, category: "Pages", action: () => { onNavigate("ops", "integrations"); onClose(); } },
    { id: "accounts", label: "Accounts & Revenue", icon: Building2, category: "Pages", action: () => { onNavigate("ops", "accounts"); onClose(); } },
    { id: "workflows", label: "Workflows & Automation", icon: GitBranch, category: "Pages", action: () => { onNavigate("ops", "workflows"); onClose(); } },
    { id: "website-dash", label: "Website Dashboard", icon: Globe, category: "Pages", action: () => { onNavigate("website", "dashboard"); onClose(); } },
    { id: "marketing-dash", label: "Marketing Dashboard", icon: Megaphone, category: "Pages", action: () => { onNavigate("marketing", "dashboard"); onClose(); } },
    { id: "sales-dash", label: "Sales Dashboard", icon: DollarSign, category: "Pages", action: () => { onNavigate("sales", "dashboard"); onClose(); } },
    { id: "pipeline", label: "Sales Pipeline", icon: DollarSign, category: "Pages", action: () => { onNavigate("sales", "pipeline"); onClose(); } },
    { id: "settings", label: "Settings", icon: Settings, category: "Pages", action: () => onClose() },

    // Admin & Governance
    { id: "user-mgmt", label: "User Management", description: "Manage team members and access", icon: UserCog, category: "Admin & Governance", action: () => { onNavigate("ops", "user-management"); onClose(); } },
    { id: "rbac", label: "Roles & Permissions", description: "RBAC matrix and role templates", icon: Shield, category: "Admin & Governance", action: () => { onNavigate("ops", "rbac"); onClose(); } },
    { id: "tenants", label: "Workspace Management", description: "Multi-tenant workspaces", icon: Landmark, category: "Admin & Governance", action: () => { onNavigate("ops", "tenant-management"); onClose(); } },

    // Accounts
    { id: "acc-techserve", label: "TechServe India Pvt Ltd", description: "Enterprise · APAC - India", icon: Building2, category: "Accounts", action: () => { onNavigate("ops", "accounts"); onClose(); } },
    { id: "acc-cloudbridge", label: "CloudBridge APAC", description: "Enterprise · Singapore", icon: Building2, category: "Accounts", action: () => { onNavigate("ops", "accounts"); onClose(); } },
    { id: "acc-financeflow", label: "FinanceFlow Solutions", description: "Mid-Market · India", icon: Building2, category: "Accounts", action: () => { onNavigate("ops", "accounts"); onClose(); } },

    // Contacts
    { id: "ct-ravi", label: "Ravi Sharma", description: "CTO, TechServe India", icon: Users, category: "Contacts", action: () => { onNavigate("sales", "contacts"); onClose(); } },
    { id: "ct-mei", label: "Mei Lin Chen", description: "VP Ops, CloudBridge APAC", icon: Users, category: "Contacts", action: () => { onNavigate("sales", "contacts"); onClose(); } },

    // Documents
    { id: "doc-playbook", label: "APAC RevOps Playbook 2026", description: "Guide · Google Drive", icon: FileText, category: "Documents", action: () => { onNavigate("ops", "documents"); onClose(); } },
    { id: "doc-sow", label: "TechServe SOW v3.2", description: "Contract · Google Drive", icon: FileText, category: "Documents", action: () => { onNavigate("ops", "documents"); onClose(); } },
  ];

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatFiltered[selectedIndex]) {
          flatFiltered[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, flatFiltered, onClose]);

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Palette */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[560px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across all systems via Spine..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
                {category}
              </div>
              {items.map((item) => {
                const itemIndex = currentIndex++;
                const Icon = item.icon;
                const isSelected = itemIndex === selectedIndex;

                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{highlightMatch(item.label, query)}</div>
                      {item.description && (
                        <div className="text-[11px] text-muted-foreground truncate">{item.description}</div>
                      )}
                    </div>
                    {isSelected && (
                      <CornerDownLeft className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {flatFiltered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-secondary border border-border">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-secondary border border-border">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-secondary border border-border">Esc</kbd> Close
          </span>
        </div>
      </div>
    </>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: "var(--iw-blue)", fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}