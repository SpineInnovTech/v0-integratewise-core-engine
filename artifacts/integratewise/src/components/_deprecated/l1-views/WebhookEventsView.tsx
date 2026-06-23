"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  Play,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format } from "date-fns";

interface WebhookEvent {
  id: string;
  provider: string;
  eventType: string;
  payload: any;
  headers: any;
  receivedAt: string;
  processedAt?: string;
  status: string;
  signatureValid: boolean;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  offset: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Metadata {
  providers: string[];
  eventTypes: string[];
  statusCounts: Record<string, number>;
}

interface ApiResponse {
  success: boolean;
  data: WebhookEvent[];
  pagination: PaginationInfo;
  metadata: Metadata;
}

export default function WebhookEventsView() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    provider: "all",
    eventType: "all",
    status: "all",
    limit: 20,
    sortBy: "received_at",
    sortOrder: "desc" as "asc" | "desc",
  });
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  const fetchEvents = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams(
          Object.entries({
            ...Object.entries(filters).reduce(
              (acc, [key, val]) => ({ ...acc, [key]: String(val) }),
              {}
            ),
            page: page.toString(),
            offset: ((page - 1) * filters.limit).toString(),
          }).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {} as Record<string, string>)
        );

        const response = await fetch(`/api/webhook-events?${params}`);
        const data: ApiResponse = await response.json();

        if (data.success) {
          setEvents(data.data);
          setPagination(data.pagination);
          setMetadata(data.metadata);
        } else {
          throw new Error("Failed to fetch webhook events");
        }
      } catch (error) {
        console.error("Error fetching webhook events:", error);
        toast.error("Error", {
          description: "Failed to fetch webhook events",
        });
      } finally {
        setLoading(false);
      }
    },
    [filters, toast]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    setSelectedEvents((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(eventId);
      } else {
        newSet.delete(eventId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(new Set(events.map((e) => e.id)));
    } else {
      setSelectedEvents(new Set());
    }
  };

  const handleBulkAction = async (action: "retry" | "cancel") => {
    if (selectedEvents.size === 0) return;

    try {
      const response = await fetch("/api/webhook-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventIds: Array.from(selectedEvents),
          action,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Success", {
          description: `${action === "retry" ? "Retried" : "Cancelled"} ${data.updatedCount} webhook events`,
        });
        setSelectedEvents(new Set());
        fetchEvents(pagination?.page || 1);
      } else {
        throw new Error(data.error || "Bulk action failed");
      }
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error("Error", {
        description: `Failed to ${action} events`,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      received: "secondary",
      processing: "default",
      processed: "default",
      failed: "destructive",
      retrying: "secondary",
      dead_lettered: "destructive",
      cancelled: "outline",
    } as const;

    return (
      <Badge variant={(variants[status as keyof typeof variants] || "secondary") as any}>
        {status}
      </Badge>
    );
  };

  const formatPayload = (payload: any) => {
    return JSON.stringify(payload, null, 2);
  };

  const canRetry = (event: WebhookEvent) => {
    return ["failed", "dead_lettered"].includes(event.status);
  };

  const canCancel = (event: WebhookEvent) => {
    return ["retrying", "failed"].includes(event.status);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
          <CardDescription>
            Monitor and manage incoming webhook events from all providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Provider:</label>
              <Select
                value={filters.provider}
                onValueChange={(value) => handleFilterChange("provider", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {metadata?.providers.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Event Type:</label>
              <Select
                value={filters.eventType}
                onValueChange={(value) => handleFilterChange("eventType", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {metadata?.eventTypes.map((eventType) => (
                    <SelectItem key={eventType} value={eventType}>
                      {eventType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="retrying">Retrying</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Limit:</label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => handleFilterChange("limit", parseInt(value).toString())}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={() => fetchEvents(1)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedEvents.size > 0 && (
            <div className="flex gap-2 mb-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Retry Selected ({selectedEvents.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Retry Webhook Events</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will retry processing {selectedEvents.size} failed webhook events. Are
                      you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleBulkAction("retry")}>
                      Retry Events
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel Selected ({selectedEvents.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Webhook Events</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel retry attempts for {selectedEvents.size} webhook events. Are
                      you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleBulkAction("cancel")}>
                      Cancel Events
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Events Grid (no tables) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={events.length > 0 && selectedEvents.size === events.length}
                  onCheckedChange={handleSelectAll}
                />
                <span>Select all</span>
              </div>
              <div className="text-xs text-muted-foreground">Showing {events.length} events</div>
            </div>

            {loading ? (
              <div className="border rounded-lg p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="mt-2 text-sm text-muted-foreground">Loading webhook events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground">No webhook events found</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {events.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <Checkbox
                          checked={selectedEvents.has(event.id)}
                          onCheckedChange={(checked) =>
                            handleSelectEvent(event.id, checked as boolean)
                          }
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{event.provider}</Badge>
                            <span className="text-sm font-semibold truncate">
                              {event.eventType}
                            </span>
                            {getStatusBadge(event.status)}
                          </div>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="bg-muted/30 border rounded-lg p-2">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                                Received
                              </div>
                              <div className="text-sm font-semibold">
                                {format(new Date(event.receivedAt), "MMM dd, HH:mm:ss")}
                              </div>
                            </div>
                            <div className="bg-muted/30 border rounded-lg p-2">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                                Retry
                              </div>
                              <div className="text-sm font-semibold">{event.retryCount}</div>
                            </div>
                            <div className="bg-muted/30 border rounded-lg p-2">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                                Signature
                              </div>
                              <div className="text-sm font-semibold">
                                {event.signatureValid ? "Valid" : "Invalid"}
                              </div>
                            </div>
                            <div className="bg-muted/30 border rounded-lg p-2">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                                Processed
                              </div>
                              <div className="text-sm font-semibold">
                                {event.processedAt
                                  ? format(new Date(event.processedAt), "MMM dd, HH:mm:ss")
                                  : "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEvent(event)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Webhook Event Details</DialogTitle>
                              <DialogDescription>
                                {event.provider} - {event.eventType}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh]">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Metadata</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">ID:</span> {event.id}
                                    </div>
                                    <div>
                                      <span className="font-medium">Status:</span>{" "}
                                      {getStatusBadge(event.status)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Received:</span>{" "}
                                      {format(new Date(event.receivedAt), "PPpp")}
                                    </div>
                                    <div>
                                      <span className="font-medium">Processed:</span>{" "}
                                      {event.processedAt
                                        ? format(new Date(event.processedAt), "PPpp")
                                        : "N/A"}
                                    </div>
                                    <div>
                                      <span className="font-medium">Retry Count:</span>{" "}
                                      {event.retryCount}
                                    </div>
                                    <div>
                                      <span className="font-medium">Signature Valid:</span>{" "}
                                      {event.signatureValid ? "Yes" : "No"}
                                    </div>
                                  </div>
                                </div>

                                {event.errorMessage && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Error Message</h4>
                                    <pre className="bg-red-50 p-3 rounded text-sm overflow-x-auto">
                                      {event.errorMessage}
                                    </pre>
                                  </div>
                                )}

                                <Separator />

                                <div>
                                  <h4 className="font-semibold mb-2">Payload</h4>
                                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto max-h-96">
                                    {formatPayload(event.payload)}
                                  </pre>
                                </div>

                                <Separator />

                                <div>
                                  <h4 className="font-semibold mb-2">Headers</h4>
                                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto max-h-48">
                                    {formatPayload(event.headers)}
                                  </pre>
                                </div>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>

                        {canRetry(event) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBulkAction("retry")}
                            title="Retry this event"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}

                        {canCancel(event) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBulkAction("cancel")}
                            title="Cancel retry attempts"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {pagination.offset + 1}-
                {Math.min(pagination.offset + pagination.limit, pagination.total)} of{" "}
                {pagination.total} events
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEvents(1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEvents(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEvents(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEvents(pagination.totalPages)}
                  disabled={!pagination.hasNext}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
