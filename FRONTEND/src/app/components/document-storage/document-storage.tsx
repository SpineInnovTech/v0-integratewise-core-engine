import { useState, useMemo, useCallback, useRef, type DragEvent } from "react";
import {
  FileText, Folder, FolderOpen, Search, Grid3x3, List, Plus,
  Download, Trash2, Star, MoreHorizontal, ChevronRight, Upload,
  Eye, Lock, Users, Globe, Clock, HardDrive, Image as ImageIcon,
  Video, File, FileSpreadsheet, FileType2, Presentation, FileCode,
  Archive, Music, Copy, Move, Pencil, Share2, Info, X, ArrowUpDown,
  ChevronDown, Filter, FolderPlus, CloudUpload, Check, ArrowUp,
  SortAsc, SortDesc, LayoutGrid, LayoutList
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Progress } from "../ui/progress";
import { motion, AnimatePresence } from "motion/react";
import type { StorageItem, ViewMode, SidePanel, SortField, SortDirection, BreadcrumbItem, FileType } from "./types";
import { MOCK_FILES, MOCK_QUOTA, ACTIVITY_LOG } from "./mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getFileIcon(type: FileType, size = 20) {
  const iconClass = `w-${size === 20 ? 5 : size === 16 ? 4 : 6} h-${size === 20 ? 5 : size === 16 ? 4 : 6}`;
  switch (type) {
    case "pdf": return <FileText className={iconClass} style={{ color: "#E53935" }} />;
    case "doc": case "docx": return <FileType2 className={iconClass} style={{ color: "#1A73E8" }} />;
    case "xls": case "xlsx": case "csv": return <FileSpreadsheet className={iconClass} style={{ color: "#0F9D58" }} />;
    case "ppt": case "pptx": return <Presentation className={iconClass} style={{ color: "#F4511E" }} />;
    case "png": case "jpg": case "jpeg": case "gif": case "svg": case "webp": return <ImageIcon className={iconClass} style={{ color: "#9C27B0" }} />;
    case "mp4": case "mov": case "avi": return <Video className={iconClass} style={{ color: "#E91E63" }} />;
    case "mp3": case "wav": return <Music className={iconClass} style={{ color: "#FF9800" }} />;
    case "zip": case "rar": case "tar": return <Archive className={iconClass} style={{ color: "#795548" }} />;
    case "json": case "xml": case "md": return <FileCode className={iconClass} style={{ color: "#607D8B" }} />;
    case "txt": return <FileText className={iconClass} style={{ color: "#9E9E9E" }} />;
    case "figma": case "sketch": return <Presentation className={iconClass} style={{ color: "#A259FF" }} />;
    default: return <File className={iconClass} style={{ color: "#9E9E9E" }} />;
  }
}

function getFileColorBg(type: FileType): string {
  switch (type) {
    case "pdf": return "bg-red-50 dark:bg-red-950/30";
    case "doc": case "docx": return "bg-blue-50 dark:bg-blue-950/30";
    case "xls": case "xlsx": case "csv": return "bg-green-50 dark:bg-green-950/30";
    case "ppt": case "pptx": return "bg-orange-50 dark:bg-orange-950/30";
    case "png": case "jpg": case "jpeg": case "gif": case "svg": case "webp": return "bg-purple-50 dark:bg-purple-950/30";
    case "mp4": case "mov": case "avi": return "bg-pink-50 dark:bg-pink-950/30";
    case "zip": case "rar": case "tar": return "bg-amber-50 dark:bg-amber-950/30";
    case "json": case "xml": case "md": return "bg-slate-50 dark:bg-slate-950/30";
    default: return "bg-gray-50 dark:bg-gray-950/30";
  }
}

