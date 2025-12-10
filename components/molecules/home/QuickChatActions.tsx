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
  onMessagePress?: () => void; // Add this
  showPreview?: boolean; // New prop to control preview visibility
}

export const QuickChatActions: React.FC<QuickChatActionsProps> = ({
  isActive,
  onActionSelect,
  recentMessages = [],
  greeting,
  onMessagePress,
  showPreview = true, // Default to true
}) => {
  const actions = useQuickChatActions(recentMessages);

  const displayMessage: Message = React.useMemo(() => {
    if (isActive && recentMessages.length > 0) {
      const lastAiMsg = [...recentMessages].reverse().find(m => m.sender === 'assistant');
      if (lastAiMsg) return lastAiMsg;
    }
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
    <YStack >
{/* Compact Message Preview */}
     {showPreview && (
     <YStack 
        backgroundColor="$transparent" 
        borderRadius="$3" 
        padding="$3"
        maxHeight={280}
        overflow="hidden"
        onPress={onMessagePress} 
        cursor="pointer"
      >
        <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled>
          <MessageItem 
            message={displayMessage} 
            isStreaming={false}
          />
        </ScrollView>
    </YStack>
     )}

      {/* Quick Action Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$2" paddingHorizontal="$1">
          {actions.map((action, index) => (
            <Button
              key={`${index}-${action.label}`}
              size="small"
              backgroundColor="$backgroundHover"
              pressStyle={{ backgroundColor: "$backgroundPress" }}
              onPress={() => onActionSelect(action.message)}
              borderRadius={20}
              paddingHorizontal="$4"
            >
              <Text fontSize="$3" color="$text">{action.label}</Text>
            </Button>
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  );
};