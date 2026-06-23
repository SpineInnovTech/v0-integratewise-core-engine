import { useState, useEffect, useRef, useCallback } from "react";
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
  Home,
  CheckSquare,
  BarChart3,
  Target,
  Phone,
  Mail,
  FileEdit,
  Image,
  Palette,
  PieChart,
  FormInput,
  Share2,
  Bot,
  CreditCard,
  User,
  Activity,
  RefreshCw,
  MessageSquare,
  Calendar,
  Brain,
  FileSignature,
  Database,
  Ticket,
} from "lucide-react";
import type { L1Module } from "@/components/l2/spine/types";
import { apiFetch } from "@/lib/api-client";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
  onDeepDive?: (domain: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  action: () => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate, onDeepDive }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [entityResults, setEntityResults] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live entity search when query is 3+ chars
  useEffect(() => {
    if (query.length < 3) {
      setEntityResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ search: query, limit: "8" }).toString();
        const res = await apiFetch<{ entities?: any[] }>(
          `/api/v1/workspace/entities?${qs}`,
          {},
          "CommandSearch"
        );
        const entities = res.entities || [];
        const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
          account: Building2,
          contact: Users,
          deal: DollarSign,
          opportunity: DollarSign,
          ticket: Ticket,
        };
        setEntityResults(
          entities.map((e: any) => ({
            id: `entity-${e.id}`,
            label: e.name || e.title || e.company || e.email || e.id,
            description: `${e.entity_type}${e.source ? ` · ${e.source}` : ""}${e.health_score ? ` · Health: ${e.health_score}` : ""}`,
            icon: typeIcons[e.entity_type] || Database,
            category: "Entities",
            action: () => {
              onNavigate(`/work/entity-360?id=${e.id}`);
              onClose();
            },
          }))
        );
      } catch {
        setEntityResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, onNavigate, onClose]);

  const nav = (module: L1Module) => {
    onNavigate(module);
    onClose();
  };

  const deepDive = (domain: string) => {
    onDeepDive?.(domain);
    onClose();
  };

  const commands: CommandItem[] = [
    // Quick Actions
    {
      id: "new-account",
      label: "Create Account",
      description: "Add a new customer account",
      icon: Plus,
      category: "Quick Actions",
      action: () => nav("Accounts"),
    },
    {
      id: "new-integration",
      label: "Add Integration",
      description: "Connect a new tool",
      icon: Plug,
      category: "Quick Actions",
      action: () => nav("Integrations"),
    },
    {
      id: "new-deal",
      label: "Create Deal",
      description: "Add a new sales deal",
      icon: DollarSign,
      category: "Quick Actions",
      action: () => nav("Deals"),
    },
    {
      id: "new-task",
      label: "Create Task",
      description: "Add a new task",
      icon: Plus,
      category: "Quick Actions",
      action: () => nav("Tasks"),
    },
    {
      id: "view-intelligence",
      label: "Open Intelligence",
      description: "View AI insights",
      icon: Sparkles,
      category: "Quick Actions",
      action: () => onClose(),
    },

    // Deep Dives (aligned with landing use cases)
    {
      id: "dd-revops",
      label: "Deep Dive: Revenue Operations",
      description: "Revenue intelligence workspace",
      icon: BarChart3,
      category: "Deep Dives",
      action: () => deepDive("revops"),
    },
    {
      id: "dd-cs",
      label: "Deep Dive: Customer Success",
      description: "Full CS workspace with entity deep views",
      icon: Building2,
      category: "Deep Dives",
      action: () => deepDive("account-success"),
    },
    {
      id: "dd-sales",
      label: "Deep Dive: Sales",
      description: "Sales execution hub",
      icon: Target,
      category: "Deep Dives",
      action: () => deepDive("salesops"),
    },
    {
      id: "dd-marketing",
      label: "Deep Dive: Marketing",
      description: "Campaigns, attribution, content",
      icon: Megaphone,
      category: "Deep Dives",
      action: () => deepDive("marketing"),
    },
    {
      id: "dd-product",
      label: "Deep Dive: Product",
      description: "Roadmap, features, sprints",
      icon: GitBranch,
      category: "Deep Dives",
      action: () => deepDive("product"),
    },
    {
      id: "dd-bizops",
      label: "Deep Dive: Business Operations",
      description: "Projects, workflows, analytics",
      icon: RefreshCw,
      category: "Deep Dives",
      action: () => deepDive("bizops"),
    },
    {
      id: "dd-finance",
      label: "Deep Dive: Finance",
      description: "Revenue, expenses, forecasting",
      icon: CreditCard,
      category: "Deep Dives",
      action: () => deepDive("finance"),
    },
    {
      id: "dd-personal",
      label: "Deep Dive: Personal",
      description: "Individual productivity hub",
      icon: User,
      category: "Deep Dives",
      action: () => deepDive("personal"),
    },

    // Account Success (CS-specific)
    {
      id: "account-health",
      label: "Account Health",
      description: "Health metrics with confidence & sources",
      icon: Activity,
      category: "Account Success",
      action: () => nav("Account Health"),
    },
    {
      id: "account-team",
      label: "Account Team",
      description: "Internal & client team with engagement",
      icon: Users,
      category: "Account Success",
      action: () => nav("Account Team"),
    },
    {
      id: "tasks-actions",
      label: "Tasks & Actions",
      description: "Card-based tasks with status filters",
      icon: CheckSquare,
      category: "Account Success",
      action: () => nav("Tasks & Actions"),
    },

    // Core Modules
    {
      id: "home",
      label: "Home Dashboard",
      icon: Home,
      category: "Core Modules",
      action: () => nav("Home"),
    },
    {
      id: "hub-home",
      label: "Hub Home",
      description: "Unified workspace home (goals, activity, AI insight)",
      icon: Home,
      category: "Core Modules",
      action: () => nav("Hub Home"),
    },
    {
      id: "hub-today",
      label: "Today",
      description: "Execution layer for today (priority cards, AI insight)",
      icon: Calendar,
      category: "Core Modules",
      action: () => nav("Today"),
    },
    {
      id: "knowledge-hub",
      label: "Knowledge Hub",
      description: "Centralized knowledge from all sources",
      icon: FileText,
      category: "Core Modules",
      action: () => nav("Knowledge Hub"),
    },
    {
      id: "accounts",
      label: "Accounts",
      description: "Customer & revenue accounts",
      icon: Building2,
      category: "Core Modules",
      action: () => nav("Accounts"),
    },
    {
      id: "contacts",
      label: "Contacts",
      description: "People & stakeholders",
      icon: Users,
      category: "Core Modules",
      action: () => nav("Contacts"),
    },
    {
      id: "tasks",
      label: "Tasks",
      description: "Task management",
      icon: CheckSquare,
      category: "Core Modules",
      action: () => nav("Tasks"),
    },
    {
      id: "calendar",
      label: "Calendar",
      description: "Schedule & events",
      icon: Calendar,
      category: "Core Modules",
      action: () => nav("Calendar"),
    },
    {
      id: "docs",
      label: "Documents",
      description: "Files & knowledge base",
      icon: FileText,
      category: "Core Modules",
      action: () => nav("Docs"),
    },
    {
      id: "meetings",
      label: "Meetings",
      description: "Meeting management",
      icon: MessageSquare,
      category: "Core Modules",
      action: () => nav("Meetings"),
    },
    {
      id: "projects",
      label: "Projects",
      description: "Project management",
      icon: GitBranch,
      category: "Core Modules",
      action: () => nav("Projects"),
    },
    {
      id: "team",
      label: "Team",
      description: "Team members & roles",
      icon: Users,
      category: "Core Modules",
      action: () => nav("Team"),
    },
    {
      id: "analytics",
      label: "Analytics",
      description: "Business intelligence",
      icon: BarChart3,
      category: "Core Modules",
      action: () => nav("Analytics"),
    },
    {
      id: "workflows",
      label: "Workflows & Automation",
      icon: RefreshCw,
      category: "Core Modules",
      action: () => nav("Workflows"),
    },

    // Sales
    {
      id: "pipeline",
      label: "Sales Pipeline",
      description: "Deal pipeline view",
      icon: DollarSign,
      category: "Sales",
      action: () => nav("Pipeline"),
    },
    {
      id: "deals",
      label: "Deals",
      description: "Active deals",
      icon: Landmark,
      category: "Sales",
      action: () => nav("Deals"),
    },
    {
      id: "forecasting",
      label: "Forecasting",
      description: "Revenue forecasting",
      icon: Activity,
      category: "Sales",
      action: () => nav("Forecasting"),
    },
    {
      id: "activities",
      label: "Activities",
      description: "Calls, emails, meetings",
      icon: Phone,
      category: "Sales",
      action: () => nav("Activities"),
    },
    {
      id: "quotes",
      label: "Quotes",
      description: "Proposals & quotes",
      icon: FileSignature,
      category: "Sales",
      action: () => nav("Quotes"),
    },

    // Marketing
    {
      id: "campaigns",
      label: "Campaigns",
      description: "Marketing campaigns",
      icon: Target,
      category: "Marketing",
      action: () => nav("Campaigns"),
    },
    {
      id: "email-studio",
      label: "Email Studio",
      description: "Email marketing",
      icon: Mail,
      category: "Marketing",
      action: () => nav("Email Studio"),
    },
    {
      id: "social",
      label: "Social Media",
      description: "Social media management",
      icon: Share2,
      category: "Marketing",
      action: () => nav("Social"),
    },
    {
      id: "attribution",
      label: "Attribution",
      description: "Multi-touch attribution",
      icon: PieChart,
      category: "Marketing",
      action: () => nav("Attribution"),
    },
    {
      id: "forms",
      label: "Forms",
      description: "Lead gen forms",
      icon: FormInput,
      category: "Marketing",
      action: () => nav("Forms"),
    },

    // Website / CMS
    {
      id: "website",
      label: "Website Dashboard",
      description: "Website analytics",
      icon: Globe,
      category: "Website & CMS",
      action: () => nav("Website"),
    },
    {
      id: "blog",
      label: "Blog",
      description: "Blog content management",
      icon: FileEdit,
      category: "Website & CMS",
      action: () => nav("Blog"),
    },
    {
      id: "seo",
      label: "SEO",
      description: "Search optimization",
      icon: Search,
      category: "Website & CMS",
      action: () => nav("SEO"),
    },
    {
      id: "pages",
      label: "Pages",
      description: "Website pages",
      icon: Globe,
      category: "Website & CMS",
      action: () => nav("Pages"),
    },
    {
      id: "media",
      label: "Media Library",
      description: "Images & files",
      icon: Image,
      category: "Website & CMS",
      action: () => nav("Media Library"),
    },
    {
      id: "theme",
      label: "Theme",
      description: "Design system & theme",
      icon: Palette,
      category: "Website & CMS",
      action: () => nav("Theme"),
    },

    // Admin & Governance
    {
      id: "user-mgmt",
      label: "User Management",
      description: "Manage team members",
      icon: UserCog,
      category: "Admin & Governance",
      action: () => nav("Admin"),
    },
    {
      id: "rbac",
      label: "Roles & Permissions",
      description: "RBAC matrix and role templates",
      icon: Shield,
      category: "Admin & Governance",
      action: () => nav("RBAC"),
    },
    {
      id: "approvals",
      label: "Approval Workflows",
      description: "Governance & approvals",
      icon: Shield,
      category: "Admin & Governance",
      action: () => nav("Approvals"),
    },

    // System
    {
      id: "integrations",
      label: "Integration Hub",
      description: "Connected tools",
      icon: Plug,
      category: "System",
      action: () => nav("Integrations"),
    },
    {
      id: "ai-chat",
      label: "AI Chat",
      description: "AI assistant",
      icon: Bot,
      category: "System",
      action: () => nav("AI Chat"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      category: "System",
      action: () => nav("Settings"),
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      description: "Billing & plans",
      icon: CreditCard,
      category: "System",
      action: () => nav("Subscriptions"),
    },
    {
      id: "profile",
      label: "Profile",
      description: "Your profile",
      icon: User,
      category: "System",
      action: () => nav("Profile"),
    },

    // Accounts (Quick access)
    {
      id: "acc-techserve",
      label: "TechServe India Pvt Ltd",
      description: "Enterprise · APAC - India",
      icon: Building2,
      category: "Accounts",
      action: () => nav("Accounts"),
    },
    {
      id: "acc-cloudbridge",
      label: "CloudBridge APAC",
      description: "Enterprise · Singapore",
      icon: Building2,
      category: "Accounts",
      action: () => nav("Accounts"),
    },
    {
      id: "acc-financeflow",
      label: "FinanceFlow Solutions",
      description: "Mid-Market · India",
      icon: Building2,
      category: "Accounts",
      action: () => nav("Accounts"),
    },

    // Contacts (Quick access)
    {
      id: "ct-ravi",
      label: "Ravi Sharma",
      description: "CTO, TechServe India",
      icon: Users,
      category: "Contacts",
      action: () => nav("Contacts"),
    },
    {
      id: "ct-mei",
      label: "Mei Lin Chen",
      description: "VP Ops, CloudBridge APAC",
      icon: Users,
      category: "Contacts",
      action: () => nav("Contacts"),
    },

    // Documents (Quick access)
    {
      id: "doc-playbook",
      label: "APAC RevOps Playbook 2026",
      description: "Guide · Google Drive",
      icon: FileText,
      category: "Documents",
      action: () => nav("Docs"),
    },
    {
      id: "doc-sow",
      label: "TechServe SOW v3.2",
      description: "Contract · Google Drive",
      icon: FileText,
      category: "Documents",
      action: () => nav("Docs"),
    },
  ];

  const filtered = query
    ? [
        ...entityResults,
        ...commands.filter(
          (c) =>
            c.label.toLowerCase().includes(query.toLowerCase()) ||
            c.description?.toLowerCase().includes(query.toLowerCase()) ||
            c.category.toLowerCase().includes(query.toLowerCase())
        ),
      ]
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
              <div
                className="px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider"
                style={{ fontWeight: 600 }}
              >
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
                        <div className="text-[11px] text-muted-foreground truncate">
                          {item.description}
                        </div>
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
      <span style={{ color: "var(--iw-forest-mid)", fontWeight: 600 }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}
