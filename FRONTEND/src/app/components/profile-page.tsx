import { useState } from "react";
import {
  User, Settings, Grip, Plus, X, Check, Eye, EyeOff,
  BarChart3, Target, Users, Building2, DollarSign, Calendar,
  TrendingUp, CheckSquare, AlertTriangle, Brain, Zap, FileText,
  Activity, MessageSquare, Globe, CreditCard, Shield
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useSpine } from "./spine/spine-client";
import { useGoalsSafe } from "./goal-framework/goal-context";

interface PaneSection {
  id: string;
  label: string;
  icon: any;
  category: "metrics" | "work" | "intelligence" | "data";
  enabled: boolean;
  description: string;
}

const DEFAULT_SECTIONS: PaneSection[] = [
  { id: "kpi-overview", label: "KPI Overview", icon: BarChart3, category: "metrics", enabled: true, description: "Key performance indicators for your role" },
  { id: "goal-progress", label: "Goal Progress", icon: Target, category: "metrics", enabled: true, description: "Active goals and their tracking" },
  { id: "my-tasks", label: "My Tasks", icon: CheckSquare, category: "work", enabled: true, description: "Tasks assigned to you across all contexts" },
  { id: "upcoming-meetings", label: "Upcoming Meetings", icon: Calendar, category: "work", enabled: true, description: "Next 7 days of scheduled meetings" },
  { id: "intelligence-feed", label: "Intelligence Feed", icon: Zap, category: "intelligence", enabled: true, description: "AI-surfaced insights and signals" },
  { id: "risk-alerts", label: "Risk Alerts", icon: AlertTriangle, category: "intelligence", enabled: true, description: "Accounts and projects at risk" },
  { id: "team-activity", label: "Team Activity", icon: Users, category: "work", enabled: false, description: "Recent activity from your team" },
  { id: "revenue-tracker", label: "Revenue Tracker", icon: DollarSign, category: "metrics", enabled: false, description: "ARR, MRR, and expansion pipeline" },
  { id: "accounts-health", label: "Accounts Health", icon: Building2, category: "data", enabled: false, description: "Health scores across your portfolio" },
  { id: "expansion-signals", label: "Expansion Signals", icon: TrendingUp, category: "intelligence", enabled: false, description: "Accounts showing growth potential" },
  { id: "recent-docs", label: "Recent Documents", icon: FileText, category: "work", enabled: false, description: "Recently edited or shared documents" },
  { id: "knowledge-graph", label: "Knowledge Graph", icon: Brain, category: "data", enabled: false, description: "Entities and their relationships" },
  { id: "activity-timeline", label: "Activity Timeline", icon: Activity, category: "data", enabled: false, description: "Full timeline of interactions" },
  { id: "chat-history", label: "Chat History", icon: MessageSquare, category: "work", enabled: false, description: "Recent AI chat conversations" },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  metrics: { label: "Metrics & Goals", color: "bg-blue-100 text-blue-700" },
  work: { label: "Work & Tasks", color: "bg-emerald-100 text-emerald-700" },
  intelligence: { label: "Intelligence", color: "bg-purple-100 text-purple-700" },
  data: { label: "Data & Insights", color: "bg-amber-100 text-amber-700" },
};

export function ProfilePage() {
  const spine = useSpine();
  const goalsCtx = useGoalsSafe();
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [editMode, setEditMode] = useState(false);

  const enabledSections = sections.filter(s => s.enabled);
  const availableSections = sections.filter(s => !s.enabled);

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="border shadow-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-[#3F5185] to-[#1E2A4A]" />
          <CardContent className="p-6 -mt-10">
            <div className="flex items-end gap-4 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-[#3F5185] flex items-center justify-center text-white text-2xl font-bold border-4 border-card shadow-lg">
                {spine.userName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
              </div>
              <div className="flex-1 pb-1">
                <h1 className="text-xl font-bold">{spine.userName || "User"}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className="bg-[#3F5185]/10 text-[#3F5185] border-0 text-[10px]">{spine.role || "Admin"}</Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px]">{goalsCtx?.orgType || "PRODUCT"} Org</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1"><Settings className="w-3 h-3" />Edit Profile</Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Contexts Active", value: "4", icon: Globe },
                { label: "Tasks This Week", value: "12", icon: CheckSquare },
                { label: "Goals Tracked", value: goalsCtx?.strategicGoals?.length || 8, icon: Target },
                { label: "Intelligence Used", value: "47", icon: Zap },
              ].map((stat, i) => (
                <div key={i} className="bg-secondary/50 rounded-lg p-3 flex items-center gap-2.5">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-lg font-bold">{stat.value}</div>
                    <div className="text-[9px] text-muted-foreground uppercase font-bold">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customizable Pane */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Your Dashboard Sections</h2>
              <p className="text-xs text-muted-foreground">Choose which sections appear on your Home view. Drag to reorder.</p>
            </div>
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? "default" : "outline"}
              size="sm"
              className={`text-xs h-8 gap-1 ${editMode ? "bg-[#3F5185]" : ""}`}
            >
              {editMode ? <><Check className="w-3 h-3" />Done</> : <><Settings className="w-3 h-3" />Customize</>}
            </Button>
          </div>

          {/* Active Sections */}
          <div className="space-y-2 mb-6">
            {enabledSections.map(section => {
              const cat = CATEGORY_LABELS[section.category];
              return (
                <Card key={section.id} className="border shadow-sm group">
                  <CardContent className="p-3 flex items-center gap-3">
                    {editMode && <Grip className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />}
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <section.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{section.label}</span>
                        <Badge className={`${cat.color} border-0 text-[8px]`}>{cat.label}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{section.description}</p>
                    </div>
                    {editMode && (
                      <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0 text-muted-foreground hover:text-red-500" onClick={() => toggleSection(section.id)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {!editMode && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold"><Eye className="w-3 h-3" />Active</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Available Sections Bucket */}
          {editMode && availableSections.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Available Sections</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableSections.map(section => {
                  const cat = CATEGORY_LABELS[section.category];
                  return (
                    <Card key={section.id} className="border border-dashed shadow-none hover:border-[#3F5185]/30 hover:shadow-sm transition-all cursor-pointer" onClick={() => toggleSection(section.id)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                          <section.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{section.label}</span>
                            <Badge className={`${cat.color} border-0 text-[8px]`}>{cat.label}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{section.description}</p>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Settings */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold">Quick Preferences</h3>
            {[
              { label: "Default View Mode", value: "Personal → Work → Project", description: "How your home page hydrates content" },
              { label: "Intelligence Frequency", value: "Real-time", description: "How often AI surfaces new insights" },
              { label: "Default Context", value: "Business Operations", description: "Your primary workspace on login" },
            ].map((pref, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-t border-border first:border-0">
                <div>
                  <div className="text-sm font-medium">{pref.label}</div>
                  <div className="text-[10px] text-muted-foreground">{pref.description}</div>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7">{pref.value}</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
