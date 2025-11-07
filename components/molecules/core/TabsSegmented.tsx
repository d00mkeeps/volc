import React from "react";
import { Tabs, XStack, YStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

export interface Tab {
  value: string;
  label: string;
}

interface TabsSegmentedProps {
  tabs: Tab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

/**
 * Reusable segmented tabs component with swipe support
 *
 * Example usage:
 * ```tsx
 * <TabsSegmented
 *   tabs={[
 *     { value: 'tab1', label: 'First Tab' },
 *     { value: 'tab2', label: 'Second Tab' }
 *   ]}
 *   defaultValue="tab1"
 * >
 *   <TabsSegmented.Content value="tab1">
 *     <Text>First tab content</Text>
 *   </TabsSegmented.Content>
 *   <TabsSegmented.Content value="tab2">
 *     <Text>Second tab content</Text>
 *   </TabsSegmented.Content>
 * </TabsSegmented>
 * ```
 */
export function TabsSegmented({
  tabs,
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
}: TabsSegmentedProps) {
  const [internalValue, setInternalValue] = React.useState(
    defaultValue || tabs[0]?.value
  );
  const currentValue = controlledValue ?? internalValue;
  const currentIndex = tabs.findIndex((tab) => tab.value === currentValue);

  const translateX = useSharedValue(0);
  const SWIPE_THRESHOLD = 50; // pixels to trigger tab change

  const handleValueChange = (newValue: string) => {
    if (!controlledValue) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const changeTab = (direction: "left" | "right") => {
    const newIndex = direction === "left" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < tabs.length) {
      handleValueChange(tabs[newIndex].value);
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldChangeTab = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      if (shouldChangeTab) {
        // Swipe left = next tab, swipe right = previous tab
        const direction = event.translationX < 0 ? "left" : "right";
        runOnJS(changeTab)(direction);
      }

      // Reset position
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.2 }], // Dampen the visual movement
  }));

  return (
    <Tabs
      value={currentValue}
      onValueChange={handleValueChange}
      flexDirection="column"
      width="100%"
    >
      {/* Tab Headers */}
      <Tabs.List
        disablePassBorderRadius
        backgroundColor="$backgroundMuted"
        padding="$1"
        borderRadius="$3"
        gap="$1"
      >
        {tabs.map((tab) => {
          const isActive = currentValue === tab.value;
          return (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              flex={1}
              paddingVertical="$2.5"
              paddingHorizontal="$3"
              borderRadius="$2"
              backgroundColor={isActive ? "$background" : "transparent"}
              pressStyle={{
                backgroundColor: isActive ? "$background" : "$backgroundPress",
              }}
              unstyled
            >
              <Text
                size="medium"
                fontWeight={isActive ? "600" : "400"}
                color={isActive ? "$text" : "$textMuted"}
                textAlign="center"
              >
                {tab.label}
              </Text>
            </Tabs.Tab>
          );
        })}
      </Tabs.List>

      {/* Tab Content with Swipe Support */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ marginTop: 12 }, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Tabs>
  );
}

/**
 * Content wrapper for each tab
 */
TabsSegmented.Content = function TabContent({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Tabs.Content value={value} padding={0}>
      {children}
    </Tabs.Content>
  );
};
