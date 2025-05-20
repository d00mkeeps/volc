// // MessageContext.tsx
// import { ChatConfigKey } from "@/constants/ChatConfigMaps";
// import { LLMService } from "@/services/llm/base";
// import { authService } from "@/services/db/auth";
// import { ConversationService } from "@/services/db/conversation";
// import {
//   getWebSocketService,
//   resolveConfig,
//   registerContextHandlers,
//   unregisterContextHandlers,
// } from "@/services/websocket/GlobalWebsocketService";
// import { Message } from "@/types";
// import { createInitialConnectionState, MessageHandler } from "@/types/core";
// import { ConnectionState } from "@/types/states";
// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { getSignalService } from "@/services/websocket/SignalService";
// import { MessageContextHandlers } from "@/services/websocket/GlobalWebsocketService";

// interface MessageContextType {
//   messages: Message[];
//   streamingMessage: Message | null;
//   connectionState: ConnectionState;
//   startNewConversation: (
//     firstMessage: string,
//     configName: ChatConfigKey
//   ) => Promise<string>;
//   sendMessage: (
//     content: string,
//     options?: { detailedAnalysis?: boolean }
//   ) => Promise<void>;
//   loadConversation: (conversationId: string) => Promise<void>;
//   currentConversationId: string | null;
//   registerMessageHandler: (handler: MessageHandler | null) => void;
//   showLoader: boolean;
//   didMessageRequestGraph: (messageId: string) => boolean;
//   getConversationConfig: (conversationId: string) => ChatConfigKey;
// }

// const MessageContext = createContext<MessageContextType | null>(null);

// export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [streamingMessage, setStreamingMessage] = useState<Message | null>(
//     null
//   );
//   const [connectionState, setConnectionState] = useState<ConnectionState>(
//     createInitialConnectionState()
//   );
//   const [currentConversationId, setCurrentConversationId] = useState<
//     string | null
//   >(null);
//   const accumulatedMessageRef = useRef<string>("");
//   const [showLoader, setShowLoader] = useState(false);
//   const conversationService = useMemo(() => new ConversationService(), []);
//   const webSocket = useMemo(() => getWebSocketService(), []);
//   const messageHandlerRef = useRef<MessageHandler | null>(null);
//   const [messagesRequestingGraphs, setMessagesRequestingGraphs] = useState<
//     Set<string>
//   >(new Set());
//   const [conversationConfigMap, setConversationConfigMap] = useState<
//     Record<string, ChatConfigKey>
//   >({});
//   const signalService = useMemo(() => getSignalService(), []);

//   const clearGraphRequest = useCallback((messageId: string) => {
//     setMessagesRequestingGraphs((prev) => {
//       const updated = new Set(prev);
//       updated.delete(messageId);
//       return updated;
//     });
//   }, []);

//   // Handler methods for GlobalWebSocketService
//   const handleContent = useCallback(
//     (content: string) => {
//       if (!currentConversationId) return;

//       // Update accumulated message ref
//       accumulatedMessageRef.current += content;

//       // Update streaming message state
//       setStreamingMessage({
//         id: "streaming",
//         conversation_id: currentConversationId,
//         content: accumulatedMessageRef.current,
//         sender: "assistant",
//         conversation_sequence:
//           (messages[messages.length - 1]?.conversation_sequence || 0) + 1,
//         timestamp: new Date(),
//       });
//     },
//     [currentConversationId, messages]
//   );

//   const handleLoadingStart = useCallback(() => {
//     setShowLoader(true);
//     console.log("MessageContext: Loading started");
//   }, []);

//   const handleLoadingDone = useCallback(() => {
//     setShowLoader(false);
//     console.log("MessageContext: Loading finished");
//   }, []);

//   const handleStreamDone = useCallback(async () => {
//     console.log("MessageContext: Stream completed");
//     if (!currentConversationId) return;

//     // Save final message to database
//     const finalMessage = await conversationService.saveMessage({
//       conversationId: currentConversationId,
//       content: accumulatedMessageRef.current,
//       sender: "assistant",
//     });

