import type { StorageItem, StorageQuota } from "./types";

const OWNERS = {
  arun: { id: "u1", name: "Arun Kumar", initials: "AK" },
  priya: { id: "u2", name: "Priya Sharma", initials: "PS" },
  rajesh: { id: "u3", name: "Rajesh Menon", initials: "RM" },
  anjali: { id: "u4", name: "Anjali Patel", initials: "AP" },
  vikram: { id: "u5", name: "Vikram Rao", initials: "VR" },
  deepak: { id: "u6", name: "Deepak Jain", initials: "DJ" },
};

export const MOCK_FILES: StorageItem[] = [
  // Root folders
  { id: "f1", name: "Business Operations", type: "folder", isFolder: true, parentId: null, size: 0, createdAt: "2025-11-01T10:00:00Z", modifiedAt: "2026-02-08T14:30:00Z", owner: OWNERS.arun, access: "organization", starred: true, tags: ["BizOps"], source: "IntegrateWise" },
  { id: "f2", name: "Customer Success", type: "folder", isFolder: true, parentId: null, size: 0, createdAt: "2025-10-15T09:00:00Z", modifiedAt: "2026-02-07T11:00:00Z", owner: OWNERS.priya, access: "team", starred: true, tags: ["CS"], source: "IntegrateWise" },
  { id: "f3", name: "Sales Assets", type: "folder", isFolder: true, parentId: null, size: 0, createdAt: "2025-09-01T08:00:00Z", modifiedAt: "2026-02-06T16:45:00Z", owner: OWNERS.deepak, access: "team", starred: false, tags: ["Sales"], source: "IntegrateWise" },
  { id: "f4", name: "Engineering", type: "folder", isFolder: true, parentId: null, size: 0, createdAt: "2025-08-01T12:00:00Z", modifiedAt: "2026-02-09T09:20:00Z", owner: OWNERS.rajesh, access: "team", starred: false, tags: ["Engineering"], source: "IntegrateWise" },
  { id: "f5", name: "Legal & Compliance", type: "folder", isFolder: true, parentId: null, size: 0, createdAt: "2025-07-15T14:00:00Z", modifiedAt: "2026-01-28T10:15:00Z", owner: OWNERS.vikram, access: "private", starred: false, tags: ["Legal"], source: "IntegrateWise" },
  { id: "f6", name: "Marketing", type: "folder", isFolder: true, parentId: null, size: 0, createdAt: "2025-12-01T10:00:00Z", modifiedAt: "2026-02-05T13:00:00Z", owner: OWNERS.anjali, access: "team", starred: false, tags: ["Marketing"], source: "IntegrateWise" },
  { id: "f7", name: "Shared with me", type: "folder", isFolder: true, parentId: null, size: 0, createdAt: "2026-01-01T10:00:00Z", modifiedAt: "2026-02-10T08:00:00Z", owner: OWNERS.arun, access: "private", starred: false, tags: [] },

  // Sub-folders inside Business Operations
  { id: "f1a", name: "SOPs", type: "folder", isFolder: true, parentId: "f1", size: 0, createdAt: "2025-11-05T10:00:00Z", modifiedAt: "2026-02-04T14:00:00Z", owner: OWNERS.arun, access: "organization", starred: false, tags: ["SOP"] },
  { id: "f1b", name: "Quarterly Reports", type: "folder", isFolder: true, parentId: "f1", size: 0, createdAt: "2025-11-10T10:00:00Z", modifiedAt: "2026-02-01T09:00:00Z", owner: OWNERS.arun, access: "team", starred: false, tags: ["Reports"] },
  { id: "f1c", name: "Templates", type: "folder", isFolder: true, parentId: "f1", size: 0, createdAt: "2025-12-01T10:00:00Z", modifiedAt: "2026-01-20T11:30:00Z", owner: OWNERS.priya, access: "organization", starred: false, tags: ["Templates"] },

  // Files in root
  { id: "d1", name: "APAC RevOps Playbook 2026.pdf", type: "pdf", isFolder: false, parentId: null, size: 2457600, createdAt: "2026-01-15T10:00:00Z", modifiedAt: "2026-02-08T14:30:00Z", owner: OWNERS.arun, access: "team", starred: true, tags: ["APAC", "RevOps", "Strategy"], source: "Google Drive", sourceIcon: "📁", version: 3, description: "Comprehensive playbook covering APAC region revenue operations strategy for FY2026." },
  { id: "d2", name: "TechServe SOW v3.2.docx", type: "docx", isFolder: false, parentId: null, size: 912384, createdAt: "2025-12-10T09:00:00Z", modifiedAt: "2026-02-07T16:45:00Z", owner: OWNERS.priya, access: "private", starred: true, tags: ["Contract", "Enterprise"], source: "Google Drive", sourceIcon: "📁", version: 4 },
  { id: "d3", name: "Q4 2025 Revenue Dashboard.xlsx", type: "xlsx", isFolder: false, parentId: null, size: 5242880, createdAt: "2026-01-02T08:00:00Z", modifiedAt: "2026-02-06T12:00:00Z", owner: OWNERS.rajesh, access: "team", starred: false, tags: ["Finance", "Dashboard"], source: "Google Drive", sourceIcon: "📁", version: 2 },
  { id: "d4", name: "Board Presentation Feb 2026.pptx", type: "pptx", isFolder: false, parentId: null, size: 15728640, createdAt: "2026-02-01T14:00:00Z", modifiedAt: "2026-02-09T11:30:00Z", owner: OWNERS.arun, access: "private", starred: true, tags: ["Board", "Presentation"], source: "Google Drive", sourceIcon: "📁", version: 5 },

  // Files inside Business Operations
  { id: "d5", name: "Integration Onboarding SOP.pdf", type: "pdf", isFolder: false, parentId: "f1", size: 1258291, createdAt: "2025-11-20T10:00:00Z", modifiedAt: "2026-01-15T14:00:00Z", owner: OWNERS.arun, access: "organization", starred: false, tags: ["Onboarding", "SOP"], source: "Notion", sourceIcon: "📝", version: 2 },
  { id: "d6", name: "Ops Team Structure.png", type: "png", isFolder: false, parentId: "f1", size: 3145728, createdAt: "2025-12-05T12:00:00Z", modifiedAt: "2026-01-08T09:30:00Z", owner: OWNERS.priya, access: "team", starred: false, tags: ["Org Chart"], source: "Figma", sourceIcon: "🎨" },
  { id: "d7", name: "Vendor Assessment Matrix.xlsx", type: "xlsx", isFolder: false, parentId: "f1", size: 890880, createdAt: "2026-01-10T10:00:00Z", modifiedAt: "2026-02-03T16:00:00Z", owner: OWNERS.vikram, access: "team", starred: false, tags: ["Vendor", "Assessment"], source: "Google Drive", sourceIcon: "📁" },

  // Files inside SOPs
  { id: "d8", name: "Data Privacy Policy (APAC).pdf", type: "pdf", isFolder: false, parentId: "f1a", size: 327680, createdAt: "2025-09-15T10:00:00Z", modifiedAt: "2025-12-20T14:00:00Z", owner: OWNERS.arun, access: "organization", starred: true, tags: ["Compliance", "Privacy"], source: "Confluence", sourceIcon: "📚" },
  { id: "d9", name: "Employee Onboarding Checklist.docx", type: "docx", isFolder: false, parentId: "f1a", size: 184320, createdAt: "2025-10-01T09:00:00Z", modifiedAt: "2026-01-05T11:00:00Z", owner: OWNERS.anjali, access: "organization", starred: false, tags: ["HR", "Onboarding"], source: "Notion", sourceIcon: "📝" },
  { id: "d10", name: "Incident Response Protocol.pdf", type: "pdf", isFolder: false, parentId: "f1a", size: 512000, createdAt: "2025-08-20T08:00:00Z", modifiedAt: "2025-11-15T10:30:00Z", owner: OWNERS.rajesh, access: "organization", starred: false, tags: ["Security", "SOP"], source: "Confluence", sourceIcon: "📚" },

  // Files inside Quarterly Reports
  { id: "d11", name: "Q3 2025 Ops Report.pdf", type: "pdf", isFolder: false, parentId: "f1b", size: 4194304, createdAt: "2025-10-15T10:00:00Z", modifiedAt: "2025-10-20T14:00:00Z", owner: OWNERS.arun, access: "team", starred: false, tags: ["Q3", "Report"], source: "Google Drive", sourceIcon: "📁" },
  { id: "d12", name: "Q4 2025 Revenue Summary.xlsx", type: "xlsx", isFolder: false, parentId: "f1b", size: 2097152, createdAt: "2026-01-05T10:00:00Z", modifiedAt: "2026-01-25T16:00:00Z", owner: OWNERS.rajesh, access: "team", starred: false, tags: ["Q4", "Revenue"], source: "Google Drive", sourceIcon: "📁" },

  // Customer Success files
  { id: "d13", name: "Customer Health Scoring Guide.pdf", type: "pdf", isFolder: false, parentId: "f2", size: 460800, createdAt: "2025-10-01T09:00:00Z", modifiedAt: "2026-01-30T14:00:00Z", owner: OWNERS.anjali, access: "team", starred: true, tags: ["CS", "Health Score"], source: "Confluence", sourceIcon: "📚" },
  { id: "d14", name: "Success Plan Template.docx", type: "docx", isFolder: false, parentId: "f2", size: 256000, createdAt: "2025-11-15T10:00:00Z", modifiedAt: "2026-01-20T11:00:00Z", owner: OWNERS.priya, access: "team", starred: false, tags: ["Template", "CS"], source: "Notion", sourceIcon: "📝" },
  { id: "d15", name: "QBR Deck Template.pptx", type: "pptx", isFolder: false, parentId: "f2", size: 8388608, createdAt: "2025-12-01T14:00:00Z", modifiedAt: "2026-02-05T09:00:00Z", owner: OWNERS.priya, access: "team", starred: false, tags: ["QBR", "Template"], source: "Google Drive", sourceIcon: "📁" },
  { id: "d16", name: "Churn Analysis Dashboard.png", type: "png", isFolder: false, parentId: "f2", size: 1572864, createdAt: "2026-01-20T12:00:00Z", modifiedAt: "2026-02-04T16:30:00Z", owner: OWNERS.anjali, access: "team", starred: false, tags: ["Analytics", "Churn"], source: "Figma", sourceIcon: "🎨" },

  // Sales Assets
  { id: "d17", name: "Sales Pitch Deck 2026.pptx", type: "pptx", isFolder: false, parentId: "f3", size: 12582912, createdAt: "2026-01-10T10:00:00Z", modifiedAt: "2026-02-08T11:00:00Z", owner: OWNERS.deepak, access: "team", starred: true, tags: ["Sales", "Pitch"], source: "Google Drive", sourceIcon: "📁", version: 6 },
  { id: "d18", name: "Competitive Analysis.pdf", type: "pdf", isFolder: false, parentId: "f3", size: 3670016, createdAt: "2025-12-15T09:00:00Z", modifiedAt: "2026-02-02T14:00:00Z", owner: OWNERS.deepak, access: "private", starred: false, tags: ["Competitive", "Analysis"], source: "Google Drive", sourceIcon: "📁" },
  { id: "d19", name: "Pricing Calculator.xlsx", type: "xlsx", isFolder: false, parentId: "f3", size: 1048576, createdAt: "2025-11-01T10:00:00Z", modifiedAt: "2026-01-15T16:00:00Z", owner: OWNERS.vikram, access: "team", starred: false, tags: ["Pricing", "Tools"], source: "Google Drive", sourceIcon: "📁" },

  // Engineering
  { id: "d20", name: "Architecture Decision Records.md", type: "md", isFolder: false, parentId: "f4", size: 81920, createdAt: "2025-08-01T12:00:00Z", modifiedAt: "2026-02-09T09:20:00Z", owner: OWNERS.rajesh, access: "team", starred: false, tags: ["ADR", "Architecture"], source: "GitHub", sourceIcon: "🐙" },
  { id: "d21", name: "API Reference v4.2.json", type: "json", isFolder: false, parentId: "f4", size: 245760, createdAt: "2026-01-20T08:00:00Z", modifiedAt: "2026-02-08T10:00:00Z", owner: OWNERS.rajesh, access: "team", starred: false, tags: ["API", "Reference"], source: "GitHub", sourceIcon: "🐙" },
  { id: "d22", name: "Sprint Retrospective Notes.md", type: "md", isFolder: false, parentId: "f4", size: 40960, createdAt: "2026-02-07T14:00:00Z", modifiedAt: "2026-02-07T17:00:00Z", owner: OWNERS.rajesh, access: "team", starred: false, tags: ["Sprint", "Retro"], source: "Notion", sourceIcon: "📝" },

  // Legal
  { id: "d23", name: "CloudBridge APAC Agreement.pdf", type: "pdf", isFolder: false, parentId: "f5", size: 1126400, createdAt: "2025-11-01T10:00:00Z", modifiedAt: "2026-01-28T10:15:00Z", owner: OWNERS.vikram, access: "private", starred: false, tags: ["Contract", "Singapore"], source: "Google Drive", sourceIcon: "📁" },
  { id: "d24", name: "NDA Template 2026.docx", type: "docx", isFolder: false, parentId: "f5", size: 153600, createdAt: "2026-01-05T09:00:00Z", modifiedAt: "2026-01-10T14:00:00Z", owner: OWNERS.vikram, access: "private", starred: false, tags: ["NDA", "Template"], source: "Google Drive", sourceIcon: "📁" },

  // Marketing
  { id: "d25", name: "Brand Guidelines 2026.pdf", type: "pdf", isFolder: false, parentId: "f6", size: 20971520, createdAt: "2025-12-15T10:00:00Z", modifiedAt: "2026-02-01T12:00:00Z", owner: OWNERS.anjali, access: "organization", starred: true, tags: ["Brand", "Guidelines"], source: "Figma", sourceIcon: "🎨", version: 3 },
  { id: "d26", name: "Social Media Calendar.xlsx", type: "xlsx", isFolder: false, parentId: "f6", size: 614400, createdAt: "2026-01-01T10:00:00Z", modifiedAt: "2026-02-05T13:00:00Z", owner: OWNERS.anjali, access: "team", starred: false, tags: ["Social", "Calendar"], source: "Google Drive", sourceIcon: "📁" },
  { id: "d27", name: "Campaign Assets.zip", type: "zip", isFolder: false, parentId: "f6", size: 52428800, createdAt: "2026-01-25T14:00:00Z", modifiedAt: "2026-01-25T14:00:00Z", owner: OWNERS.anjali, access: "team", starred: false, tags: ["Campaign", "Assets"], source: "Local" },

  // Video file
  { id: "d28", name: "Product Demo Feb 2026.mp4", type: "mp4", isFolder: false, parentId: "f3", size: 104857600, createdAt: "2026-02-03T10:00:00Z", modifiedAt: "2026-02-03T10:00:00Z", owner: OWNERS.deepak, access: "team", starred: false, tags: ["Demo", "Video"], source: "Local" },
];

