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

import { LinearGradient } from "expo-linear-gradient";

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
    (state) => state.activeConversationId,
  );

  const fadeIn = useSharedValue(0);
  const setQuickActionsHeight = useLayoutStore(
    (state) => state.setQuickActionsHeight,
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

  const renderActionButton = (
    action: { label: string; message: string },
    index: number,
  ) => {
    const labelLower = action.label.toLowerCase();
    const isAccept =
      labelLower.includes("accept") ||
      labelLower.includes("yes") ||
      labelLower.includes("approve");
    const isReject =
      labelLower.includes("reject") ||
      labelLower.includes("no") ||
      labelLower.includes("decline");

    const gradientColors = isAccept
      ? ["#16a34a", "#064e3b"] // Darker Green (600 to 900)
      : isReject
        ? ["#dc2626", "#7f1d1d"] // Darker Red (600 to 900)
        : null;

    return (
      <Button
        key={`${index}-${action.label}`}
        size="small"
        variant="blur"
        blurIntensity={40}
        pressStyle={{ backgroundColor: "$backgroundPress" }}
        onPress={() => onActionSelect(action.message)}
        borderRadius={20}
        paddingHorizontal="$2"
        disabled={isDisabled}
        opacity={displayOpacity}
        backgroundColor="transparent"
      >
        {gradientColors && (
          <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 20,
              opacity: 0.8,
            }}
          />
        )}
        <Text fontSize="$3" fontWeight="600" color="white" zIndex={1}>
          {action.label}
        </Text>
      </Button>
    );
  };

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
              {actions.map((action, index) =>
                renderActionButton(action, index),
              )}
            </XStack>
          </ScrollView>
        </Animated.View>
      )}
    </YStack>
  );
};

const StyleSheet = {
  absoluteFill: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 20,
  },
} as const;
