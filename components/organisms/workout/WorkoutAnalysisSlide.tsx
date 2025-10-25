// import React, { useCallback, useEffect } from "react";
// import { YStack } from "tamagui";
// import { useMessaging } from "@/hooks/chat/useMessaging";
// import { useUserSessionStore } from "@/stores/userSessionStore";
// import { ChatInterface } from "../chat/ChatInterface";

// interface WorkoutAnalysisSlideProps {
//   onError?: (error: Error) => void;
// }

// export const WorkoutAnalysisSlide = ({
//   onError,
// }: WorkoutAnalysisSlideProps) => {
//   const messaging = useMessaging();

//   // Get conversationId from session store
//   const conversationId = useUserSessionStore(
//     (state) => state.activeConversationId
//   );

//   // Load messages when component mounts (useMessaging auto-connects)
//   useEffect(() => {
//     if (conversationId) {
//       messaging.loadMessages().catch((error) => {
//         console.error("Failed to load messages:", error);
//         onError?.(error instanceof Error ? error : new Error(String(error)));
//       });
//     }
//   }, [conversationId, onError]);

//   // Handle messaging errors
//   useEffect(() => {
//     if (messaging.error) {
//       onError?.(messaging.error);
//     }
//   }, [messaging.error, onError]);

//   const handleSend = useCallback(
//     async (content: string) => {
//       try {
//         await messaging.sendMessage(content);
//       } catch (error) {
//         onError?.(error instanceof Error ? error : new Error(String(error)));
//       }
//     },
//     [messaging.sendMessage, onError]
//   );

//   // Simplified connection state logic
//   const getConnectionState = () => {
//     if (messaging.messages.length === 0 && !messaging.streamingMessage) {
//       return "expecting_ai_message";
//     }
//     return "ready";
//   };

//   return (
//     <YStack flex={1}>
//       <ChatInterface
//         messages={messaging.messages}
//         streamingMessage={messaging.streamingMessage}
//         onSend={handleSend}
//         placeholder="Ask about your workout..."
//         connectionState={getConnectionState()}
//         keyboardVerticalOffset={100}
//       />
//     </YStack>
//   );
// };