export const MOCK_QUOTA: StorageQuota = {
  used: 268435456, // ~256 MB
  total: 5368709120, // 5 GB
  breakdown: {
    documents: 134217728,
    images: 52428800,
    videos: 62914560,
    other: 18874368,
  },
};

export const ACTIVITY_LOG = [
  { id: "a1", action: "uploaded", fileName: "Board Presentation Feb 2026.pptx", user: "Arun Kumar", time: "2 hours ago" },
  { id: "a2", action: "edited", fileName: "TechServe SOW v3.2.docx", user: "Priya Sharma", time: "5 hours ago" },
  { id: "a3", action: "shared", fileName: "APAC RevOps Playbook 2026.pdf", user: "Arun Kumar", time: "1 day ago" },
  { id: "a4", action: "moved", fileName: "Data Privacy Policy (APAC).pdf", user: "Arun Kumar", time: "2 days ago" },
  { id: "a5", action: "created folder", fileName: "Templates", user: "Priya Sharma", time: "3 days ago" },
  { id: "a6", action: "deleted", fileName: "Old Deck v1.pptx", user: "Deepak Jain", time: "4 days ago" },
  { id: "a7", action: "renamed", fileName: "Q4 2025 Revenue Dashboard.xlsx", user: "Rajesh Menon", time: "5 days ago" },
  { id: "a8", action: "downloaded", fileName: "Competitive Analysis.pdf", user: "Vikram Rao", time: "1 week ago" },
];
