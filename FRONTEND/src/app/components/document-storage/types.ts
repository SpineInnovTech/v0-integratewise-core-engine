/**
 * Document Storage Types
 * Canonical types for the unified document storage module
 */

export type FileType = 
  | "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx"
  | "png" | "jpg" | "jpeg" | "gif" | "svg" | "webp"
  | "mp4" | "mov" | "avi"
  | "mp3" | "wav"
  | "zip" | "rar" | "tar"
  | "txt" | "csv" | "json" | "xml" | "md"
  | "figma" | "sketch"
  | "folder"
  | "unknown";

export type AccessLevel = "private" | "team" | "organization" | "public";

export type SortField = "name" | "modified" | "size" | "type";
export type SortDirection = "asc" | "desc";

export interface StorageItem {
  id: string;
  name: string;
  type: FileType;
  isFolder: boolean;
  parentId: string | null;
  size: number; // bytes
  createdAt: string;
  modifiedAt: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
    initials: string;
  };
  access: AccessLevel;
  starred: boolean;
  tags: string[];
  source?: string; // e.g., "Google Drive", "Notion", "Local"
  sourceIcon?: string;
  sharedWith?: { id: string; name: string; initials: string; role: string }[];
  version?: number;
  description?: string;
  thumbnailUrl?: string;
  provenance?: {
    sourceToolId: string;
    sourceToolName: string;
    syncedAt: string;
  }[];
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export interface StorageQuota {
  used: number; // bytes
  total: number; // bytes
  breakdown: {
    documents: number;
    images: number;
    videos: number;
    other: number;
  };
}

export type ViewMode = "grid" | "list";
export type SidePanel = "none" | "details" | "activity";
