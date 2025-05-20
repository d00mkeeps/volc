// import { WebSocketMessage } from '@/types/websocket';
// import { MessageContextHandlers, DataContextHandlers } from './GlobalWebsocketService';

// class HandlerManager {
//   private static instance: HandlerManager;
  
//   private messageHandlers: Map<string, MessageContextHandlers> = new Map();
//   private dataHandlers: Map<string, DataContextHandlers> = new Map();
//   private lastRegistrationTime: Record<string, number> = {};
  
//   private constructor() {
//     console.log('HandlerManager: Singleton instance created');
//   }
  
//   public static getInstance(): HandlerManager {
//     if (!HandlerManager.instance) {
//       HandlerManager.instance = new HandlerManager();
//     }
//     return HandlerManager.instance;
//   }
  
//   /**
//    * Register message handlers for a specific context ID
//    * @param contextId Unique identifier for the context (typically conversation ID)
//    * @param handlers The message handler functions
//    */
//   public setMessageHandlers(contextId: string, handlers: MessageContextHandlers): void {
//     const timestamp = Date.now();
//     this.messageHandlers.set(contextId, handlers);
//     this.lastRegistrationTime[`message_${contextId}`] = timestamp;
    
//     console.log(`HandlerManager: Registering message handlers for context ${contextId}`);
//   }
  
//   /**
//    * Register data handlers for a specific context ID
//    * @param contextId Unique identifier for the context (typically conversation ID)
//    * @param handlers The data handler functions
//    */
//   public setDataHandlers(contextId: string, handlers: DataContextHandlers): void {
//     const timestamp = Date.now();
//     this.dataHandlers.set(contextId, handlers);
//     this.lastRegistrationTime[`data_${contextId}`] = timestamp;
    
//     console.log(`HandlerManager: Registering data handlers for context ${contextId}`);
//   }
  
//   /**
//    * Clear handlers for a specific context
//    * @param contextId Unique identifier for the context to clear
//    */
//   public clearHandlers(contextId: string): void {
//     this.messageHandlers.delete(contextId);
//     this.dataHandlers.delete(contextId);
//     delete this.lastRegistrationTime[`message_${contextId}`];
//     delete this.lastRegistrationTime[`data_${contextId}`];
    
//     console.log(`HandlerManager: Cleared handlers for context ${contextId}`);
//   }
  
//   /**
//    * Central handler for all WebSocket messages
//    * Routes messages to appropriate handlers based on type
//    */
//   public handleWebSocketMessage(message: WebSocketMessage): void {
//     try {
//       if (!message || typeof message !== 'object') {
//         console.error('HandlerManager: Invalid message format:', message);
//         return;
//       }

//       // Get all registered handler sets
//       const messageHandlerSets = Array.from(this.messageHandlers.values());
//       const dataHandlerSets = Array.from(this.dataHandlers.values());
      
//       if (messageHandlerSets.length === 0 && dataHandlerSets.length === 0) {
//         console.warn('HandlerManager: No handlers registered for message:', message.type);
//         return;
//       }

//       switch (message.type) {
//         case 'content':
//           if (typeof message.data === 'string') {
//             messageHandlerSets.forEach(handlers => {
//               handlers.handleContent(message.data as string);
              
//               // Empty content indicates loading done
//               if (message.data === '') {
//                 handlers.handleLoadingDone();
//               }
//             });
//           }
//           break;
          
//         case 'loading_start':
//           messageHandlerSets.forEach(handlers => handlers.handleLoadingStart());
//           break;
          
//         case 'done':
//           messageHandlerSets.forEach(handlers => {
//             handlers.handleStreamDone();
//             handlers.handleLoadingDone();
//           });
//           break;
          
//         case 'error':
//           console.error('HandlerManager: WebSocket error:', message.error);
//           messageHandlerSets.forEach(handlers => handlers.handleLoadingDone());
//           break;

//           case 'workout_data_bundle':
//             // Route workout data bundles to data handlers
//             dataHandlerSets.forEach(handlers => 
//               handlers.handleSignal('workout_data_bundle', message.data));
//             break;
          
//         case 'signal':
//           // Type safety for signal data
//           if (message.data && typeof message.data === 'object' && 
//               'type' in message.data && 'data' in message.data) {
            
//             const signalType = message.data.type as string;
//             const signalData = message.data.data;
            
//             // Route signals based on type prefix
//             if (signalType.startsWith('workout_') || 
//                 signalType === 'graph_data' || 
//                 signalType === 'analytics') {
//               dataHandlerSets.forEach(handlers => 
//                 handlers.handleSignal(signalType, signalData));
//             } 
//             else if (signalType.startsWith('message_') || 
//                     signalType === 'typing_indicator') {
//               messageHandlerSets.forEach(handlers => 
//                 handlers.handleSignal(signalType, signalData));
//             }
//             else {
//               // Generic signals for both contexts
//               messageHandlerSets.forEach(handlers => 
//                 handlers.handleSignal(signalType, signalData));
//               dataHandlerSets.forEach(handlers => 
//                 handlers.handleSignal(signalType, signalData));
//             }
//           }
//           break;
          
//         default:
//           console.log('HandlerManager: Unhandled message type:', message.type);
//       }
//     } catch (error) {
//       console.error('HandlerManager: Error processing WebSocket message:', error);
//       // Try to at least stop loading indicators
//       this.messageHandlers.forEach(handlers => handlers.handleLoadingDone());
//     }
//   }
  
//   /**
//    * Get diagnostic information about registered handlers
//    */
//   public getHandlerStats(): Record<string, any> {
//     return {
//       messageHandlerCount: this.messageHandlers.size,
//       dataHandlerCount: this.dataHandlers.size,
//       registrationTimes: this.lastRegistrationTime,
//       messageHandlerContexts: Array.from(this.messageHandlers.keys()),
//       dataHandlerContexts: Array.from(this.dataHandlers.keys())
//     };
//   }
// }

// // Export singleton instance
// export const handlerManager = HandlerManager.getInstance();