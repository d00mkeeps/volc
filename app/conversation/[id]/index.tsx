 import { ChatUI } from "@/components/conversation/organisms/ChatUI";
 import { useMessage } from "@/context/MessageContext";
 import { ChatAttachmentProvider } from "@/context/ChatAttachmentContext";
 import { useLocalSearchParams, useRouter } from "expo-router";
 import { useCallback, useEffect, useRef } from "react";
 import { View, StyleSheet } from "react-native";
 
 function ConversationPage() {
   const { id, pendingMessage } = useLocalSearchParams<{ 
     id: string;
     pendingMessage?: string;
   }>();
   const { sendMessage, connectionState } = useMessage();
   const router = useRouter();
   const initialMessageSent = useRef(false);
 
   useEffect(() => {
     const sendInitialMessage = async () => {
       if (
         pendingMessage && 
         !initialMessageSent.current && 
         connectionState.type === 'CONNECTED' && 
         connectionState.canSendMessage
       ) {
         try {
           await sendMessage(pendingMessage);
           initialMessageSent.current = true;
           router.setParams({ pendingMessage: undefined });
         } catch (error) {
           console.error('Failed to send initial message:', error);
           initialMessageSent.current = false;
         }
       }
     };
 
     sendInitialMessage();
   }, [connectionState, pendingMessage, sendMessage]);
 
   return (
     <View style={styles.container}>
       <ChatAttachmentProvider conversationId={id}>
         <ChatUI 
           configName="default"
           conversationId={id}
           title="Trainsmart"
           subtitle="Chat to your AI coach today!"
           showNavigation={true}
         />
       </ChatAttachmentProvider>
     </View>
   );
 }
 
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#1f281f',
   },
 });
 
 export default ConversationPage;