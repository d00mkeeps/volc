// services/websocket/WebSocketService.ts
import EventEmitter from "eventemitter3";
import Toast from "react-native-toast-message";
import { getWsBaseUrl } from "../api/core/apiClient";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { authService } from "@/services/db/auth";

export type OnboardingCompleteCallback = (data: any) => void;
export type MessageCallback = (content: string) => void;
export type CompletionCallback = () => void;
export type TerminationCallback = (reason: string) => void;
export type ErrorCallback = (error: Error) => void;
export type StatusCallback = (statusText: string) => void;

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

export type RateLimitCallback = (data: {
  message: string;
  resetAt: string;
  remaining: number;
  code: string;
}) => void;

export type EndpointConfig = {
  type: "workout-analysis" | "workout-planning" | "onboarding";
  conversationId?: string;
};

export type WorkoutTemplateApprovedCallback = (templateData: any) => void;

/**
 * Persistent WebSocket service - maintains single active connection per endpoint
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private currentConnectionKey: string | null = null;
  private connectionState: ConnectionState = "disconnected";
  private events = new EventEmitter();

  // Timers
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Retry logic
  private retryAttempts = 0;
  private maxRetries = 3;
  private retryDelays = [1000, 3000, 5000]; // 1s, 3s, 5s

  // Activity tracking
  private lastActivity: number = Date.now();

  // Connection management
  private connecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private disconnectReason: string = "";
  private previousConnectionKey: string | null = null;
  private disconnectTimestamp: number = 0;

  onRateLimit(callback: RateLimitCallback): () => void {
    this.events.on("rateLimit", callback);
    return () => this.events.off("rateLimit", callback);
  }

  /**
   * Ensure connection to specified endpoint
   */
  async ensureConnection(endpointConfig?: EndpointConfig): Promise<void> {
    // Use session conversationId as fallback for workout-analysis
    const defaultConfig: EndpointConfig = {
      type: "workout-analysis",
      conversationId:
        useUserSessionStore.getState().activeConversationId || undefined,
    };

    const config = endpointConfig || defaultConfig;

    // Validate required fields
    if (config.type === "workout-analysis" && !config.conversationId) {
      throw new Error("conversationId required for workout-analysis endpoint");
    }

    //ai suggested below segment but i don't think it's necessary
    // if (config.type === "onboarding" && !config.userId) {
    //   throw new Error("userId required for onboarding endpoint");
    // }
    // Build connection key for comparison
    const connectionKey =
      config.type === "workout-planning"
        ? config.type
        : `${config.type}-${config.conversationId}`;

    console.log(`[WSService] ensureConnection called:`, {
      configType: config.type,
      conversationId: config.conversationId,
      connectionKey,
      currentConnectionKey: this.currentConnectionKey,
      connectionState: this.connectionState,
      isConnected: this.isConnected(),
      socketReadyState: this.socket?.readyState,
      connecting: this.connecting,
      timestamp: Date.now(),
    });

    // Return existing connection promise if connecting
    if (this.connecting && this.connectionPromise) {
      console.log(`[WSService] Connection in progress, waiting...`);
      return this.connectionPromise;
    }

    // Already connected to same endpoint
    if (this.currentConnectionKey === connectionKey && this.isConnected()) {
      console.log(`[WSService] Already connected to: ${connectionKey}`);
      this.resetInactivityTimer();
      return;
    }

    // Different endpoint - disconnect and reconnect
    if (this.currentConnectionKey !== connectionKey) {
      console.log(
        `[WSService] Switching endpoint: ${this.currentConnectionKey} → ${connectionKey}`
      );
      this.previousConnectionKey = this.currentConnectionKey;
      this.disconnectReason = "endpoint_switch";
      this.disconnect();
    }

    // Create connection promise with lock
    this.connecting = true;
    this.connectionPromise = this.connect(config).finally(() => {
      this.connecting = false;
      this.connectionPromise = null;
    });

    return this.connectionPromise;
  }

  /**
   * Send message on current connection
   */
  sendMessage(payload: any): void {
    if (!this.isConnected()) {
      throw new Error("Not connected - call ensureConnection() first");
    }

    this.socket!.send(JSON.stringify(payload));
    this.resetInactivityTimer();

    console.log(
      `[WSService] Sent ${
        JSON.stringify(payload).length
      } characters to endpoint: ${this.currentConnectionKey}`
    );
  }

  /**
   * Clean disconnect and cleanup
   */
  disconnect(): void {
    console.log(
      `[WSService] Disconnecting from endpoint: ${this.currentConnectionKey} (reason: ${this.disconnectReason})`
    );

    this.cleanup();
    this.setConnectionState("disconnected");
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Internal connection logic
   */
  private async connect(config: EndpointConfig): Promise<void> {
    this.cleanup();
    this.setConnectionState("connecting");

    const baseUrl = await getWsBaseUrl();

    const session = await authService.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("No authenticated user found for WebSocket connection");
    }
    // Build URL based on endpoint type
    let url: string;
    if (config.type === "workout-planning") {
      url = `${baseUrl}/workout-planning/${userId}`;
    } else if (config.type === "workout-analysis") {
      url = `${baseUrl}/workout-analysis/${config.conversationId}/${userId}`;
    } else if (config.type === "onboarding") {
      // ADD THIS CASE:
      url = `${baseUrl}/onboarding/${userId}`;
    } else {
      throw new Error(`Unknown endpoint type: ${config.type}`);
    }

    const connectionKey =
      config.type === "workout-planning"
        ? config.type
        : config.type === "onboarding"
        ? config.type // ADD THIS - just use type like workout-planning
        : `${config.type}-${config.conversationId}`;

    console.log(`[WSService] Connecting to: ${url}`);
    this.socket = new WebSocket(url);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);

      this.socket!.onopen = () => {
        clearTimeout(timeout);

        // ONLY update currentConnectionKey after successful connection
        this.currentConnectionKey = connectionKey;
        this.previousConnectionKey = null; // Clear the previous key

        this.setConnectionState("connected");
        this.retryAttempts = 0; // Reset retry counter on successful connection
        this.resetInactivityTimer();

        console.log(`[WSService] Connected to endpoint: ${connectionKey}`);
        resolve();
      };

      this.socket!.onclose = (event) => {
        clearTimeout(timeout);
        this.disconnectTimestamp = Date.now();

        // DETAILED DISCONNECT LOGGING
        console.log(`[WSService] Connection closed:`, {
          code: event.code,
          wasClean: event.wasClean,
          reason: event.reason,
          disconnectReason: this.disconnectReason,
          currentConnectionKey: this.currentConnectionKey,
          previousConnectionKey: this.previousConnectionKey,
          timeSinceLastDisconnect:
            this.disconnectTimestamp - (this.disconnectTimestamp || 0),
        });

        this.handleDisconnect();

        // Only reject on abnormal closures that weren't intentional
        if (
          event.code !== 1000 &&
          !event.wasClean &&
          this.disconnectReason !== "endpoint_switch"
        ) {
          reject(new Error(`Connection closed abnormally: ${event.code}`));
        }
      };

      this.socket!.onerror = (error) => {
        clearTimeout(timeout);
        console.error("[WSService] Connection error:", error);
        reject(new Error("WebSocket connection error"));
      };

      this.socket!.onmessage = (event) => {
        this.handleMessage(event);
      };
    });
  }

  /**
   * Auto-reconnect on unexpected disconnect
   */
  private scheduleReconnect(): void {
    if (this.retryAttempts >= this.maxRetries) {
      console.error("[WSService] Max reconnection attempts reached");
      this.setConnectionState("disconnected");
      this.currentConnectionKey = null; // Clear on max retries

      Toast.show({
        type: "error",
        text1: "Connection Failed",
        text2: "Unable to reconnect to chat service",
        visibilityTime: 5000,
      });
      return;
    }

    const delay = this.retryDelays[this.retryAttempts];
    this.retryAttempts++;
    this.setConnectionState("reconnecting");

    console.log(
      `[WSService] Scheduling reconnect in ${delay}ms (attempt ${this.retryAttempts}/${this.maxRetries})`
    );

    Toast.show({
      type: "info",
      text1: "Reconnecting...",
      text2: `Attempt ${this.retryAttempts}/${this.maxRetries}`,
      visibilityTime: 3000,
    });

    this.reconnectTimer = setTimeout(async () => {
      try {
        const currentConnectionKey = this.currentConnectionKey;
        if (currentConnectionKey) {
          // Parse the connection key to rebuild config
          // Parse the connection key to rebuild config
          let config: EndpointConfig;
          if (currentConnectionKey === "workout-planning") {
            config = { type: "workout-planning" };
          } else if (currentConnectionKey === "onboarding") {
            // ADD THIS CASE:
            config = { type: "onboarding" };
          } else if (currentConnectionKey.startsWith("workout-analysis-")) {
            const conversationId = currentConnectionKey.replace(
              "workout-analysis-",
              ""
            );
            config = { type: "workout-analysis", conversationId };
          } else {
            throw new Error(
              `Unable to parse connection key: ${currentConnectionKey}`
            );
          }

          this.connecting = true;
          this.connectionPromise = this.connect(config).finally(() => {
            this.connecting = false;
            this.connectionPromise = null;
          });
          await this.connectionPromise;
        }
      } catch (error) {
        console.error("[WSService] Reconnection failed:", error);
        this.scheduleReconnect(); // Try again
      }
    }, delay);
  }

  /**
   * Reset 5-minute inactivity timer
   */
  private resetInactivityTimer(): void {
    this.lastActivity = Date.now();

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Handle 5-minute inactivity timeout
   */
  private handleInactivity(): void {
    console.log("[WSService] Inactivity timeout reached - disconnecting");

    Toast.show({
      type: "info",
      text1: "Chat Disconnected",
      text2: "Disconnected due to inactivity",
      visibilityTime: 3000,
    });

    this.disconnectReason = "inactivity";
    this.disconnect();
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    this.resetInactivityTimer(); // Reset timer on any message received

    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "content":
          if (message.data) {
            this.events.emit("message", message.data);
          }
          break;
        case "workout_template_approved":
          console.log("[WSService] Workout template approved:", message.data);
          this.events.emit("workoutTemplateApproved", message.data);
          break;
        case "complete":
          this.events.emit("complete");
          break;

        case "onboarding_complete":
          console.log("[WSService] Onboarding complete:", message.data);
          this.events.emit("onboardingComplete", message.data);
          break;

        case "done": // Keep for backward compatibility
          this.events.emit("complete");
          console.log(
            "[WSService] deprecated [done] message detected.. fix asap"
          );
          break;

        case "status": // ← ADD THIS CASE
          if (message.data) {
            this.events.emit("status", message.data);
          }
          break;

        case "error":
          console.error("[WSService] Server error:", message);

          // Check if this is a rate limit error
          if (message.data?.code === "rate_limit") {
            console.warn("[WSService] Rate limit exceeded:", message.data);

            Toast.show({
              type: "error",
              text1: "Too Many Messages",
              text2: message.data.message || "Please slow down your messaging.",
              visibilityTime: 6000,
            });

            this.events.emit("rateLimit", {
              message: message.data.message,
              resetAt: message.data.reset_at,
              remaining: message.data.remaining || 0,
              code: message.data.code,
            });
          } else {
            // Handle other server errors
            const errorMessage =
              message.data?.message || message.error || "Server error";
            console.error("[WSService] Generic server error:", errorMessage);

            Toast.show({
              type: "error",
              text1: "Connection Error",
              text2: errorMessage,
              visibilityTime: 4000,
            });

            this.events.emit("error", new Error(errorMessage));
          }
          break;

        case "connection_status":
          console.log("[WSService] Connection status:", message.data);
          break;

        case "heartbeat_ack":
          console.log("[WSService] Heartbeat acknowledged");
          break;

        default:
          console.warn("[WSService] Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("[WSService] Failed to parse message:", error);
      this.events.emit("error", new Error("Failed to parse WebSocket message"));
    }
  }

  /**
   * Set disconnect reason (call before disconnect() for intentional disconnects)
   */
  setDisconnectReason(reason: string): void {
    this.disconnectReason = reason;
  }

  /**
   * Handle connection disconnect
   */
  private handleDisconnect(): void {
    this.setConnectionState("disconnected");

    // Check disconnect reasons
    const wasEndpointSwitch =
      this.disconnectReason === "endpoint_switch" &&
      this.previousConnectionKey !== null;

    const wasInactivityDisconnect = this.disconnectReason === "inactivity";

    // ✅ ADD: Check for user-initiated disconnect
    const wasUserInitiated = this.disconnectReason === "user_initiated";

    const shouldReconnect =
      !wasEndpointSwitch &&
      !wasInactivityDisconnect &&
      !wasUserInitiated && // ✅ Don't reconnect on user-initiated disconnect
      this.currentConnectionKey &&
      this.retryAttempts < this.maxRetries;

    // DETAILED RECONNECTION DECISION LOGGING
    console.log(`[WSService] Disconnect analysis:`, {
      disconnectReason: this.disconnectReason,
      wasEndpointSwitch,
      wasInactivityDisconnect,
      wasUserInitiated, // ✅ ADD to logs
      currentConnectionKey: this.currentConnectionKey,
      previousConnectionKey: this.previousConnectionKey,
      retryAttempts: this.retryAttempts,
      maxRetries: this.maxRetries,
      shouldReconnect,
      decision: shouldReconnect ? "RECONNECTING" : "NOT_RECONNECTING",
    });

    if (shouldReconnect) {
      console.log("[WSService] Unexpected disconnect - scheduling reconnect");
      this.scheduleReconnect();
    } else {
      console.log(
        `[WSService] ${
          wasEndpointSwitch
            ? "Intentional"
            : wasInactivityDisconnect
            ? "Inactivity"
            : wasUserInitiated
            ? "User-initiated" // ✅ ADD to log message
            : "Normal"
        } disconnect - not reconnecting`
      );

      // Clear connection key on intentional disconnects
      if (wasEndpointSwitch || wasInactivityDisconnect || wasUserInitiated) {
        this.currentConnectionKey = null;
      }
    }

    // Reset disconnect reason and previous connection
    this.disconnectReason = "";
    this.previousConnectionKey = null;
  }

  /**
   * Set connection state and emit events if needed
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      console.log(`[WSService] State changed: ${state}`);
    }
  }

  /**
   * Clean up all timers and connections
   */
  private cleanup(): void {
    // Clear timers
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close socket
    if (this.socket) {
      this.socket.close(1000, "Normal closure");
      this.socket = null;
    }

    // Don't clear event listeners - they're managed by components
  }

  // PUBLIC EVENT REGISTRATION

  /**
   * Register onboarding complete handler
   */
  onOnboardingComplete(callback: OnboardingCompleteCallback): () => void {
    this.events.on("onboardingComplete", callback);
    return () => this.events.off("onboardingComplete", callback);
  }

  /**
   * Register message content handler
   */
  onMessage(callback: MessageCallback): () => void {
    this.events.on("message", callback);
    return () => this.events.off("message", callback);
  }

  /**
   * Register completion handler
   */
  onComplete(callback: CompletionCallback): () => void {
    this.events.on("complete", callback);
    return () => this.events.off("complete", callback);
  }

  /**
   * Register termination handler
   */
  onTerminated(callback: TerminationCallback): () => void {
    this.events.on("terminated", callback);
    return () => this.events.off("terminated", callback);
  }

  /**
   * Register error handler
   */
  onError(callback: ErrorCallback): () => void {
    this.events.on("error", callback);
    return () => this.events.off("error", callback);
  }

  onWorkoutTemplateApproved(
    callback: WorkoutTemplateApprovedCallback
  ): () => void {
    this.events.on("workoutTemplateApproved", callback);
    return () => this.events.off("workoutTemplateApproved", callback);
  }

  /**
   * Register status update handler
   */
  onStatus(callback: StatusCallback): () => void {
    this.events.on("status", callback);
    return () => this.events.off("status", callback);
  }

  /**
   * Remove all event listeners (for cleanup)
   */
  removeAllListeners(): void {
    this.events.removeAllListeners();
  }
}

// Singleton instance
let webSocketServiceInstance: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService();
  }
  return webSocketServiceInstance;
};

export const cleanup = (): void => {
  if (webSocketServiceInstance) {
    webSocketServiceInstance.disconnect();
    webSocketServiceInstance.removeAllListeners();
    webSocketServiceInstance = null;
  }
};
