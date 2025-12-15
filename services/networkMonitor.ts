import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import EventEmitter from "eventemitter3";

export type NetworkQuality = "excellent" | "good" | "poor" | "offline";

export interface NetworkStatus {
  quality: NetworkQuality;
  isConnected: boolean;
  connectionType: string | null;
  averageLatency: number;
  lastPingLatency: number;
  sampleCount: number;
  lastUpdated: number;
}

const CONFIG = {
  // Use Cloudflare trace endpoint as it's reliable and fast
  PING_URL: "https://www.cloudflare.com/cdn-cgi/trace",
  PING_INTERVAL: 1000, // 2 seconds
  MAX_PINGS: 10, // Keep last 30 pings
  MIN_SAMPLES: 3, // Need 3 pings before determining quality
  TIMEOUT: 5000, // 5s timeout for ping requests

  // Quality thresholds (in milliseconds)
  EXCELLENT_THRESHOLD: 300,
  GOOD_THRESHOLD: 800,
  POOR_THRESHOLD: 2000,
};

class NetworkMonitor extends EventEmitter {
  private pingMetrics: number[] = [];
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private currentQuality: NetworkQuality = "good"; // Optimistic default
  private netInfoState: NetInfoState | null = null;
  private isMonitoring: boolean = false;

  constructor() {
    super();
    this.initializeNetInfo();
    this.startMonitoring(); // Auto-start
  }

  private async initializeNetInfo() {
    // Subscribe to NetInfo changes
    NetInfo.addEventListener((state) => {
      this.handleNetworkStateChange(state);
    });

    // Get initial state
    const state = await NetInfo.fetch();
    this.handleNetworkStateChange(state);
  }

  /**
   * Start the monitoring process
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log("[NetworkMonitor] Starting network monitoring...");

    // Perform immediate ping
    this.performPing();

    // Set up interval
    this.pingInterval = setInterval(() => {
      this.performPing();
    }, CONFIG.PING_INTERVAL);
  }

  /**
   * Stop the monitoring process
   */
  public stopMonitoring(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.isMonitoring = false;
    console.log("[NetworkMonitor] Stopped network monitoring");
  }

