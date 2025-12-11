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

interface QuickChatActionsProps {
  isActive: boolean;
  onActionSelect: (text: string) => void;
  actions: Array<{ label: string; message: string }> | null;
  isLoadingActions: boolean;
  isWaitingForResponse?: boolean;
}

export const QuickChatActions: React.FC<QuickChatActionsProps> = ({
  isActive,
  onActionSelect,
  actions,
  isLoadingActions,
  isWaitingForResponse = false,
}) => {
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

  return (
    <YStack
      onLayout={(e) => setQuickActionsHeight(e.nativeEvent.layout.height)}
    >
      {isLoadingActions || !actions ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ActionsSkeleton />
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
                  disabled={isWaitingForResponse}
                  opacity={isWaitingForResponse ? 0.5 : 1}
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
