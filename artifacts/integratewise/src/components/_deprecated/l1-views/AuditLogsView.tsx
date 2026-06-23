import React, { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  Shield,
  User,
  Settings,
  Database,
  CreditCard,
  RefreshCw,
} from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  eventType: string;
  target: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  status: "success" | "failed" | "warning";
}

const mockAuditEntries: AuditEntry[] = [
  {
    id: "1",
    timestamp: "2026-01-29T14:30:00Z",
    actor: "john.doe@company.com",
    action: "User Login",
    eventType: "authentication",
    target: "john.doe@company.com",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    correlationId: "123e4567-e89b-12d3-a456-426614174000",
    status: "success",
  },
  {
    id: "2",
    timestamp: "2026-01-29T14:25:00Z",
    actor: "system@governance",
    action: "Action Approved",
    eventType: "governance",
    target: "Deal Follow-up Required",
    correlationId: "123e4567-e89b-12d3-a456-426614174001",
    metadata: {
      decision: "approved",
      reason: "High priority client deal at risk",
      policy: "client_retention_policy",
    },
    status: "success",
  },
  {
    id: "3",
    timestamp: "2026-01-29T14:20:00Z",
    actor: "billing@stripe.com",
    action: "Payment Processed",
    eventType: "billing",
    target: "Subscription #SUB_12345",
    correlationId: "123e4567-e89b-12d3-a456-426614174002",
    metadata: {
      amount: 49.99,
      currency: "USD",
      plan: "team",
    },
    status: "success",
  },
  {
    id: "4",
    timestamp: "2026-01-29T14:15:00Z",
    actor: "admin@company.com",
    action: "Configuration Changed",
    eventType: "system",
    target: "API Rate Limits",
    ipAddress: "10.0.0.50",
    correlationId: "123e4567-e89b-12d3-a456-426614174003",
    metadata: {
      oldValue: 1000,
      newValue: 2000,
      setting: "api_rate_limit",
    },
    status: "warning",
  },
  {
    id: "5",
    timestamp: "2026-01-29T14:10:00Z",
    actor: "jane.smith@company.com",
    action: "Failed Login Attempt",
    eventType: "authentication",
    target: "jane.smith@company.com",
    ipAddress: "203.0.113.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    correlationId: "123e4567-e89b-12d3-a456-426614174004",
    metadata: {
      reason: "Invalid password",
      attempts: 3,
    },
    status: "failed",
  },
];

export default function AuditLogsView() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (eventTypeFilter !== "all") params.append("eventType", eventTypeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("limit", "100");

      const response = await fetch(`/api/audit?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAuditEntries(data.data);
        setFilteredEntries(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch audit logs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch audit logs");
      console.error("Audit logs fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [eventTypeFilter, statusFilter]);

  useEffect(() => {
    let filtered = auditEntries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (entry) =>
          entry.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.correlationId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
  }, [auditEntries, searchTerm]);

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "authentication":
        return <Shield className="h-4 w-4" />;
      case "governance":
        return <User className="h-4 w-4" />;
      case "billing":
        return <CreditCard className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
      case "data":
        return <Database className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleExport = (format: "csv" | "json") => {
    const data = filteredEntries.map((entry) => ({
      timestamp: entry.timestamp,
      actor: entry.actor,
      action: entry.action,
      eventType: entry.eventType,
      target: entry.target,
      ipAddress: entry.ipAddress,
      correlationId: entry.correlationId,
      status: entry.status,
    }));

    if (format === "csv") {
      const csv = [
        Object.keys(data[0]).join(","),
        ...data.map((row) =>
          Object.values(row)
            .map((val) => `"${val || ""}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Comprehensive audit trail of all system activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAuditLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport("csv")} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("json")} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Error loading audit logs</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchAuditLogs} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading audit logs...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search actor, action, target..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="data">Data Access</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setEventTypeFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Showing {filteredEntries.length} of {auditEntries.length} entries
                {loading && " (updating...)"}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAuditLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm">
                    {formatTimestamp(entry.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEventTypeIcon(entry.eventType)}
                      <span className="capitalize">{entry.eventType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{entry.actor}</TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell className="max-w-xs truncate">{entry.target}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(entry.status)}>{entry.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Detailed information about this audit event</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">
                    {formatTimestamp(selectedEntry.timestamp)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Event Type</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedEntry.eventType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Actor</label>
                  <p className="text-sm text-gray-900">{selectedEntry.actor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Badge className={getStatusColor(selectedEntry.status)}>
                    {selectedEntry.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Action</label>
                  <p className="text-sm text-gray-900">{selectedEntry.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Target</label>
                  <p className="text-sm text-gray-900">{selectedEntry.target}</p>
                </div>
                {selectedEntry.ipAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">IP Address</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedEntry.ipAddress}</p>
                  </div>
                )}
                {selectedEntry.correlationId && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Correlation ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedEntry.correlationId}</p>
                  </div>
                )}
              </div>
              {selectedEntry.userAgent && (
                <div>
                  <label className="text-sm font-medium text-gray-700">User Agent</label>
                  <p className="text-sm text-gray-900 break-all">{selectedEntry.userAgent}</p>
                </div>
              )}
              {selectedEntry.metadata && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Additional Data</label>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
