// // components/chat/organisms/WorkoutAnalysisChat.tsx
// import React, { useState, useCallback, useEffect } from "react";
// import { YStack, Text } from "tamagui";
// import { useWorkoutAnalysisStore } from "@/stores/analysis/WorkoutAnalysisStore";
// import { useConversationStore } from "@/stores/chat/ConversationStore";
// import { useMessaging } from "@/hooks/chat/useMessaging";
// import { MessageList } from "../molecules/chat/MessageList";
// import { InputArea } from "../atoms/InputArea";

// interface WorkoutAnalysisChatProps {
//   onError?: (error: Error) => void;
// }

// export const WorkoutAnalysisChat = React.memo(
//   ({ onError }: WorkoutAnalysisChatProps) => {
//     const [conversationId, setConversationId] = useState<string>("");
//     const [pendingMessage, setPendingMessage] = useState<{
//       content: string;
//       analysisBundle: any;
//     } | null>(null);
//     const conversationStore = useConversationStore();
//     const { getResult } = useWorkoutAnalysisStore();
//     const messaging = useMessaging(conversationId);

//     const handleSendMessage = useCallback(
//       async (content: string) => {
//         try {
//           if (!conversationId) {
//             console.log(
//               "[WorkoutAnalysisChat] Creating conversation for first message"
//             );

//             const newConversationId =
//               await conversationStore.createConversation({
//                 title: "Workout Analysis",
//                 firstMessage: content,
//                 configName: "workout-analysis",
//               });

//             setConversationId(newConversationId);

//             // Store pending message instead of setTimeout
//             const analysisBundle = getResult();
//             if (analysisBundle) {
//               setPendingMessage({ content, analysisBundle });
//             }
//           } else {
//             await messaging?.sendMessage(content);
//           }
//         } catch (error) {
//           console.error("[WorkoutAnalysisChat] Error sending message:", error);
//           onError?.(error instanceof Error ? error : new Error(String(error)));
//         }
//       },
//       [conversationId, conversationStore, getResult, messaging, onError]
//     );

//     useEffect(() => {
//       if (messaging?.isConnected && pendingMessage) {
//         messaging.sendMessage(pendingMessage.content, {
//           analysisBundle: pendingMessage.analysisBundle,
//         });
//         setPendingMessage(null);
//       }
//     }, [messaging?.isConnected, pendingMessage, messaging]);

//     // Handle messaging errors
//     React.useEffect(() => {
//       if (messaging?.error) {
//         onError?.(messaging.error);
//       }
//     }, [messaging?.error, onError]);

//     if (!conversationId) {
//       return (
//         <YStack flex={1}>
//           <YStack flex={1} justifyContent="center" alignItems="center">
//             <Text color="$textMuted" fontSize="$4">
//               Ready to analyze your workout
//             </Text>
//           </YStack>

//           <InputArea
//             placeholder="Ask about your workout analysis..."
//             onSendMessage={handleSendMessage}
//           />
//         </YStack>
//       );
//     }

//     if (!messaging?.isConnected) {
//       return (
//         <YStack flex={1} justifyContent="center" alignItems="center">
//           <Text color="$textMuted" fontSize="$4">
//             Connecting to conversation...
//           </Text>
//         </YStack>
//       );
//     }

//     return (
//       <YStack flex={1}>
//         <MessageList
//           messages={messaging.messages || []}
//           streamingMessage={messaging.streamingMessage}
//         />

//         <InputArea
//           disabled={!messaging.isConnected}
//           placeholder="Ask about your workout analysis..."
//           onSendMessage={handleSendMessage}
//         />
//       </YStack>
//     );
//   }
// );

// WorkoutAnalysisChat.displayName = "WorkoutAnalysisChat";