//     // Update state
//     setMessages((prev) => [...prev, finalMessage]);
//     setStreamingMessage(null);
//     accumulatedMessageRef.current = "";
//     setConnectionState((prev) => ({
//       ...prev,
//       type: "CONNECTED",
//       canSendMessage: true,
//     }));
//   }, [currentConversationId, conversationService]);

//   const handleSignal = useCallback(
//     (type: string, data: any) => {
//       console.log("MessageContext: Received signal:", type);

//       // Process special signals
//       if (type === "workout_data_bundle" && data?.original_query) {
//         messages.forEach((msg) => {
//           if (
//             msg.sender === "user" &&
//             messagesRequestingGraphs.has(msg.id) &&
//             msg.content.includes(data.original_query)
//           ) {
//             clearGraphRequest(msg.id);
//           }
//         });
//       }

//       // For backward compatibility during migration
//       if (messageHandlerRef.current) {
//         messageHandlerRef.current(type, data);
//       }

//       // Emit signal to the SignalService for other components to use
//       if (currentConversationId) {
//         signalService.emitSignal(currentConversationId, type, data);
//       }
//     },
//     [
//       messages,
//       messagesRequestingGraphs,
//       clearGraphRequest,
//       currentConversationId,
//       signalService,
//     ]
//   );

//   // Create stable handler references that won't change with re-renders
//   const handlersRef = useRef<MessageContextHandlers | null>(null);

//   // Update handlers ref when one of the handlers changes
//   useEffect(() => {
//     handlersRef.current = {
//       handleContent,
//       handleLoadingStart,
//       handleLoadingDone,
//       handleStreamDone,
//       handleSignal,
//     };

//     console.log("MessageContext: Updated handlers reference");
//   }, [
//     handleContent,
//     handleLoadingStart,
//     handleLoadingDone,
//     handleStreamDone,
//     handleSignal,
//   ]);

//   // Register handlers with

//   // Register handlers with GlobalWebSocketService only when conversation changes
//   useEffect(() => {
//     if (!currentConversationId || !handlersRef.current) return;

//     console.log(
//       "MessageContext: Registering handlers once for conversation",
//       currentConversationId
//     );

//     registerContextHandlers(currentConversationId, handlersRef.current, null);

//     return () => {
//       console.log(
//         `MessageContext: Unregistering handlers for conversation ${currentConversationId}`
//       );
//       if (currentConversationId) {
//         unregisterContextHandlers(currentConversationId);
//       }
//     };
//   }, [currentConversationId]); // Only depends on conversation ID

//   const getConversationConfig = useCallback(
//     (conversationId: string): ChatConfigKey => {
//       return conversationConfigMap[conversationId] || "default";
//     },
//     [conversationConfigMap]
//   );

//   const registerMessageHandler = useCallback(
//     (handler: MessageHandler | null) => {
//       messageHandlerRef.current = handler;
//     },
//     []
//   );

//   const loadConversation = useCallback(
//     async (conversationId: string) => {
//       try {
//         setMessages([]);
//         setStreamingMessage(null);

//         const config = await resolveConfig(conversationId);
//         const messages = await conversationService.getConversationMessages(
//           conversationId
//         );

//         setMessages(messages);
//         setCurrentConversationId(conversationId);
//         setConversationConfigMap((prev) => ({
//           ...prev,
//           [conversationId]: config as ChatConfigKey,
//         }));

//         await webSocket.connect(config, conversationId, messages);
//       } catch (error) {
//         console.error("Error loading conversation:", error);
//         setConnectionState((prev) => ({
//           ...prev,
//           type: "ERROR",
//           error: error as Error,
//         }));
//       }
//     },
//     [conversationService, webSocket]
//   );

//   const startNewConversation = useCallback(
//     async (
//       firstMessage: string,
//       configName: ChatConfigKey
//     ): Promise<string> => {
//       const session = await authService.getSession();
//       if (!session?.user?.id) {
//         throw new Error("No authenticated user found");
//       }

