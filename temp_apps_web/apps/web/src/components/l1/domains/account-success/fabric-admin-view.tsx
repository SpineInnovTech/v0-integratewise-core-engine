import { useState } from "react";
import {
  Settings,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useFabricStatus,
  useFabricManifest,
  useProviderHealth,
} from "@/components/core/hydration/hooks";

const CS_SLOT_PREFIXES = ["customer_success.", "cs."];

export default function FabricAdminView() {
  const status = useFabricStatus();
  const manifest = useFabricManifest();
  const { health, loading: healthLoading, recheck } = useProviderHealth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await recheck();
    setRefreshing(false);
  };

  const csSlots = manifest
    ? Object.entries(manifest.slots).filter(([id]) =>
        CS_SLOT_PREFIXES.some((prefix) => id.startsWith(prefix))
      )
    : [];

  const totalSlots = csSlots.length;
  const activeProviders = status.activeProviders || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Fabric Administration
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hydration Fabric health, provider status, and slot bindings for Account Success.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || healthLoading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Checking..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fabric Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {status.initialized ? (
                <CheckCircle className="w-5 h-5 text-iw-forest-bright" />
              ) : (
                <Clock className="w-5 h-5 text-iw-gold animate-pulse" />
              )}
              <span className="text-lg font-semibold">
                {status.initialized ? "Online" : "Initializing"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Config: {status.configSource || "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              CS Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalSlots}</p>
            <p className="text-xs text-muted-foreground mt-1">of {status.slotCount || 0} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{status.healthyProviders || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              of {status.totalProviders || 0} healthy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {status.lastManifestFetch
                ? new Date(status.lastManifestFetch).toLocaleTimeString()
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Manifest fetch</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Provider Health
          </CardTitle>
          <Badge variant="secondary">{activeProviders.length} active</Badge>
        </CardHeader>
        <CardContent>
          {Object.keys(health).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {healthLoading
                ? "Checking provider health..."
                : "No provider health data available. Click Refresh to check."}
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(health).map(([providerName, providerHealth]) => (
                <div
                  key={providerName}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${providerHealth.healthy ? "bg-iw-forest-bright" : "bg-iw-red"}`}
                    />
                    <div>
                      <div className="text-sm font-medium capitalize">
                        {providerHealth.provider || providerName}
                      </div>
                      {providerHealth.errorMessage && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {providerHealth.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {providerHealth.latencyMs != null
                        ? `${providerHealth.latencyMs.toFixed(0)}ms`
                        : "—"}
                    </span>
                    <Badge variant={providerHealth.healthy ? "secondary" : "destructive"}>
                      {providerHealth.healthy ? "Healthy" : "Degraded"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Account Success Slot Bindings
          </CardTitle>
          <Badge variant="secondary">{totalSlots} slots</Badge>
        </CardHeader>
        <CardContent>
          {csSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {manifest
                ? "No CS-specific slots registered in manifest."
                : "Manifest not loaded yet."}
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-xs">
                    <th className="text-left px-4 py-2.5 font-medium">Slot ID</th>
                    <th className="text-left px-4 py-2.5 font-medium">Provider</th>
                    <th className="text-left px-4 py-2.5 font-medium">Endpoint</th>
                    <th className="text-left px-4 py-2.5 font-medium">TTL</th>
                    <th className="text-left px-4 py-2.5 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {csSlots.map(([slotId, binding]) => (
                    <tr key={slotId} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs">{slotId}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-xs capitalize">
                          {binding.provider}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        {binding.endpoint}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {(binding.ttl / 1000).toFixed(0)}s
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {binding.priority}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {status.error && (
        <Card className="border-iw-red/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-iw-red">
              <AlertTriangle className="w-4 h-4" />
              Fabric Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-iw-red">{status.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { FabricAdminView };
