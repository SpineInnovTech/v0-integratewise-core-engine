import { useState } from "react";
import { Palette, Type, Square, Monitor, Tablet, Smartphone, Eye, Download, RefreshCw, CheckCircle } from "lucide-react";

const brandColors = [
  { name: "Primary Blue", value: "#0066FF", usage: "CTA, Links, Highlights" },
  { name: "Success Green", value: "#00C853", usage: "Positive states, Health" },
  { name: "Warning Orange", value: "#FF9800", usage: "Alerts, At-risk" },
  { name: "Danger Red", value: "#F44336", usage: "Errors, Critical" },
  { name: "Purple", value: "#7C4DFF", usage: "Website module, Charts" },
  { name: "Pink", value: "#FF4081", usage: "Marketing module, Accents" },
  { name: "Background", value: "#FAFAFA", usage: "Page backgrounds" },
  { name: "Card", value: "#FFFFFF", usage: "Cards, Surfaces" },
  { name: "Text Primary", value: "#212121", usage: "Headlines, Body text" },
  { name: "Text Muted", value: "#616161", usage: "Secondary text, Labels" },
  { name: "Border", value: "#E0E0E0", usage: "Dividers, Card borders" },
  { name: "Surface", value: "#F5F5F5", usage: "Inputs, Hover states" },
];

const typography = [
  { name: "H1", family: "Inter", size: "24px", weight: "600", sample: "Dashboard Heading" },
  { name: "H2", family: "Inter", size: "20px", weight: "600", sample: "Section Title" },
  { name: "H3", family: "Inter", size: "18px", weight: "500", sample: "Card Heading" },
  { name: "Body", family: "Inter", size: "14px", weight: "400", sample: "Regular body text for descriptions and content" },
  { name: "Small", family: "Inter", size: "12px", weight: "400", sample: "Labels, captions, and metadata" },
  { name: "Tiny", family: "Inter", size: "10px", weight: "500", sample: "BADGES AND TAGS" },
  { name: "Code", family: "JetBrains Mono", size: "13px", weight: "400", sample: "const api = new IntegrateWise()" },
];

const components = [
  { name: "Button Primary", preview: "bg-primary text-primary-foreground", label: "Get Started" },
  { name: "Button Secondary", preview: "bg-secondary text-foreground", label: "Learn More" },
  { name: "Badge Success", preview: "bg-[#00C853]/10 text-[#00C853]", label: "Active" },
  { name: "Badge Warning", preview: "bg-[#FF9800]/10 text-[#FF9800]", label: "At Risk" },
  { name: "Badge Danger", preview: "bg-[#F44336]/10 text-[#F44336]", label: "Critical" },
  { name: "Badge Info", preview: "bg-[#0066FF]/10 text-[#0066FF]", label: "Read Only" },
];

