// /hooks/useNetworkQuality.tsx
import { useState, useEffect, useRef } from "react";
import { networkMonitor } from "../services/networkMonitor";

export type __NetworkHealth__ = "good" | "poor" | "offline";

interface __PingResult__ {
  latency: number;
  success: boolean;
  timestamp: number;
}

export function useNetworkQuality() {
  const [health, setHealth] = useState<__NetworkHealth__>("good");
  const recentPingsRef = useRef<__PingResult__[]>([]);
  const previousHealthRef = useRef<__NetworkHealth__>("good");

  // Helper function to update health with logging
  const updateHealth = (newHealth: __NetworkHealth__) => {
    if (previousHealthRef.current !== newHealth) {
      const timestamp = new Date();
      const mm = String(timestamp.getMinutes()).padStart(2, "0");
      const ss = String(timestamp.getSeconds()).padStart(2, "0");
      const ms = String(timestamp.getMilliseconds()).padStart(3, "0");

      // console.log(
      //   `[useNetworkQuality] Network health changed: ${previousHealthRef.current} -> ${newHealth} ${mm}:${ss}.${ms}`
      // );

      previousHealthRef.current = newHealth;
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
      const last2 = pings.slice(-2);

      // Offline: 2 consecutive failures
      if (last2.every((p) => !p.success)) {
        updateHealth("offline");
        return;
      }

      // Poor: ANY failure in last 5 pings OR 3+ slow pings (>800ms)
      const hasFailure = last5.some((p) => !p.success);
      const slowPings = last5.filter((p) => p.latency > 800).length;

      if (hasFailure || slowPings >= 3) {
        updateHealth("poor");
        return;
      }

      // Good: Check with available data (don't require 5 pings)
      // This allows faster recovery from offline/poor states
      const availablePings = last5.filter((p) => p.success);
      const fastPings = availablePings.filter((p) => p.latency < 300).length;

      // If we have at least 2 successful fast pings and no failures, mark as good
      if (availablePings.length >= 2 && fastPings >= 2) {
        updateHealth("good");
        return;
      }

      // Default: If we're offline but have recent successes, upgrade to poor
      // This handles the transition state
      if (health === "offline" && availablePings.length > 0) {
        updateHealth("poor");
      }
    };

    const handleNetInfo = ({ isConnected }: { isConnected: boolean }) => {
      if (!isConnected) {
        updateHealth("offline");
        recentPingsRef.current = [];
      } else {
        // Device says we're online - if we were offline, upgrade to poor
        // Let the ping results determine if we should go to good
        if (health === "offline") {
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
  }, [health]); // Added dependency to access current health

  return {
    health,
    isUnreliable: health === "poor" || health === "offline",
  };
}
