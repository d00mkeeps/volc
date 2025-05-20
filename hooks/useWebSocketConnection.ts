// // hooks/useWebSocketConnection.ts
// import { useEffect, useRef, useState, useCallback } from 'react';
// import { WebSocketService } from '@/services/websocket/WebSocketService';
// import { Message, ChatConfigName } from '@/types';

// // Type for the connection state
// interface ConnectionState {
//   status: 'disconnected' | 'connecting' | 'connected' | 'error';
//   error: Error | null;
// }

// export function useWebSocketConnection() {
//   // Create WebSocketService instance (non-singleton)
//   const webSocketRef = useRef<WebSocketService | null>(null);
//   const [connectionState, setConnectionState] = useState<ConnectionState>({
//     status: 'disconnected',
//     error: null
//   });
  
//   // Get or create WebSocketService
//   const getWebSocket = useCallback(() => {
//     if (!webSocketRef.current) {
//       webSocketRef.current = new WebSocketService();
//       webSocketRef.current.initialize();
      
//       // Set up connection state handling
//       webSocketRef.current.onConnectionStateChange((state) => {
//         setConnectionState({
//           status: state,
//           error: state === 'error' ? new Error('WebSocket connection error') : null
//         });
//       });
//     }
//     return webSocketRef.current;
//   }, []);
  
//   // Connect to WebSocket
//   const connect = useCallback(async (
//     configName: ChatConfigName,
//     conversationId: string,
//     messages?: Message[]
//   ) => {
//     try {
//       setConnectionState({ status: 'connecting', error: null });
//       const webSocket = getWebSocket();
//       await webSocket.connect(configName, conversationId, messages);
//       return true;
//     } catch (error) {
//       setConnectionState({
//         status: 'error',
//         error: error instanceof Error ? error : new Error(String(error))
//       });
//       return false;
//     }
//   }, [getWebSocket]);
  
//   // Disconnect from WebSocket
//   const disconnect = useCallback(() => {
//     if (webSocketRef.current) {
//       webSocketRef.current.disconnect();
//     }
//   }, []);
  
//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       disconnect();
//     };
//   }, [disconnect]);
  
//   // Send message through WebSocket
//   const sendMessage = useCallback((
//     content: string | object
//   ) => {
//     const webSocket = getWebSocket();
    
//     if (!webSocket.isConnected()) {
//       throw new Error('Cannot send message: not connected');
//     }
    
//     webSocket.sendMessage(content);
//   }, [getWebSocket]);
  
//   return {
//     connect,
//     disconnect,
//     sendMessage,
//     connectionState,
//     isConnected: connectionState.status === 'connected'
//   };
// }