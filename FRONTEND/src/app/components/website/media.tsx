import { useState } from "react";
import { Image, Search, Upload, Grid3x3, List, Filter, MoreHorizontal, Download, Trash2, Copy, Eye, FileImage, FileVideo, File } from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  format: string;
  size: string;
  dimensions?: string;
  uploadedBy: string;
  uploadedAt: string;
  usedIn: number;
  alt: string;
  color: string;
}

const mediaItems: MediaItem[] = [
  { id: "m1", name: "hero-banner-apac.jpg", type: "image", format: "JPEG", size: "2.4 MB", dimensions: "1920x1080", uploadedBy: "Deepak J.", uploadedAt: "2d ago", usedIn: 3, alt: "APAC Integration Hero", color: "#0066FF" },
  { id: "m2", name: "team-photo-bangalore.jpg", type: "image", format: "JPEG", size: "1.8 MB", dimensions: "1600x900", uploadedBy: "Arun K.", uploadedAt: "1w ago", usedIn: 2, alt: "Bangalore Team Photo", color: "#7C4DFF" },
  { id: "m3", name: "product-demo.mp4", type: "video", format: "MP4", size: "48 MB", uploadedBy: "Priya S.", uploadedAt: "3d ago", usedIn: 1, alt: "Product Demo Video", color: "#FF4081" },
  { id: "m4", name: "integration-diagram.svg", type: "image", format: "SVG", size: "45 KB", dimensions: "800x600", uploadedBy: "Rajesh M.", uploadedAt: "5d ago", usedIn: 4, alt: "Integration Architecture Diagram", color: "#00C853" },
  { id: "m5", name: "pricing-comparison.png", type: "image", format: "PNG", size: "890 KB", dimensions: "1200x800", uploadedBy: "Vikram R.", uploadedAt: "1w ago", usedIn: 1, alt: "Pricing Plans Comparison", color: "#FF9800" },
  { id: "m6", name: "case-study-techserve.pdf", type: "document", format: "PDF", size: "3.2 MB", uploadedBy: "Anjali P.", uploadedAt: "4d ago", usedIn: 2, alt: "TechServe Case Study", color: "#F44336" },
  { id: "m7", name: "logo-dark.svg", type: "image", format: "SVG", size: "12 KB", dimensions: "200x50", uploadedBy: "Arun K.", uploadedAt: "2w ago", usedIn: 8, alt: "IntegrateWise Logo Dark", color: "#0066FF" },
  { id: "m8", name: "logo-light.svg", type: "image", format: "SVG", size: "12 KB", dimensions: "200x50", uploadedBy: "Arun K.", uploadedAt: "2w ago", usedIn: 5, alt: "IntegrateWise Logo Light", color: "#9E9E9E" },
  { id: "m9", name: "testimonial-cloudbridge.jpg", type: "image", format: "JPEG", size: "650 KB", dimensions: "400x400", uploadedBy: "Deepak J.", uploadedAt: "6d ago", usedIn: 1, alt: "CloudBridge CEO Testimonial", color: "#7C4DFF" },
  { id: "m10", name: "onboarding-walkthrough.mp4", type: "video", format: "MP4", size: "120 MB", uploadedBy: "Priya S.", uploadedAt: "1w ago", usedIn: 1, alt: "Onboarding Walkthrough", color: "#FF4081" },
  { id: "m11", name: "social-preview-og.png", type: "image", format: "PNG", size: "280 KB", dimensions: "1200x630", uploadedBy: "Deepak J.", uploadedAt: "3d ago", usedIn: 1, alt: "Open Graph Preview Image", color: "#0066FF" },
  { id: "m12", name: "data-security-infographic.png", type: "image", format: "PNG", size: "1.5 MB", dimensions: "1000x2000", uploadedBy: "Arun K.", uploadedAt: "1w ago", usedIn: 3, alt: "Data Security Infographic", color: "#00C853" },
];

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  image: FileImage,
  video: FileVideo,
  document: File,
};

export function MediaView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = mediaItems.filter((m) => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    return true;
  });

  const totalSize = mediaItems.reduce((s, m) => {
    const num = parseFloat(m.size);
    if (m.size.includes("MB")) return s + num;
    if (m.size.includes("KB")) return s + num / 1024;
    return s;
  }, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Media Library</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage images, videos, and files for your website</p>
        </div>
        <div className="flex gap-2">
          <div className="flex p-0.5 bg-secondary rounded-md">
            <button onClick={() => setViewMode("grid")} className={`px-3 py-1 rounded text-xs transition-all ${viewMode === "grid" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><Grid3x3 className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode("list")} className={`px-3 py-1 rounded text-xs transition-all ${viewMode === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><List className="w-3.5 h-3.5" /></button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Total Files</div><div className="text-lg" style={{ fontWeight: 600 }}>{mediaItems.length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Images</div><div className="text-lg" style={{ fontWeight: 600 }}>{mediaItems.filter((m) => m.type === "image").length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Videos</div><div className="text-lg" style={{ fontWeight: 600 }}>{mediaItems.filter((m) => m.type === "video").length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Total Size</div><div className="text-lg" style={{ fontWeight: 600 }}>{totalSize.toFixed(1)} MB</div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search media files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {filtered.map((item) => {
            const TypeIcon = typeIcons[item.type];
            return (
              <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer group">
                <div className="aspect-square flex items-center justify-center relative" style={{ backgroundColor: `${item.color}10` }}>
                  <TypeIcon className="w-8 h-8" style={{ color: item.color }} />
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                    <button className="p-1 rounded bg-card/80 hover:bg-card"><Eye className="w-3 h-3" /></button>
                    <button className="p-1 rounded bg-card/80 hover:bg-card"><Download className="w-3 h-3" /></button>
                  </div>
                  <span className="absolute bottom-1 left-1 text-[9px] px-1 py-0.5 rounded bg-black/60 text-white" style={{ fontWeight: 500 }}>{item.format}</span>
                </div>
                <div className="p-2">
                  <div className="text-[11px] truncate" style={{ fontWeight: 500 }}>{item.name}</div>
                  <div className="text-[10px] text-muted-foreground flex justify-between">
                    <span>{item.size}</span>
                    <span>Used: {item.usedIn}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>File</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>Type</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 500 }}>Size</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 500 }}>Used In</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden xl:table-cell" style={{ fontWeight: 500 }}>Uploaded</th>
                <th className="text-right py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const TypeIcon = typeIcons[item.type];
                return (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                        <div>
                          <div className="text-xs" style={{ fontWeight: 500 }}>{item.name}</div>
                          <div className="text-[10px] text-muted-foreground">{item.alt}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground capitalize hidden md:table-cell">{item.format}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden lg:table-cell">{item.size}</td>
                    <td className="py-3 px-4 text-xs hidden sm:table-cell">{item.usedIn} page{item.usedIn !== 1 ? "s" : ""}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden xl:table-cell">{item.uploadedAt}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <button className="p-1 rounded hover:bg-secondary"><Download className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button className="p-1 rounded hover:bg-secondary"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
