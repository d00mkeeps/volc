import { useCallback } from "react";
import ChatUI from "./ChatUI";

interface ConversationChatProps {
  conversationId: string;
  onSignal?: (type: string, data: any) => void;
}

export const ConversationChat: React.FC<ConversationChatProps> = ({
  conversationId,
  onSignal
}) => {
  // We could handle conversation-specific signals here, similar to how
  // OnboardingChat handles workout_history_approved
  const handleSignal = useCallback((type: string, data: any) => {
    console.log('ConversationChat: Received signal', { type, data });
    onSignal?.(type, data);
  }, [onSignal]);
  console.log('ConversationChat received ID:', conversationId);
  return (
    <ChatUI
      configName="default"
      title="Trainsmart"
      subtitle="Chat to your AI coach today!"
      signalHandler={handleSignal}
      conversationId={conversationId}
    />
  );
};