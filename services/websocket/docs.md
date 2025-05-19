/\*\*

- WebSocketService - Simplified WebSocket service for chat messaging
-
- This service handles WebSocket connections specifically for chat message streaming.
- It provides a clean interface for:
- - Connecting to chat conversations
- - Sending messages
- - Receiving streamed responses
- - Monitoring connection state
-
- Non-chat functionality (analysis, data visualization, etc.) has been moved to HTTP endpoints.
  \*/
  export class WebSocketService {
  /\*\*
  - Connect to a specific conversation
  - @param configName The chat configuration type
  - @param conversationId The conversation identifier
  - @param messages Optional array of messages to initialize the conversation
    \*/
    public async connect(configName: ChatConfigName, conversationId: string, messages?: Message[]): Promise<void>;

/\*\*

- Disconnect from the current conversation
  \*/
  public disconnect(): void;

/\*\*

- Send a message to the current conversation
- @param content The message content
  \*/
  public sendMessage(content: string): void;

/\*\*

- Register a callback for message content chunks
- @param callback Function to call with each content chunk
- @returns Function to unregister the callback
  \*/
  public onMessage(callback: MessageCallback): () => void;

/\*\*

- Register a callback for message completion events
- @param callback Function to call when a message is complete
- @returns Function to unregister the callback
  \*/
  public onComplete(callback: CompletionCallback): () => void;

/\*\*

- Register a callback for connection state changes
- @param callback Function to call when connection state changes
- @returns Function to unregister the callback
  \*/
  public onConnectionStateChange(callback: ConnectionStateChange): () => void;

/\*\*

- Get the current connection state
- @returns The connection state
  \*/
  public getConnectionState(): ConnectionState;

/\*\*

- Check if currently connected
- @returns True if connected, false otherwise
  \*/
  public isConnected(): boolean;

/\*\*

- Get information about the current connection
- @returns Connection information or null if not connected
  \*/
  public getCurrentConnectionInfo(): { configName: ChatConfigName, conversationId: string } | null;
  }
