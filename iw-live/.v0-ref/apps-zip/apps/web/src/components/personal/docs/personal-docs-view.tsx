"use client";

import { useState, useEffect } from "react";
import { knowledge } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Upload, File, RotateCcw, FileText } from "lucide-react";

interface Document {
  id: string;
  name: string;
  type?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export function PersonalDocsView() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      setError(null);
      const result = await knowledge.documents({ limit: 25 });
      const data = result.data || result.documents || [];
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  const typeColors: Record<string, string> = {
    pdf: "bg-red-100 text-red-700",
    doc: "bg-blue-100 text-blue-700",
    docx: "bg-blue-100 text-blue-700",
    txt: "bg-gray-100 text-gray-700",
    sheet: "bg-green-100 text-green-700",
    presentation: "bg-orange-100 text-orange-700",
  };

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Documents</h2>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{error}</p>
              <Button size="sm" variant="outline" onClick={loadDocuments} className="mt-2">
                <RotateCcw className="w-3 h-3 mr-1" /> Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Documents</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{documents.length} documents</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="gap-2">
            <Upload className="w-3 h-3" /> Upload
          </Button>
          <Button size="sm" variant="outline" onClick={loadDocuments}>
            Refresh
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-4">No documents yet</p>
              <Button size="sm" className="gap-2">
                <Upload className="w-3 h-3" /> Upload your first document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 pr-4">
            {documents.map(doc => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-secondary mt-1">
                      <File className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium truncate">{doc.name}</h3>
                        {doc.type && (
                          <Badge
                            className={`text-xs flex-shrink-0 ${typeColors[doc.type] || "bg-gray-100 text-gray-700"}`}
                          >
                            {doc.type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {doc.size && <span>{formatFileSize(doc.size)}</span>}
                        {doc.updatedAt && (
                          <>
                            <span>•</span>
                            <span>Updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      {doc.owner && (
                        <p className="text-xs text-muted-foreground mt-1">By {doc.owner}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
