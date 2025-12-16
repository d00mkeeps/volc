import { useState, useEffect, useRef } from "react";
import { networkMonitor } from "../services/networkMonitor";

export type NetworkHealth = "good" | "poor" | "offline";

interface PingResult {
  latency: number;
  success: boolean;
  timestamp: number;
}

export function useNetworkQuality() {
  const [health, setHealth] = useState<NetworkHealth>("good");
  const recentPingsRef = useRef<PingResult[]>([]);

  useEffect(() => {
    const handlePing = (ping: PingResult) => {
      const pings = recentPingsRef.current;

      pings.push(ping);

      // Keep only last 10 pings
      if (pings.length > 10) pings.shift();

      // Need at least 2 pings to make decisions
      if (pings.length < 2) return;

      const last5 = pings.slice(-5);
      const last2 = pings.slice(-2);

      // Offline: 2 consecutive failures
      if (last2.every((p) => !p.success)) {
        setHealth("offline");
        return;
      }

      // Poor: ANY failure in last 5 pings OR 3+ slow pings (>800ms)
      const hasFailure = last5.some((p) => !p.success);
      const slowPings = last5.filter((p) => p.latency > 800).length;

      if (hasFailure || slowPings >= 3) {
        setHealth("poor");
        return;
      }

      // Good: 3+ fast successful pings (<300ms)
      if (last5.length >= 3) {
        const fastPings = last5.filter(
          (p) => p.success && p.latency < 300
        ).length;
        if (fastPings >= 3) {
          setHealth("good");
        }
      }
    };

    const handleNetInfo = ({ isConnected }: { isConnected: boolean }) => {
      if (!isConnected) {
        setHealth("offline");
        recentPingsRef.current = [];
      }
    };

    networkMonitor.on("ping", handlePing);
    networkMonitor.on("netinfo", handleNetInfo);

    return () => {
      networkMonitor.off("ping", handlePing);
      networkMonitor.off("netinfo", handleNetInfo);
    };
  }, []);

  return {
    health,
    isUnreliable: health === "poor" || health === "offline",
  };
}
