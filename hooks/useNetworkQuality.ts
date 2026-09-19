// /hooks/useNetworkQuality.tsx
import { useState, useEffect, useRef } from "react";
import { networkMonitor } from "../services/networkMonitor";

export type __NetworkHealth__ = "good" | "poor" | "offline";

export let globalNetworkHealth: __NetworkHealth__ = "good";
export const isGloballyOffline = () => globalNetworkHealth === "offline";

interface __PingResult__ {
  latency: number;
  success: boolean;
  timestamp: number;
}

export function useNetworkQuality() {
  const [health, setHealth] = useState<__NetworkHealth__>(globalNetworkHealth);
  const recentPingsRef = useRef<__PingResult__[]>([]);
  const currentHealthRef = useRef<__NetworkHealth__>(globalNetworkHealth);

  // Helper function to update health with logging
  const updateHealth = (newHealth: __NetworkHealth__) => {
    if (currentHealthRef.current !== newHealth) {
      currentHealthRef.current = newHealth;
      globalNetworkHealth = newHealth;
      setHealth(newHealth);
    }
  };

  useEffect(() => {
    const handlePing = (ping: __PingResult__) => {
      const pings = recentPingsRef.current;
      pings.push(ping);

      // Keep only last 10 pings
      if (pings.length > 10) pings.shift();

      // Need at least 2 pings to make decisions
      if (pings.length < 2) return;

      const last5 = pings.slice(-5);
      const last3 = pings.slice(-3);

      // Offline: 3 consecutive failures
      if (last3.length >= 3 && last3.every((p) => !p.success)) {
        updateHealth("offline");
        return;
      }

      // Poor: 2+ failures in last 5 pings OR 3+ slow pings (>1500ms)
      const failures = last5.filter((p) => !p.success).length;
      const slowPings = last5.filter((p) => p.latency > 1500).length;

      if (failures >= 2 || slowPings >= 3) {
        updateHealth("poor");
        return;
      }

      // Good: 2+ successful pings under 800ms and no failures in last 3
      const recentSuccesses = last3.filter((p) => p.success && p.latency < 800).length;
      if (recentSuccesses >= 2 && !last3.some((p) => !p.success)) {
        updateHealth("good");
        return;
      }

      // Default: If we're offline but have recent successes, upgrade to poor
      if (currentHealthRef.current === "offline" && pings.some((p) => p.success)) {
        updateHealth("poor");
      }
    };

    const handleNetInfo = ({ isConnected }: { isConnected: boolean }) => {
      if (!isConnected) {
        updateHealth("offline");
        recentPingsRef.current = [];
      } else {
        if (currentHealthRef.current === "offline") {
          updateHealth("poor");
        }
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
