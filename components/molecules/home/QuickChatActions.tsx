import React, { useEffect } from "react";
import { YStack, XStack, ScrollView } from "tamagui";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import { ActionsSkeleton } from "@/components/atoms/chat/SkeletonLoader";
import { useLayoutStore } from "@/stores/layoutStore";
import { useChatStore } from "@/stores/chat/ChatStore";
import { useConversationStore } from "@/stores/chat/ConversationStore";

interface QuickChatActionsProps {
  onActionSelect: (text: string) => void;
  isWaitingForResponse?: boolean;
  isStreaming?: boolean;
}

export const QuickChatActions: React.FC<QuickChatActionsProps> = ({
  onActionSelect,
  isStreaming = false,
  isWaitingForResponse = false,
}) => {
  const actions = useChatStore((state) => state.actions);
  const isLoadingActions = useChatStore((state) => state.isLoadingActions);
  const activeConversationId = useConversationStore(
    (state) => state.activeConversationId
  );

  const fadeIn = useSharedValue(0);
  const setQuickActionsHeight = useLayoutStore(
    (state) => state.setQuickActionsHeight
  );

  useEffect(() => {
    if (!isLoadingActions && actions) {
      fadeIn.value = withTiming(1, { duration: 200 });
    } else {
      fadeIn.value = 0;
    }
  }, [isLoadingActions, actions]);

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const isDisabled = isWaitingForResponse || isStreaming;
  const displayOpacity = isDisabled ? 0.4 : 1;

  return (
    <YStack
      onLayout={(e) => setQuickActionsHeight(e.nativeEvent.layout.height)}
    >
      {isLoadingActions || !actions ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ActionsSkeleton previousActions={actions} />
        </ScrollView>
      ) : (
        <Animated.View style={fadeInStyle}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2" paddingHorizontal="$1">
              {actions.map((action, index) => (
                <Button
                  key={`${index}-${action.label}`}
                  size="small"
                  variant="blur"
                  blurIntensity={30}
                  pressStyle={{ backgroundColor: "$backgroundPress" }}
                  onPress={() => onActionSelect(action.message)}
                  borderRadius={20}
                  paddingHorizontal="$4"
                  disabled={isDisabled}
                  opacity={displayOpacity}
                >
                  <Text fontSize="$3" color="$text">
                    {action.label}
                  </Text>
                </Button>
              ))}
            </XStack>
          </ScrollView>
        </Animated.View>
      )}
    </YStack>
  );
};