const ACCESS_ICONS = {
  private: Lock,
  team: Users,
  organization: Globe,
  public: Globe,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function DocumentStorage() {
  const [files, setFiles] = useState<StorageItem[]>(MOCK_FILES);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sidePanel, setSidePanel] = useState<SidePanel>("none");
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("modified");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: StorageItem } | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [quickFilter, setQuickFilter] = useState<"all" | "starred" | "recent" | "shared">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Breadcrumbs ──────────────────────────────────────────────────────────
  const breadcrumbs = useMemo(() => {
    const crumbs: BreadcrumbItem[] = [{ id: null, name: "My Drive" }];
    if (currentFolderId) {
      const buildPath = (id: string | null): BreadcrumbItem[] => {
        if (!id) return [];
        const folder = files.find(f => f.id === id);
        if (!folder) return [];
        return [...buildPath(folder.parentId), { id: folder.id, name: folder.name }];
      };
      crumbs.push(...buildPath(currentFolderId));
    }
    return crumbs;
  }, [currentFolderId, files]);

  // ─── Filtered & Sorted Items ──────────────────────────────────────────────
  const displayedItems = useMemo(() => {
    let items: StorageItem[];

    if (quickFilter === "starred") {
      items = files.filter(f => f.starred);
    } else if (quickFilter === "recent") {
      items = [...files]
        .filter(f => !f.isFolder)
        .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
        .slice(0, 20);
    } else if (quickFilter === "shared") {
      items = files.filter(f => f.access === "team" || f.access === "organization");
    } else {
      items = files.filter(f => f.parentId === currentFolderId);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = files.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.tags.some(t => t.toLowerCase().includes(q)) ||
        f.owner.name.toLowerCase().includes(q)
      );
    }

    // Sort: folders first, then by field
    const folders = items.filter(i => i.isFolder);
    const filesOnly = items.filter(i => !i.isFolder);

    const sortFn = (a: StorageItem, b: StorageItem) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "modified": cmp = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime(); break;
        case "size": cmp = a.size - b.size; break;
        case "type": cmp = a.type.localeCompare(b.type); break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    };

    return [...folders.sort(sortFn), ...filesOnly.sort(sortFn)];
  }, [files, currentFolderId, searchQuery, sortField, sortDirection, quickFilter]);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const allFiles = files.filter(f => !f.isFolder);
    const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
    const folderCount = files.filter(f => f.isFolder).length;
    return {
      fileCount: allFiles.length,
      folderCount,
      totalSize,
      usedPercent: Math.round((MOCK_QUOTA.used / MOCK_QUOTA.total) * 100),
    };
  }, [files]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedItem(null);
    setSelectedItems(new Set());
    setQuickFilter("all");
  }, []);

  const toggleStar = useCallback((id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, starred: !f.starred } : f));
  }, []);

  const deleteItems = useCallback((ids: string[]) => {
    setFiles(prev => prev.filter(f => !ids.includes(f.id)));
    setSelectedItems(new Set());
    setSelectedItem(null);
    setSidePanel("none");
  }, []);

  const createFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    const newFolder: StorageItem = {
      id: `f_${Date.now()}`,
      name: newFolderName.trim(),
      type: "folder",
      isFolder: true,
      parentId: currentFolderId,
      size: 0,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      owner: { id: "u1", name: "Arun Kumar", initials: "AK" },
      access: "team",
      starred: false,
      tags: [],
      source: "IntegrateWise",
    };
    setFiles(prev => [...prev, newFolder]);
    setNewFolderName("");
    setShowNewFolderDialog(false);
  }, [newFolderName, currentFolderId]);

  const renameItem = useCallback((id: string, newName: string) => {
    if (!newName.trim()) return;
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName.trim() } : f));
    setRenamingItem(null);
  }, []);

  const handleItemClick = useCallback((item: StorageItem, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    } else {
      setSelectedItem(item);
      setSelectedItems(new Set([item.id]));
      if (!item.isFolder) {
        setSidePanel("details");
      }
    }
  }, []);

  const handleItemDoubleClick = useCallback((item: StorageItem) => {
    if (item.isFolder) {
      navigateToFolder(item.id);
    }
  }, [navigateToFolder]);

  // ─── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const newFiles: StorageItem[] = droppedFiles.map((file, i) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "unknown";
        return {
          id: `upload_${Date.now()}_${i}`,
          name: file.name,
          type: ext as FileType,
          isFolder: false,
          parentId: currentFolderId,
          size: file.size,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          owner: { id: "u1", name: "Arun Kumar", initials: "AK" },
          access: "private" as const,
          starred: false,
          tags: [],
          source: "Local",
          version: 1,
        };
      });
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, [currentFolderId]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    if (uploadedFiles.length > 0) {
      const newFiles: StorageItem[] = uploadedFiles.map((file, i) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "unknown";
        return {
          id: `upload_${Date.now()}_${i}`,
          name: file.name,
          type: ext as FileType,
          isFolder: false,
          parentId: currentFolderId,
          size: file.size,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          owner: { id: "u1", name: "Arun Kumar", initials: "AK" },
          access: "private" as const,
          starred: false,
          tags: [],
          source: "Local",
          version: 1,
        };
      });
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, [currentFolderId]);

  // ─── Context Menu ─────────────────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent, item: StorageItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  // ─── Sorting Toggle ───────────────────────────────────────────────────────
  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField]);

  const folderItemCount = useCallback((folderId: string) => {
    return files.filter(f => f.parentId === folderId).length;
  }, [files]);

  return (
    <div
      className="h-full flex flex-col overflow-hidden relative"
      onClick={() => setContextMenu(null)}
    >
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border space-y-4">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">Document Storage</h1>
            <p className="text-sm text-muted-foreground">
              {stats.fileCount} files, {stats.folderCount} folders  ·  {formatBytes(MOCK_QUOTA.used)} of {formatBytes(MOCK_QUOTA.total)} used
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)} className="gap-1.5">
              <FolderPlus className="w-4 h-4" /> New Folder
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
              <Upload className="w-4 h-4" /> Upload
            </Button>
          </div>
        </div>

        {/* Quick Filters + Search + View Toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex p-0.5 bg-secondary rounded-lg">
            {(["all", "starred", "recent", "shared"] as const).map(f => (
              <button
                key={f}
                onClick={() => { setQuickFilter(f); if (f !== "all") setCurrentFolderId(null); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  quickFilter === f ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All Files" : f === "starred" ? "Starred" : f === "recent" ? "Recent" : "Shared"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files, folders, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-secondary">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <div className="flex p-0.5 bg-secondary rounded-md">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setSidePanel(sidePanel === "activity" ? "none" : "activity")}
              className={`p-1.5 rounded-md transition-all ml-1 ${sidePanel === "activity" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {quickFilter === "all" && (
          <nav className="flex items-center gap-1 text-sm overflow-x-auto pb-1">
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.id ?? "root"} className="flex items-center gap-1 shrink-0">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                <button
                  onClick={() => navigateToFolder(crumb.id)}
                  className={`px-1.5 py-0.5 rounded-md transition-colors text-sm ${
                    i === breadcrumbs.length - 1
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {i === 0 ? (
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" /> {crumb.name}
                    </span>
                  ) : (
                    crumb.name
                  )}
                </button>
              </div>
            ))}
          </nav>
        )}
      </div>

      {/* ─── Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div
          className={`flex-1 overflow-hidden relative transition-all ${isDragOver ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          <AnimatePresence>
            {isDragOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-primary/5 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-primary/40 bg-card/80">
                  <CloudUpload className="w-12 h-12 text-primary" />
                  <p className="text-lg font-semibold">Drop files to upload</p>
                  <p className="text-sm text-muted-foreground">Files will be added to {breadcrumbs[breadcrumbs.length - 1]?.name || "My Drive"}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multi-select actions */}
          <AnimatePresence>
            {selectedItems.size > 1 && (
              <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                className="absolute top-0 left-0 right-0 z-10 bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between text-sm"
              >
                <span className="font-medium">{selectedItems.size} items selected</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => { /* download all */ }}>
                    <Download className="w-3 h-3" /> Download
                  </Button>
                  <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => { /* move */ }}>
                    <Move className="w-3 h-3" /> Move
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => deleteItems(Array.from(selectedItems))}>
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                  <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setSelectedItems(new Set())}>
                    Clear
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ScrollArea className="h-full">
            {displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
                  <Folder className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">
                  {searchQuery ? "No results found" : "This folder is empty"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchQuery
                    ? `No files or folders matching "${searchQuery}"`
                    : "Drop files here or click Upload to add documents"
                  }
                </p>
                {!searchQuery && (
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)} className="gap-1.5">
                      <FolderPlus className="w-4 h-4" /> New Folder
                    </Button>
                    <Button size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                      <Upload className="w-4 h-4" /> Upload Files
                    </Button>
                  </div>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <GridView
                items={displayedItems}
                selectedItems={selectedItems}
                selectedItem={selectedItem}
                renamingItem={renamingItem}
                renameValue={renameValue}
                onRenameValueChange={setRenameValue}
                onRename={renameItem}
                onCancelRename={() => setRenamingItem(null)}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onContextMenu={handleContextMenu}
                onToggleStar={toggleStar}
                folderItemCount={folderItemCount}
              />
            ) : (
              <ListView
                items={displayedItems}
                selectedItems={selectedItems}
                selectedItem={selectedItem}
                sortField={sortField}
                sortDirection={sortDirection}
                renamingItem={renamingItem}
                renameValue={renameValue}
                onRenameValueChange={setRenameValue}
                onRename={renameItem}
                onCancelRename={() => setRenamingItem(null)}
                onToggleSort={toggleSort}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onContextMenu={handleContextMenu}
                onToggleStar={toggleStar}
                folderItemCount={folderItemCount}
              />
            )}
          </ScrollArea>
        </div>

        {/* ─── Side Panel ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {sidePanel !== "none" && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border overflow-hidden flex-shrink-0"
            >
              <div className="w-[320px] h-full flex flex-col">
                {sidePanel === "details" && selectedItem ? (
                  <DetailPanel item={selectedItem} onClose={() => setSidePanel("none")} onToggleStar={toggleStar} />
                ) : (
                  <ActivityPanel onClose={() => setSidePanel("none")} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Storage Bar (bottom) ────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-2.5 border-t border-border bg-card flex items-center gap-4">
        <HardDrive className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 max-w-xs">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>{formatBytes(MOCK_QUOTA.used)} used</span>
            <span>{formatBytes(MOCK_QUOTA.total)} total</span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${stats.usedPercent > 80 ? "bg-destructive" : stats.usedPercent > 60 ? "bg-amber-500" : "bg-primary"}`}
              style={{ width: `${stats.usedPercent}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground ml-auto">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {formatBytes(MOCK_QUOTA.breakdown.documents)}</span>
          <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> {formatBytes(MOCK_QUOTA.breakdown.images)}</span>
          <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {formatBytes(MOCK_QUOTA.breakdown.videos)}</span>
        </div>
      </div>

      {/* ─── Context Menu ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenuOverlay
            x={contextMenu.x}
            y={contextMenu.y}
            item={contextMenu.item}
            onClose={() => setContextMenu(null)}
            onOpen={() => {
              if (contextMenu.item.isFolder) navigateToFolder(contextMenu.item.id);
              setContextMenu(null);
            }}
            onRename={() => {
              setRenamingItem(contextMenu.item.id);
              setRenameValue(contextMenu.item.name);
              setContextMenu(null);
            }}
            onStar={() => {
              toggleStar(contextMenu.item.id);
              setContextMenu(null);
            }}
            onDelete={() => {
              deleteItems([contextMenu.item.id]);
              setContextMenu(null);
            }}
            onDetails={() => {
              setSelectedItem(contextMenu.item);
              setSidePanel("details");
              setContextMenu(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── New Folder Dialog ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewFolderDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center"
            onClick={() => setShowNewFolderDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl shadow-xl border border-border p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">New Folder</h3>
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createFolder()}
                autoFocus
                className="mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(false)}>Cancel</Button>
                <Button size="sm" onClick={createFolder} disabled={!newFolderName.trim()}>Create</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Grid View ────────────────────────────────────────────────────────────────

function GridView({
  items, selectedItems, selectedItem, renamingItem, renameValue,
  onRenameValueChange, onRename, onCancelRename,
  onItemClick, onItemDoubleClick, onContextMenu, onToggleStar, folderItemCount,
}: {
  items: StorageItem[];
  selectedItems: Set<string>;
  selectedItem: StorageItem | null;
  renamingItem: string | null;
  renameValue: string;
  onRenameValueChange: (v: string) => void;
  onRename: (id: string, name: string) => void;
  onCancelRename: () => void;
  onItemClick: (item: StorageItem, e: React.MouseEvent) => void;
  onItemDoubleClick: (item: StorageItem) => void;
  onContextMenu: (e: React.MouseEvent, item: StorageItem) => void;
  onToggleStar: (id: string) => void;
  folderItemCount: (id: string) => number;
}) {
  const folders = items.filter(i => i.isFolder);
  const filesOnly = items.filter(i => !i.isFolder);

  return (
    <div className="p-6 space-y-6">
      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Folders</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {folders.map(folder => (
              <div
                key={folder.id}
                onClick={e => onItemClick(folder, e)}
                onDoubleClick={() => onItemDoubleClick(folder)}
                onContextMenu={e => onContextMenu(e, folder)}
                className={`group relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                  selectedItems.has(folder.id)
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 bg-card"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Folder className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  {renamingItem === folder.id ? (
                    <input
                      value={renameValue}
                      onChange={e => onRenameValueChange(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") onRename(folder.id, renameValue);
                        if (e.key === "Escape") onCancelRename();
                      }}
                      onBlur={() => onRename(folder.id, renameValue)}
                      autoFocus
                      className="text-sm font-medium w-full bg-transparent border-b border-primary outline-none"
                    />
                  ) : (
                    <div className="text-sm font-medium truncate">{folder.name}</div>
                  )}
                  <div className="text-[10px] text-muted-foreground">{folderItemCount(folder.id)} items</div>
                </div>
                {folder.starred && (
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500 absolute top-2 right-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {filesOnly.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Files</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filesOnly.map(file => {
              const AccessIcon = ACCESS_ICONS[file.access];
              return (
                <div
                  key={file.id}
                  onClick={e => onItemClick(file, e)}
                  onDoubleClick={() => onItemDoubleClick(file)}
                  onContextMenu={e => onContextMenu(e, file)}
                  className={`group relative flex flex-col rounded-xl border cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                    selectedItems.has(file.id)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  {/* File Preview Area */}
                  <div className={`h-28 flex items-center justify-center ${getFileColorBg(file.type)} relative`}>
                    {getFileIcon(file.type, 24)}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {file.starred && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); onToggleStar(file.id); }}
                        className={`p-1 rounded-md bg-card/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity ${file.starred ? "!opacity-100" : ""}`}
                      >
                        <Star className={`w-3 h-3 ${file.starred ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2">
                      <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-card/80 backdrop-blur-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {file.type}
                      </div>
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="p-3 space-y-1.5">
                    {renamingItem === file.id ? (
                      <input
                        value={renameValue}
                        onChange={e => onRenameValueChange(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") onRename(file.id, renameValue);
                          if (e.key === "Escape") onCancelRename();
                        }}
                        onBlur={() => onRename(file.id, renameValue)}
                        autoFocus
                        className="text-xs font-medium w-full bg-transparent border-b border-primary outline-none"
                      />
                    ) : (
                      <div className="text-xs font-medium truncate" title={file.name}>{file.name}</div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{formatBytes(file.size)}</span>
                      <span className="flex items-center gap-0.5">
                        <AccessIcon className="w-2.5 h-2.5" />
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{formatDate(file.modifiedAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  items, selectedItems, selectedItem, sortField, sortDirection,
  renamingItem, renameValue, onRenameValueChange, onRename, onCancelRename,
  onToggleSort, onItemClick, onItemDoubleClick, onContextMenu, onToggleStar, folderItemCount,
}: {
  items: StorageItem[];
  selectedItems: Set<string>;
  selectedItem: StorageItem | null;
  sortField: SortField;
  sortDirection: SortDirection;
  renamingItem: string | null;
  renameValue: string;
  onRenameValueChange: (v: string) => void;
  onRename: (id: string, name: string) => void;
  onCancelRename: () => void;
  onToggleSort: (field: SortField) => void;
  onItemClick: (item: StorageItem, e: React.MouseEvent) => void;
  onItemDoubleClick: (item: StorageItem) => void;
  onContextMenu: (e: React.MouseEvent, item: StorageItem) => void;
  onToggleStar: (id: string) => void;
  folderItemCount: (id: string) => number;
}) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" />;
    return sortDirection === "asc" ? <SortAsc className="w-3 h-3 text-primary" /> : <SortDesc className="w-3 h-3 text-primary" />;
  };

  return (
    <div className="p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2.5 px-3 w-8"></th>
            <th className="text-left py-2.5 px-3">
              <button onClick={() => onToggleSort("name")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium">
                Name <SortIcon field="name" />
              </button>
            </th>
            <th className="text-left py-2.5 px-3 hidden lg:table-cell">
              <span className="text-xs text-muted-foreground font-medium">Owner</span>
            </th>
            <th className="text-left py-2.5 px-3 hidden md:table-cell">
              <button onClick={() => onToggleSort("modified")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium">
                Modified <SortIcon field="modified" />
              </button>
            </th>
            <th className="text-right py-2.5 px-3 hidden sm:table-cell">
              <button onClick={() => onToggleSort("size")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium ml-auto">
                Size <SortIcon field="size" />
              </button>
            </th>
            <th className="text-center py-2.5 px-3 hidden xl:table-cell">
              <span className="text-xs text-muted-foreground font-medium">Access</span>
            </th>
            <th className="text-right py-2.5 px-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const AccessIcon = ACCESS_ICONS[item.access];
            const isSelected = selectedItems.has(item.id);
            return (
              <tr
                key={item.id}
                onClick={e => onItemClick(item, e)}
                onDoubleClick={() => onItemDoubleClick(item)}
                onContextMenu={e => onContextMenu(e, item)}
                className={`group border-b border-border/50 cursor-pointer transition-colors ${
                  isSelected ? "bg-primary/5" : "hover:bg-secondary/50"
                }`}
              >
                <td className="py-2 px-3">
                  <button
                    onClick={e => { e.stopPropagation(); onToggleStar(item.id); }}
                    className={`p-0.5 rounded transition-opacity ${item.starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.starred ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                  </button>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-3">
                    {item.isFolder ? (
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <Folder className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-lg ${getFileColorBg(item.type)} flex items-center justify-center flex-shrink-0`}>
                        {getFileIcon(item.type, 16)}
                      </div>
                    )}
                    <div className="min-w-0">
                      {renamingItem === item.id ? (
                        <input
                          value={renameValue}
                          onChange={e => onRenameValueChange(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") onRename(item.id, renameValue);
                            if (e.key === "Escape") onCancelRename();
                          }}
                          onBlur={() => onRename(item.id, renameValue)}
                          autoFocus
                          className="text-sm font-medium w-full bg-transparent border-b border-primary outline-none"
                        />
                      ) : (
                        <div className="text-sm font-medium truncate">{item.name}</div>
                      )}
                      {item.isFolder && (
                        <div className="text-[10px] text-muted-foreground">{folderItemCount(item.id)} items</div>
                      )}
                    </div>
                    {item.source && !item.isFolder && (
                      <Badge variant="outline" className="text-[8px] font-mono px-1 py-0 h-4 hidden 2xl:inline-flex">
                        {item.source}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-2 px-3 hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                      {item.owner.initials}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{item.owner.name}</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-xs text-muted-foreground hidden md:table-cell">
                  {formatDate(item.modifiedAt)}
                </td>
                <td className="py-2 px-3 text-xs text-muted-foreground text-right hidden sm:table-cell">
                  {item.isFolder ? "—" : formatBytes(item.size)}
                </td>
                <td className="py-2 px-3 text-center hidden xl:table-cell">
                  <span className="text-[10px] text-muted-foreground capitalize flex items-center justify-center gap-1">
                    <AccessIcon className="w-3 h-3" /> {item.access}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={e => { e.stopPropagation(); onContextMenu(e, item); }}
                    className="p-1 rounded-md hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ item, onClose, onToggleStar }: { item: StorageItem; onClose: () => void; onToggleStar: (id: string) => void }) {
  const AccessIcon = ACCESS_ICONS[item.access];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Details</h3>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Preview */}
          <div className={`w-full h-40 rounded-xl ${item.isFolder ? "bg-amber-50 dark:bg-amber-900/20" : getFileColorBg(item.type)} flex items-center justify-center`}>
            {item.isFolder ? (
              <FolderOpen className="w-16 h-16 text-amber-500" />
            ) : (
              getFileIcon(item.type, 24)
            )}
          </div>

          {/* Name & Star */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold break-words">{item.name}</h4>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>
            <button onClick={() => onToggleStar(item.id)} className="p-1 rounded-md hover:bg-secondary flex-shrink-0">
              <Star className={`w-4 h-4 ${item.starred ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
            </button>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium uppercase">{item.isFolder ? "Folder" : item.type}</span>
            </div>
            {!item.isFolder && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Size</span>
                <span className="font-medium">{formatBytes(item.size)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Modified</span>
              <span className="font-medium">{formatDate(item.modifiedAt)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{formatDate(item.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Owner</span>
              <span className="font-medium flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold">{item.owner.initials}</span>
                {item.owner.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Access</span>
              <span className="font-medium flex items-center gap-1 capitalize">
                <AccessIcon className="w-3 h-3" /> {item.access}
              </span>
            </div>
            {item.source && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium flex items-center gap-1">
                  {item.sourceIcon && <span>{item.sourceIcon}</span>} {item.source}
                </span>
              </div>
            )}
            {item.version && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">v{item.version}</span>
              </div>
            )}
          </div>

          {/* Provenance */}
          {item.provenance && item.provenance.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Provenance</h4>
              <div className="space-y-2">
                {item.provenance.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 bg-secondary/50 rounded-lg">
                    <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{p.sourceToolName}</span>
                    <span className="text-muted-foreground">synced {formatDate(p.syncedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
              <Copy className="w-4 h-4" /> Make a Copy
            </Button>
            <Button variant="outline" size="sm" className="w-full gap-2 justify-start text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" /> Move to Trash
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Activity Panel ───────────────────────────────────────────────────────────

function ActivityPanel({ onClose }: { onClose: () => void }) {
  const actionIcons: Record<string, any> = {
    uploaded: CloudUpload,
    edited: Pencil,
    shared: Share2,
    moved: Move,
    "created folder": FolderPlus,
    deleted: Trash2,
    renamed: Pencil,
    downloaded: Download,
  };

  const actionColors: Record<string, string> = {
    uploaded: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
    edited: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
    shared: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
    moved: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
    "created folder": "text-teal-500 bg-teal-50 dark:bg-teal-950/30",
    deleted: "text-red-500 bg-red-50 dark:bg-red-950/30",
    renamed: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30",
    downloaded: "text-sky-500 bg-sky-50 dark:bg-sky-950/30",
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Activity</h3>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {ACTIVITY_LOG.map(activity => {
            const Icon = actionIcons[activity.action] || File;
            const colorClass = actionColors[activity.action] || "text-gray-500 bg-gray-50";
            return (
              <div key={activity.id} className="flex gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <span className="font-semibold">{activity.user}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <p className="text-xs font-medium truncate mt-0.5">{activity.fileName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

function ContextMenuOverlay({
  x, y, item, onClose, onOpen, onRename, onStar, onDelete, onDetails,
}: {
  x: number; y: number; item: StorageItem;
  onClose: () => void; onOpen: () => void; onRename: () => void;
  onStar: () => void; onDelete: () => void; onDetails: () => void;
}) {
  const menuItems = [
    { icon: item.isFolder ? FolderOpen : Eye, label: item.isFolder ? "Open" : "Preview", action: onOpen },
    { icon: Download, label: "Download", action: () => { onClose(); } },
    { icon: Pencil, label: "Rename", action: onRename },
    { icon: Star, label: item.starred ? "Remove Star" : "Add Star", action: onStar },
    { icon: Share2, label: "Share", action: () => { onClose(); } },
    { icon: Copy, label: "Make a Copy", action: () => { onClose(); } },
    { icon: Move, label: "Move to...", action: () => { onClose(); } },
    null, // divider
    { icon: Info, label: "Details", action: onDetails },
    null,
    { icon: Trash2, label: "Move to Trash", action: onDelete, danger: true },
  ];

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 400);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 bg-card border border-border rounded-xl shadow-xl py-1.5 w-52"
        style={{ left: adjustedX, top: adjustedY }}
      >
        {menuItems.map((mi, i) => {
          if (!mi) return <div key={i} className="my-1 border-t border-border" />;
          const Icon = mi.icon;
          return (
            <button
              key={i}
              onClick={mi.action}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-secondary transition-colors ${
                (mi as any).danger ? "text-destructive" : ""
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {mi.label}
            </button>
          );
        })}
      </motion.div>
    </>
  );
}
