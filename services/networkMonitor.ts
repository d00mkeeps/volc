import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import EventEmitter from "eventemitter3";

const CONFIG = {
  PING_URL: "https://www.cloudflare.com/cdn-cgi/trace",
  PING_INTERVAL: 1000,
  TIMEOUT: 5000,
};

class NetworkMonitor extends EventEmitter {
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isMonitoring: boolean = false;

  constructor() {
    super();
    this.initializeNetInfo();
    this.startMonitoring();
  }

  private async initializeNetInfo() {
    NetInfo.addEventListener((state) => {
      this.emit("netinfo", { isConnected: state.isConnected ?? false });
    });

    const state = await NetInfo.fetch();
    this.emit("netinfo", { isConnected: state.isConnected ?? false });
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log("[NetworkMonitor] Starting network monitoring...");

    this.performPing();
    this.pingInterval = setInterval(() => {
      this.performPing();
    }, CONFIG.PING_INTERVAL);
  }

  public stopMonitoring(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.isMonitoring = false;
    console.log("[NetworkMonitor] Stopped network monitoring");
  }

  private async performPing(): Promise<void> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

      await fetch(CONFIG.PING_URL, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latency = Date.now() - start;
      this.emit("ping", { latency, success: true, timestamp: Date.now() });
    } catch (error) {
      this.emit("ping", {
        latency: CONFIG.TIMEOUT,
        success: false,
        timestamp: Date.now(),
      });
    }
  }
}

export const networkMonitor = new NetworkMonitor();
