// services/websocket/WebSocketService.ts
import EventEmitter from "eventemitter3";
import Toast from "react-native-toast-message";
import { getWsBaseUrl } from "../api/core/apiClient";
import { useUserSessionStore } from "@/stores/userSessionStore";

export type MessageCallback = (content: string) => void;
export type CompletionCallback = () => void;
export type TerminationCallback = (reason: string) => void;
export type ErrorCallback = (error: Error) => void;

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

/**
 * Persistent WebSocket service - maintains single active connection per conversation
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private currentConversationId: string | null = null;
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

  /**
   * Ensure connection to current conversation from session store
   */
  async ensureConnection(): Promise<void> {
    const sessionConversationId =
      useUserSessionStore.getState().activeConversationId;

    if (!sessionConversationId) {
      throw new Error("No active conversation in session");
    }

    // Already connected to same conversation
    if (
      this.currentConversationId === sessionConversationId &&
      this.isConnected()
    ) {
      this.resetInactivityTimer();
      return;
    }

    // Different conversation - disconnect and reconnect
    if (this.currentConversationId !== sessionConversationId) {
      console.log(
        `[WebSocket] Switching conversation: ${this.currentConversationId} → ${sessionConversationId}`
      );
      this.disconnect();
    }

    await this.connect(sessionConversationId);
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
      `[WebSocket] Sent ${
        JSON.stringify(payload).length
      } characters to conversation: ${this.currentConversationId}`
    );
  }

  /**
   * Clean disconnect and cleanup
   */
  disconnect(): void {
    console.log(
      `[WebSocket] Disconnecting from conversation: ${this.currentConversationId}`
    );

    this.cleanup();
    this.currentConversationId = null;
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

  // PRIVATE METHODS

  /**
   * Internal connection logic
   */
  private async connect(conversationId: string): Promise<void> {
    this.cleanup();
    this.setConnectionState("connecting");
    this.currentConversationId = conversationId;

    const baseUrl = await getWsBaseUrl();
    const configName = "workout-analysis"; // Could be dynamic later
    const url = `${baseUrl}/${configName}/${conversationId}`;

    this.socket = new WebSocket(url);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);

      this.socket!.onopen = () => {
        clearTimeout(timeout);
        this.setConnectionState("connected");
        this.retryAttempts = 0; // Reset retry counter on successful connection
        this.resetInactivityTimer();

        console.log(`[WebSocket] Connected to conversation: ${conversationId}`);
        resolve();
      };

      this.socket!.onclose = (event) => {
        clearTimeout(timeout);
        console.log(
          `[WebSocket] Connection closed - code: ${event.code}, clean: ${event.wasClean}`
        );

        this.handleDisconnect();

        if (!event.wasClean) {
          reject(new Error(`Connection closed: ${event.code}`));
        }
      };

      this.socket!.onerror = (error) => {
        clearTimeout(timeout);
        console.error("[WebSocket] Connection error:", error);
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
      console.error("[WebSocket] Max reconnection attempts reached");
      this.setConnectionState("disconnected");

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
      `[WebSocket] Scheduling reconnect in ${delay}ms (attempt ${this.retryAttempts}/${this.maxRetries})`
    );

    Toast.show({
      type: "info",
      text1: "Reconnecting...",
      text2: `Attempt ${this.retryAttempts}/${this.maxRetries}`,
      visibilityTime: 3000,
    });

    this.reconnectTimer = setTimeout(async () => {
      try {
        const currentConversationId = this.currentConversationId;
        if (currentConversationId) {
          await this.connect(currentConversationId);
        }
      } catch (error) {
        console.error("[WebSocket] Reconnection failed:", error);
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
    console.log("[WebSocket] Inactivity timeout reached - disconnecting");

    Toast.show({
      type: "info",
      text1: "Chat Disconnected",
      text2: "Disconnected due to inactivity",
      visibilityTime: 3000,
    });

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

        case "done":
          this.events.emit("complete");
          break;

        case "error":
          console.error("[WebSocket] Server error:", message.error);
          this.events.emit("error", new Error(message.error || "Server error"));
          break;

        case "connection_status":
          console.log("[WebSocket] Connection status:", message.data);
          break;

        case "heartbeat_ack":
          // Handle heartbeat acknowledgment (future use)
          console.log("[WebSocket] Heartbeat acknowledged");
          break;

        default:
          console.warn("[WebSocket] Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("[WebSocket] Failed to parse message:", error);
      this.events.emit("error", new Error("Failed to parse WebSocket message"));
    }
  }

  /**
   * Handle connection disconnect
   */
  private handleDisconnect(): void {
    this.setConnectionState("disconnected");

    // Only auto-reconnect if we still have an active conversation and it wasn't a clean disconnect
    const currentSessionConversationId =
      useUserSessionStore.getState().activeConversationId;

    if (
      this.currentConversationId &&
      this.currentConversationId === currentSessionConversationId &&
      this.retryAttempts < this.maxRetries
    ) {
      console.log("[WebSocket] Unexpected disconnect - scheduling reconnect");
      this.scheduleReconnect();
    } else {
      console.log("[WebSocket] Normal disconnect - not reconnecting");
    }
  }

  /**
   * Set connection state and emit events if needed
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      console.log(`[WebSocket] State changed: ${state}`);
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