export function ThemeView() {
  const [tab, setTab] = useState<"colors" | "typography" | "components" | "spacing">("colors");
  const [breakpoint, setBreakpoint] = useState<"desktop" | "tablet" | "mobile">("desktop");

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Theme & Design System</h2>
          <p className="text-sm text-muted-foreground mt-1">Brand kit, global styles, typography, and component library</p>
        </div>
        <div className="flex gap-2">
          <div className="flex p-0.5 bg-secondary rounded-md">
            <button onClick={() => setBreakpoint("desktop")} className={`px-2 py-1 rounded text-xs transition-all ${breakpoint === "desktop" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><Monitor className="w-3.5 h-3.5" /></button>
            <button onClick={() => setBreakpoint("tablet")} className={`px-2 py-1 rounded text-xs transition-all ${breakpoint === "tablet" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><Tablet className="w-3.5 h-3.5" /></button>
            <button onClick={() => setBreakpoint("mobile")} className={`px-2 py-1 rounded text-xs transition-all ${breakpoint === "mobile" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><Smartphone className="w-3.5 h-3.5" /></button>
          </div>
          <button className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-md text-sm hover:bg-accent transition-colors"><Download className="w-3 h-3" /> Export</button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { id: "colors" as const, label: "Brand Colors", icon: Palette },
          { id: "typography" as const, label: "Typography", icon: Type },
          { id: "components" as const, label: "Components", icon: Square },
          { id: "spacing" as const, label: "Spacing & Radius", icon: Square },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1 px-4 py-2 text-sm border-b-2 transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: tab === t.id ? 500 : 400 }}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "colors" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {brandColors.map((color) => (
              <div key={color.name} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="h-16 cursor-pointer hover:opacity-90 transition-opacity" style={{ backgroundColor: color.value }} />
                <div className="p-3">
                  <div className="text-xs" style={{ fontWeight: 500 }}>{color.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{color.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{color.usage}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="mb-3">Color Accessibility</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { combo: "Blue on White", fg: "#0066FF", bg: "#FFFFFF", ratio: "4.75:1", pass: true },
                { combo: "Text on Background", fg: "#212121", bg: "#FAFAFA", ratio: "14.1:1", pass: true },
                { combo: "Muted on Surface", fg: "#616161", bg: "#F5F5F5", ratio: "5.02:1", pass: true },
                { combo: "Success on White", fg: "#00C853", bg: "#FFFFFF", ratio: "2.68:1", pass: false },
              ].map((a) => (
                <div key={a.combo} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-[10px]" style={{ backgroundColor: a.bg, color: a.fg, fontWeight: 600, border: "1px solid var(--border)" }}>Aa</div>
                    <div>
                      <div className="text-xs" style={{ fontWeight: 500 }}>{a.combo}</div>
                      <div className="text-[10px] text-muted-foreground">Ratio: {a.ratio}</div>
                    </div>
                  </div>
                  {a.pass ? <CheckCircle className="w-4 h-4 text-[var(--iw-success)]" /> : <span className="text-[10px] text-[var(--iw-warning)]" style={{ fontWeight: 500 }}>AA Fail</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "typography" && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          {typography.map((t) => (
            <div key={t.name} className="flex items-center gap-6 py-3 border-b border-border last:border-0">
              <div className="w-16 flex-shrink-0">
                <div className="text-xs text-muted-foreground" style={{ fontWeight: 500 }}>{t.name}</div>
                <div className="text-[10px] text-muted-foreground">{t.size} / {t.weight}</div>
              </div>
              <div className="flex-1" style={{ fontFamily: t.family, fontSize: t.size, fontWeight: parseInt(t.weight) }}>
                {t.sample}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{t.family}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "components" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4">Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90">Primary Button</button>
              <button className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-accent">Secondary Button</button>
              <button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary">Outline Button</button>
              <button className="px-4 py-2 text-primary text-sm hover:underline">Link Button</button>
              <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:opacity-90">Destructive</button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4">Badges & Tags</h3>
            <div className="flex flex-wrap gap-2">
              {components.filter((c) => c.name.includes("Badge")).map((c) => (
                <span key={c.name} className={`text-xs px-2.5 py-1 rounded-full ${c.preview}`} style={{ fontWeight: 500 }}>{c.label}</span>
              ))}
              <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>Default</span>
              <span className="text-xs px-2.5 py-1 rounded bg-secondary text-muted-foreground font-mono" style={{ fontWeight: 500 }}>Monospace</span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4">Form Elements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Text Input</label>
                <input type="text" placeholder="Enter value..." className="w-full px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Select</label>
                <select className="w-full px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "spacing" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4">Border Radius</h3>
            <div className="flex flex-wrap gap-4">
              {[
                { name: "sm", value: "4px" },
                { name: "md", value: "6px" },
                { name: "lg", value: "8px" },
                { name: "xl", value: "12px" },
                { name: "full", value: "9999px" },
              ].map((r) => (
                <div key={r.name} className="text-center">
                  <div className="w-16 h-16 bg-primary/20 border-2 border-primary mb-2" style={{ borderRadius: r.value }} />
                  <div className="text-xs" style={{ fontWeight: 500 }}>{r.name}</div>
                  <div className="text-[10px] text-muted-foreground">{r.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4">Spacing Scale</h3>
            <div className="space-y-3">
              {[
                { name: "xs", value: "4px" },
                { name: "sm", value: "8px" },
                { name: "md", value: "12px" },
                { name: "lg", value: "16px" },
                { name: "xl", value: "24px" },
                { name: "2xl", value: "32px" },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-4">
                  <span className="w-8 text-xs text-muted-foreground text-right" style={{ fontWeight: 500 }}>{s.name}</span>
                  <div className="h-4 bg-primary/30 rounded" style={{ width: s.value }} />
                  <span className="text-[10px] text-muted-foreground font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
