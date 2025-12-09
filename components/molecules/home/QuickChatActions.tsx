import React from 'react';
import { YStack, XStack, ScrollView } from 'tamagui';
import Button from '@/components/atoms/core/Button';
import Text from '@/components/atoms/core/Text';
import { MessageItem } from '@/components/atoms/chat/MessageItem'; // Reusing existing item
import { useQuickChatActions } from '@/hooks/chat/useQuickChatActions';
import { Message } from '@/types';

interface QuickChatActionsProps {
  isActive: boolean; // True if < 60 mins since last message
  onActionSelect: (text: string) => void;
  recentMessages?: Message[];
  greeting: string; // Dynamic greeting text
}

export const QuickChatActions: React.FC<QuickChatActionsProps> = ({
  isActive,
  onActionSelect,
  recentMessages = [],
  greeting,
}) => {
  const actions = useQuickChatActions(recentMessages);

  // Determine what message to show
  // Fresh State: Use provided greeting
  // Active State: Most recent AI message
  const displayMessage: Message = React.useMemo(() => {
    if (isActive && recentMessages.length > 0) {
      // Find last AI message
      const lastAiMsg = [...recentMessages].reverse().find(m => m.sender === 'assistant');
      if (lastAiMsg) return lastAiMsg;
    }

    // Default Greeting (construct a fake Message object for MessageItem)
    return {
      id: 'greeting',
      conversation_id: 'temp',
      content: greeting,
      sender: 'assistant',
      timestamp: new Date(),
      conversation_sequence: 0
    } as Message;
  }, [isActive, recentMessages, greeting]);

  return (
    <YStack gap="$4" paddingHorizontal="$4" marginTop="$4">
      {/* Message Bubble - reusing standard Chat styling */}
      <MessageItem 
        message={displayMessage} 
        isStreaming={false}
      />

      {/* Quick Replies - Horizontal Scroll for chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$2" paddingHorizontal="$1" paddingBottom="$2">
          {actions.map((action, index) => (
            <Button
              key={index}
              size="small"
              backgroundColor="$backgroundHover"
              pressStyle={{ backgroundColor: "$backgroundPress" }}
              onPress={() => onActionSelect(action)}
              borderRadius={20} // Pill shape
              paddingHorizontal="$4"
            >
              <Text fontSize="$3" color="$text">{action}</Text>
            </Button>
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  );
};
