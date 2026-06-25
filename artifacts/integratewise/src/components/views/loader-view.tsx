import { useState } from "react";
import {
  Upload, Link2, Globe, CheckCircle2, Clock, AlertCircle,
  Loader2, RefreshCw, Sparkles, FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LoaderRun {
  id: string;
  source: string;
  status: "running" | "completed" | "failed";
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  startedAt: string;
  completedAt?: string;
}

const LOADER_RUNS: LoaderRun[] = [
  { id: "1", source: "apollo", status: "completed", itemsProcessed: 156, itemsCreated: 42, itemsUpdated: 12, itemsSkipped: 102, startedAt: "2026-01-10T10:00:00Z", completedAt: "2026-01-10T10:02:30Z" },
  { id: "2", source: "hubspot", status: "completed", itemsProcessed: 89, itemsCreated: 23, itemsUpdated: 8, itemsSkipped: 58, startedAt: "2026-01-10T09:30:00Z", completedAt: "2026-01-10T09:31:45Z" },
  { id: "3", source: "csv-import", status: "failed", itemsProcessed: 12, itemsCreated: 0, itemsUpdated: 0, itemsSkipped: 0, startedAt: "2026-01-09T15:10:00Z" },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  running: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  failed: <AlertCircle className="h-4 w-4 text-red-500" />,
};

const CONNECTORS = [
  { id: "apollo", label: "Apollo.io", color: "bg-orange-100" },
  { id: "hubspot", label: "HubSpot", color: "bg-orange-100" },
  { id: "notion", label: "Notion", color: "bg-gray-100" },
  { id: "google-sheets", label: "Google Sheets", color: "bg-green-100" },
];

const fmtDate = (d: string) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function LoaderView() {
  const [activeTab, setActiveTab] = useState("ingest");
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSync = async (source: string) => {
    setIsSyncing(source);
    await new Promise((r) => setTimeout(r, 2000));
    setIsSyncing(null);
  };

  const handleFileUpload = () => {
    setUploadProgress(0);
    const iv = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) { clearInterval(iv); return 100; }
        return p + 10;
      });
    }, 150);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Loader</h1>
        <p className="text-muted-foreground mt-1">Import, normalize, and structure your data from any source</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="ingest">Data Ingest</TabsTrigger>
          <TabsTrigger value="history">Sync History</TabsTrigger>
          <TabsTrigger value="url">URL / Web</TabsTrigger>
        </TabsList>

        <TabsContent value="ingest" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* File Upload */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Upload className="h-6 w-6 text-primary" /></div>
                  <div>
                    <CardTitle className="text-lg">Data Dump</CardTitle>
                    <CardDescription>Upload files or paste data</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 cursor-pointer transition-colors" onClick={handleFileUpload}>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drop CSV, JSON, or Excel files here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Uploading… {uploadProgress}%</p>
                  </div>
                )}
                {uploadProgress === 100 && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />File uploaded — processing…
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connector Sync */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg"><Link2 className="h-6 w-6 text-blue-500" /></div>
                  <div>
                    <CardTitle className="text-lg">Connector Sync</CardTitle>
                    <CardDescription>Pull from connected tools</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {CONNECTORS.map((c) => (
                  <Button key={c.id} variant="outline" className="w-full justify-between" onClick={() => handleSync(c.id)} disabled={isSyncing === c.id}>
                    <span className="flex items-center gap-2">
                      <span className={cn("w-5 h-5 rounded text-xs flex items-center justify-center font-bold", c.color)}>{c.label[0]}</span>
                      {c.label}
                    </span>
                    {isSyncing === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* AI Extraction */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg"><Sparkles className="h-6 w-6 text-yellow-500" /></div>
                  <div>
                    <CardTitle className="text-lg">AI Extraction</CardTitle>
                    <CardDescription>Extract from unstructured text</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-32 rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Paste an email, document, or meeting notes and Spine will extract entities automatically…"
                />
                <Button className="w-full mt-3">
                  <Sparkles className="h-4 w-4 mr-2" />Extract Entities
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>Recent data ingestion runs across all sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {LOADER_RUNS.map((run) => (
                <div key={run.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div>{STATUS_ICON[run.status]}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{run.source}</span>
                      <span className="text-xs text-muted-foreground">{fmtDate(run.startedAt)}</span>
                    </div>
                    {run.status === "completed" && (
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="text-green-600 font-medium">+{run.itemsCreated} created</span>
                        <span className="text-blue-600 font-medium">{run.itemsUpdated} updated</span>
                        <span>{run.itemsSkipped} skipped</span>
                        <span>{run.itemsProcessed} total</span>
                      </div>
                    )}
                    {run.status === "failed" && (
                      <p className="text-xs text-red-500 mt-1">Run failed after {run.itemsProcessed} items</p>
                    )}
                  </div>
                  <Badge variant={run.status === "completed" ? "secondary" : run.status === "running" ? "default" : "destructive"}>
                    {run.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url">
          <Card>
            <CardHeader>
              <CardTitle>URL / Web Extraction</CardTitle>
              <CardDescription>Import data from any publicly accessible URL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://example.com/data" />
                </div>
                <Button><FileText className="h-4 w-4 mr-2" />Extract</Button>
              </div>
              <p className="text-xs text-muted-foreground">Spine will fetch the page, extract structured entities (companies, people, deals), and add them to your workspace.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
