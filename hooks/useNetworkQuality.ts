import { useState, useEffect } from "react";
import { networkMonitor, NetworkStatus } from "../services/networkMonitor";

export function useNetworkQuality() {
  const [status, setStatus] = useState<NetworkStatus>(
    networkMonitor.getStatus()
  );

  useEffect(() => {
    // Subscribe to status updates
    const handleStatusUpdate = (newStatus: NetworkStatus) => {
      setStatus(newStatus);
    };

    networkMonitor.on("statusUpdate", handleStatusUpdate);

    // Get initial status in case it changed between render and effect
    setStatus(networkMonitor.getStatus());

    return () => {
      networkMonitor.off("statusUpdate", handleStatusUpdate);
    };
  }, []);

  return {
    // Primitive values
    quality: status.quality,
    isConnected: status.isConnected,
    connectionType: status.connectionType,
    averageLatency: status.averageLatency,
    lastPingLatency: status.lastPingLatency,
    sampleCount: status.sampleCount,

    // Convenience booleans
    isHealthy: status.quality === "excellent" || status.quality === "good",
    isPoor: status.quality === "poor",
    isOffline: status.quality === "offline",
    isExcellent: status.quality === "excellent",

    // Full status object
    status,
  };
}
