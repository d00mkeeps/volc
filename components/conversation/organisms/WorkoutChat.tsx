import { useCallback } from "react";
import {ChatUI} from "./ChatUI";
import { View, StyleSheet } from "react-native";
import { WorkoutChatProps } from "@/types/chat";

export const WorkoutChat: React.FC<WorkoutChatProps> = ({
  conversationId,
  onSignal
}) => {
  const handleSignal = useCallback((type: string, data: any) => {
    console.log('WorkoutChat: Received signal', { type, data });
    onSignal?.(type, data);
  }, [onSignal]);

  return (
    <View style={styles.chatContainer}>
      <ChatUI
        configName="default"
        title="Trainsmart"
        subtitle="Chat to your AI coach today!"
        onSignal={handleSignal}
        conversationId={conversationId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'column', // Add this
  },
});
