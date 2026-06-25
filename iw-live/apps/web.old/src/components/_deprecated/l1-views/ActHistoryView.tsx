import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Archive,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Eye,
} from "lucide-react";

interface ActionRun {
  id: string;
  action: string;
  entity: string;
  status: "completed" | "failed" | "running" | "pending";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  result?: string;
  error?: string;
  approvedBy?: string;
  situation: string;
}

const mockActionRuns: ActionRun[] = [
  {
    id: "run-001",
    action: "Schedule follow-up call",
    entity: "Acme Corp",
    status: "completed",
    startedAt: "2024-01-29T14:30:00Z",
    completedAt: "2024-01-29T14:31:00Z",
    duration: 60,
    result: "Call scheduled for tomorrow at 2 PM",
    approvedBy: "John Doe",
    situation: "Deal velocity decreased",
  },
  {
    id: "run-002",
    action: "Send renewal reminder",
    entity: "TechStart Inc",
    status: "failed",
    startedAt: "2024-01-29T13:15:00Z",
    completedAt: "2024-01-29T13:16:00Z",
    duration: 45,
    error: "Email service temporarily unavailable",
    approvedBy: "Jane Smith",
    situation: "Contract expires soon",
  },
  {
    id: "run-003",
    action: "Update contact information",
    entity: "Global Solutions",
    status: "running",
    startedAt: "2024-01-29T15:00:00Z",
    approvedBy: "Mike Johnson",
    situation: "New contact data available",
  },
  {
    id: "run-004",
    action: "Generate quarterly report",
    entity: "DataCorp",
    status: "pending",
    startedAt: "2024-01-29T16:00:00Z",
    situation: "Q4 reporting due",
  },
];

export default function ActHistoryView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRun, setSelectedRun] = useState<ActionRun | null>(null);

  const filteredRuns = mockActionRuns.filter((run) => {
    const matchesSearch =
      run.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.situation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRetry = (runId: string) => {
    console.log("Retrying run:", runId);
    // TODO: Call API to retry action
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Archive className="h-8 w-8" />
          Act History
        </h1>
        <div className="text-sm text-muted-foreground">Execution log and action tracking</div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search actions, entities, or situations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Runs List */}
      <div className="space-y-4">
        {filteredRuns.map((run) => (
          <Card key={run.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(run.status)}
                  <div>
                    <h3 className="font-semibold">{run.action}</h3>
                    <p className="text-sm text-muted-foreground">{run.entity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(run.status)}
                  <Button variant="outline" size="sm" onClick={() => setSelectedRun(run)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  {run.status === "failed" && (
                    <Button variant="outline" size="sm" onClick={() => handleRetry(run.id)}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Started:</span>
                  <div>{new Date(run.startedAt).toLocaleString()}</div>
                </div>
                {run.completedAt && (
                  <div>
                    <span className="text-muted-foreground">Completed:</span>
                    <div>{new Date(run.completedAt).toLocaleString()}</div>
                  </div>
                )}
                {run.duration && (
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <div>{run.duration}s</div>
                  </div>
                )}
                {run.approvedBy && (
                  <div>
                    <span className="text-muted-foreground">Approved by:</span>
                    <div>{run.approvedBy}</div>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <span className="text-sm text-muted-foreground">Situation:</span>
                <p className="text-sm">{run.situation}</p>
              </div>

              {run.result && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <span className="text-sm font-medium text-green-800">Result:</span>
                  <p className="text-sm text-green-700 mt-1">{run.result}</p>
                </div>
              )}

              {run.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <span className="text-sm font-medium text-red-800">Error:</span>
                  <p className="text-sm text-red-700 mt-1">{run.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Run Details Modal */}
      {selectedRun && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Action Run Details</h2>
              <Button variant="outline" size="sm" onClick={() => setSelectedRun(null)}>
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Action</h3>
                  <p className="text-muted-foreground">{selectedRun.action}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Entity</h3>
                  <p className="text-muted-foreground">{selectedRun.entity}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Situation</h3>
                  <p className="text-muted-foreground">{selectedRun.situation}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  {getStatusBadge(selectedRun.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <span className="ml-2">
                        {new Date(selectedRun.startedAt).toLocaleString()}
                      </span>
                    </div>
                    {selectedRun.completedAt && (
                      <div>
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="ml-2">
                          {new Date(selectedRun.completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedRun.duration && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2">{selectedRun.duration} seconds</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedRun.approvedBy && (
                  <div>
                    <h3 className="font-semibold mb-2">Approval</h3>
                    <p className="text-muted-foreground">Approved by {selectedRun.approvedBy}</p>
                  </div>
                )}
              </div>
            </div>

            {selectedRun.result && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Result</h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800">{selectedRun.result}</p>
                </div>
              </div>
            )}

            {selectedRun.error && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Error</h3>
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800">{selectedRun.error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-6">
              {selectedRun.status === "failed" && (
                <Button onClick={() => handleRetry(selectedRun.id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Action
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedRun(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