  /**
   * Get the current network status
   */
  public getStatus(): NetworkStatus {
    const latencies = this.pingMetrics;
    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = latencies.length > 0 ? sum / latencies.length : 0;

    return {
      quality: this.currentQuality,
      isConnected: this.netInfoState?.isConnected ?? false,
      connectionType: this.netInfoState?.type ?? null,
      averageLatency: Math.round(avg),
      lastPingLatency:
        latencies.length > 0 ? latencies[latencies.length - 1] : 0,
      sampleCount: latencies.length,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Quick check if network is healthy (excellent or good)
   */
  public isHealthy(): boolean {
    return (
      this.currentQuality === "excellent" || this.currentQuality === "good"
    );
  }

  /**
   * Reset metrics
   */
  public reset(): void {
    this.pingMetrics = [];
    this.currentQuality = "good";
    console.log("[NetworkMonitor] Metrics reset");

    // Trigger update
    this.emitStatusUpdate();
  }

  private async performPing(): Promise<void> {
    // Don't ping if explicitly offline according to OS
    if (this.netInfoState && !this.netInfoState.isConnected) {
      console.log("[NetworkMonitor] Skipping ping - device offline");
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

      const start = Date.now();
      await fetch(CONFIG.PING_URL, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latency = Date.now() - start;
      console.log(`[NetworkMonitor] ✓ Ping successful: ${latency}ms`);
      this.addPingMetric(latency);
    } catch (error) {
      console.error(
        `[NetworkMonitor] ✗ Ping failed (timeout/error): ${CONFIG.TIMEOUT}ms`,
        error instanceof Error ? error.message : String(error)
      );
      this.addPingMetric(CONFIG.TIMEOUT);
    }
  }

  private addPingMetric(latency: number) {
    // Add new latency
    this.pingMetrics.push(latency);

    // Log each ping's performance
    const sum = this.pingMetrics.reduce((a, b) => a + b, 0);
    const avg = sum / this.pingMetrics.length;

    console.log(
      `[NetworkMonitor] Ping #${this.pingMetrics.length}: ${latency}ms | ` +
        `Avg: ${Math.round(avg)}ms | ` +
        `Quality: ${this.currentQuality} | ` +
        `Samples: ${this.pingMetrics.length}/${CONFIG.MAX_PINGS}`
    );

    // Keep only last N metrics
    if (this.pingMetrics.length > CONFIG.MAX_PINGS) {
      const removed = this.pingMetrics.shift();
      console.log(`[NetworkMonitor] Dropped oldest ping: ${removed}ms`);
    }

    // Recalculate quality
    this.calculateQuality();
    this.emitStatusUpdate();
  }
  private calculateQuality(): void {
    // 1. Check if offline via NetInfo
    if (this.netInfoState && !this.netInfoState.isConnected) {
      this.updateQuality("offline");
      return;
    }

    // 2. Need minimum samples to make a judgement, otherwise assume "good"
    if (this.pingMetrics.length < CONFIG.MIN_SAMPLES) {
      // Keep optimistic 'good' or whatever previous non-offline state
      if (this.currentQuality === "offline") {
        this.updateQuality("good");
      }
      return;
    }

    // 3. Calculate average
    const sum = this.pingMetrics.reduce((a, b) => a + b, 0);
    const avg = sum / this.pingMetrics.length;

    // 4. Determine quality based on thresholds
    // If average > Poor Threshold -> Poor (or potentially offline if consistently failing)
    // If average > Good Threshold -> Poor
    // If average > Excellent Threshold -> Good
    // Else -> Excellent

    let newQuality: NetworkQuality = "excellent";

    if (avg > CONFIG.POOR_THRESHOLD) {
      // If it's REALLY bad (like timeouts), maybe we consider it poor or offline?
      // Spec says: "offline: No connection OR average latency > 2000ms"
      // But also "poor: Average latency 800-2000ms OR connection issues"
      // Let's stick to the Spec: > 2000ms is offline-ish, but let's be careful not to flicker 'offline'
      // if just slow. The spec says "offline: ... average latency > 2000ms"
      // Let's interpret strict adherence:
      if (avg > 2000) {
        newQuality = "offline";
      } else {
        newQuality = "poor";
      }
    } else if (avg > CONFIG.GOOD_THRESHOLD) {
      newQuality = "poor";
    } else if (avg > CONFIG.EXCELLENT_THRESHOLD) {
      newQuality = "good";
    } else {
      newQuality = "excellent";
    }

    this.updateQuality(newQuality);
  }

  private updateQuality(newQuality: NetworkQuality) {
    if (this.currentQuality !== newQuality) {
      const oldQuality = this.currentQuality;
      this.currentQuality = newQuality;

      console.log(
        `[NetworkMonitor] Quality changed: ${oldQuality} -> ${newQuality}`
      );

      this.emit("qualityChange", {
        from: oldQuality,
        to: newQuality,
        status: this.getStatus(),
      });

      // Emit specific events for online/offline
      if (newQuality === "offline") {
        this.emit("offline", { timestamp: Date.now() });
      } else if (oldQuality === "offline") {
        this.emit("online", { timestamp: Date.now() });
      }
    }
  }

  private handleNetworkStateChange(state: NetInfoState) {
    this.netInfoState = state;

    if (state.isConnected === false) {
      // Explicitly offline
      this.updateQuality("offline");
    } else {
      // Came online, if we were offline, metrics might be stale or empty
      if (this.currentQuality === "offline") {
        // Reset metrics if we were offline? Or keep them?
        // Maybe just resume pinging and let it correct itself.
        // But let's trigger an immediate ping
        this.performPing();
      }
    }

    this.emitStatusUpdate();
  }

  private emitStatusUpdate() {
    this.emit("statusUpdate", this.getStatus());
  }
}

// Export singleton
export const networkMonitor = new NetworkMonitor();