//       if (!connectionState.canConnect) {
//         throw new Error("Cannot connect to create conversation");
//       }

//       try {
//         console.log("🏁 Starting new conversation:", {
//           firstMessage,
//           configName,
//         });

//         const llmService = new LLMService();
//         const title = await llmService.generateTitle(firstMessage);

//         const conversation = await conversationService.createConversation({
//           userId: session.user.id,
//           title,
//           firstMessage,
//           configName, // Use the passed in config
//         });

//         setCurrentConversationId(conversation.id);
//         setMessages([]);
//         await loadConversation(conversation.id);

//         return conversation.id;
//       } catch (error) {
//         console.error("❌ Failed to start conversation:", error);
//         setConnectionState((prev) => ({
//           ...prev,
//           type: "ERROR",
//           error: error as Error,
//         }));
//         throw error;
//       }
//     },
//     [connectionState.canConnect, conversationService, loadConversation]
//   );

//   const sendMessage = useCallback(
//     async (content: string, options?: { detailedAnalysis?: boolean }) => {
//       if (!currentConversationId || !connectionState.canSendMessage) {
//         return;
//       }

//       try {
//         setShowLoader(true);
//         const newMessage = await conversationService.saveMessage({
//           conversationId: currentConversationId,
//           content,
//           sender: "user",
//         });

//         // Track if this message requested a graph
//         if (options?.detailedAnalysis) {
//           setMessagesRequestingGraphs((prev) => {
//             const updated = new Set(prev);
//             updated.add(newMessage.id);
//             return updated;
//           });
//         }

//         setMessages((prev) => [...prev, newMessage]);
//         await webSocket.sendMessage({
//           message: content,
//           generate_graph: options?.detailedAnalysis,
//         });
//       } catch (error) {
//         setShowLoader(false);
//         console.error("MessageContext: Error sending message:", error);
//         setConnectionState((prev) => ({
//           ...prev,
//           type: "ERROR",
//           error: error as Error,
//         }));
//       }
//     },
//     [
//       currentConversationId,
//       connectionState.canSendMessage,
//       conversationService,
//       webSocket,
//     ]
//   );

//   // Helper function to check if a message requested a graph
//   const didMessageRequestGraph = useCallback(
//     (messageId: string) => {
//       return messagesRequestingGraphs.has(messageId);
//     },
//     [messagesRequestingGraphs]
//   );

//   WebSocket connection event listeners
//   useEffect(() => {
//     webSocket.on("connect", () => {
//       setConnectionState((prev) => ({
//         ...prev,
//         type: "CONNECTED",
//         canSendMessage: true,
//       }));
//     });

//     webSocket.on("disconnect", () => {
//       setConnectionState((prev) => ({
//         ...prev,
//         type: "DISCONNECTED",
//         canSendMessage: false,
//       }));
//     });

//     webSocket.on("error", (error: Error) => {
//       setConnectionState((prev) => ({
//         ...prev,
//         type: "ERROR",
//         error: error,
//       }));
//     });

//     return () => {
//       webSocket.disconnect();
//     };
//   }, [webSocket]);

//   Context value with memoization
//   const value = useMemo(
//     () => ({
//       messages,
//       streamingMessage,
//       connectionState,
//       startNewConversation,
//       sendMessage,
//       loadConversation,
//       currentConversationId,
//       showLoader,
//       didMessageRequestGraph,
//       getConversationConfig,
//       registerMessageHandler,
//     }),
//     [
//       messages,
//       streamingMessage,
//       connectionState,
//       startNewConversation,
//       sendMessage,
//       loadConversation,
//       currentConversationId,
//       showLoader,
//       didMessageRequestGraph,
//       getConversationConfig,
//       registerMessageHandler,
//     ]
//   );

//   return (
//     <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
//   );
// };

// export const useMessage = () => {
//   const context = useContext(MessageContext);
//   if (!context) {
//     throw new Error("useMessage must be used within a MessageProvider");
//   }
//   return context;
// };
