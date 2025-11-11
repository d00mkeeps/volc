import React, { useState } from "react";
import { YStack, XStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { ScrollView, TouchableOpacity, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

// Mapping of base_movement to muscle target
const BASE_MOVEMENT_TARGETS: Record<string, string> = {
  ab_wheel: "abs",
  back_extension: "lats",
  bench_press: "chest",
  bicep_curl: "biceps",
  bulgarian_split_squat: "glutes",
  calf_raise: "calves",
  chest_fly: "chest",
  crunch: "abs",
  deadlift: "glutes",
  dip: "chest",
  face_pull: "shoulders",
  farmers_walk: "traps",
  front_raise: "shoulders",
  good_morning: "hamstrings",
  hip_thrust: "glutes",
  lateral_raise: "shoulders",
  lat_pulldown: "traps",
  leg_curl: "hamstrings",
  leg_extension: "quadriceps",
  leg_press: "glutes",
  leg_raise: "abs",
  lunge: "glutes",
  nordic_curl: "hamstrings",
  overhead_tricep_extension: "triceps",
  plank: "core",
  pullup: "lats",
  pushup: "chest",
  reverse_fly: "shoulders",
  romanian_deadlift: "hamstrings",
  row: "lats",
  russian_twist: "abs",
  shoulder_press: "shoulders",
  shrug: "traps",
  skullcrusher: "triceps",
  squat: "quadriceps",
  tricep_pushdown: "triceps",
  upright_row: "shoulders",
};

// Category groupings
const CATEGORY_MAPPING: Record<string, string[]> = {
  CHEST: ["chest"],
  BACK: ["lats", "traps", "rear_delts"],
  SHOULDERS: ["shoulders"],
  ARMS: ["biceps", "triceps"],
  LEGS: ["quadriceps", "glutes", "hamstrings", "calves"],
  CORE: ["abs", "core", "lower_back"],
};

// Category color mapping for visual hierarchy
const CATEGORY_COLORS: Record<string, string> = {
  POPULAR: "$primary",
  CHEST: "$green9",
  BACK: "$darkBlue9",
  SHOULDERS: "$purple9",
  ARMS: "$primary",
  LEGS: "$blue9",
  CORE: "$purple9",
};

// Popular exercises (by base_movement key)
const POPULAR_EXERCISES = [
  "squat",
  "bench_press",
  "deadlift",
  "leg_extension",
  "shoulder_press",
  "row",
];

// Helper to format base_movement for display
const formatBaseMovement = (baseMovement: string): string => {
  return baseMovement
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper to get category for a base movement
const getCategoryForBaseMovement = (baseMovement: string): string | null => {
  const target = BASE_MOVEMENT_TARGETS[baseMovement];
  if (!target) return null;

  for (const [category, targets] of Object.entries(CATEGORY_MAPPING)) {
    if (targets.includes(target)) {
      return category;
    }
  }
  return null;
};

// Organize base movements by category
const organizeByCategory = (): Record<string, string[]> => {
  const organized: Record<string, string[]> = {
    CHEST: [],
    BACK: [],
    SHOULDERS: [],
    ARMS: [],
    LEGS: [],
    CORE: [],
  };

  // Include ALL movements (popular exercises will appear in both POPULAR and their category)
  Object.keys(BASE_MOVEMENT_TARGETS).forEach((movement) => {
    const category = getCategoryForBaseMovement(movement);
    if (category && organized[category]) {
      organized[category].push(movement);
    }
  });

  // Sort each category alphabetically
  Object.keys(organized).forEach((category) => {
    organized[category].sort((a, b) =>
      formatBaseMovement(a).localeCompare(formatBaseMovement(b))
    );
  });

  return organized;
};

interface SlideOneProps {
  onSelectBaseMovement: (baseMovement: string, fromPopular: boolean) => void;
}

export default function SlideOne({ onSelectBaseMovement }: SlideOneProps) {
  const categorizedMovements = organizeByCategory();
  const [isFromPopular, setIsFromPopular] = useState(false);

  const handleTilePress = (
    baseMovement: string,
    fromPopular: boolean = false
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsFromPopular(fromPopular);
    onSelectBaseMovement(baseMovement, fromPopular);
  };

  const renderTile = (
    baseMovement: string,
    categoryColor: string,
    isPopular: boolean = false,
    minWidth: string = "30%"
  ) => (
    <TouchableOpacity
      key={baseMovement}
      onPress={() => handleTilePress(baseMovement, isPopular)}
      style={{ flex: 1, minWidth } as ViewStyle}
      activeOpacity={0.7}
    >
      <Stack
        minHeight={100}
        backgroundColor="$backgroundMuted"
        borderRadius={24}
        borderWidth={isPopular ? 0.5 : 0.25}
        borderColor={categoryColor}
        justifyContent="center"
        alignItems="center"
        padding="$1"
        shadowColor="$black"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={8}
        // elevation={3}
      >
        <Text
          size="medium"
          fontWeight="500"
          color="$text"
          textAlign="center"
          numberOfLines={2}
        >
          {formatBaseMovement(baseMovement)}
        </Text>
      </Stack>
    </TouchableOpacity>
  );

  const renderCategory = (categoryName: string, movements: string[]) => {
    if (movements.length === 0) return null;

    const categoryColor = CATEGORY_COLORS[categoryName] || "$gray9";
    // Use 2x2 grid for exactly 4 exercises, otherwise allow 3 per row
    const tileMinWidth = movements.length === 4 ? "48%" : "30%";

    return (
      <YStack
        key={categoryName}
        marginBottom="$3"
        position="relative"
        borderRadius="$4"
        padding="$2"
        $sm={{ padding: "$4" }}
      >
        {/* Background with increased opacity */}
        <Stack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor={categoryColor}
          opacity={0.15}
          borderRadius="$4"
        />

        {/* Content */}
        <YStack zIndex={1}>
          <XStack alignItems="center" gap="$2" paddingLeft="$2">
            <Stack
              width={3}
              height={20}
              backgroundColor={categoryColor}
              borderRadius="$4"
            />
            <Text size="large" fontWeight="700" color="$text">
              {categoryName}
            </Text>
          </XStack>
          <XStack gap="$1" flexWrap="wrap" marginTop="$1">
            {movements.map((movement) =>
              renderTile(movement, categoryColor, false, tileMinWidth)
            )}
          </XStack>
        </YStack>
      </YStack>
    );
  };

  return (
    <YStack flex={1}>
      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Popular Section - with special VIP styling */}
        <YStack
          marginBottom="$3"
          position="relative"
          borderRadius="$4"
          padding="$2"
          $sm={{ padding: "$4" }}
        >
          {/* Background with higher opacity for POPULAR */}
          <Stack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor={CATEGORY_COLORS.POPULAR}
            opacity={0.18}
            borderRadius="$4"
          />

          {/* Content */}
          <YStack zIndex={1}>
            <XStack alignItems="center" gap="$2" paddingLeft="$2">
              <Stack
                width={3}
                height={20}
                backgroundColor={CATEGORY_COLORS.POPULAR}
                borderRadius="$4"
              />
              <Text size="large" fontWeight="700" color="$text">
                POPULAR
              </Text>
            </XStack>
            <XStack gap="$1" flexWrap="wrap" marginTop="$1">
              {POPULAR_EXERCISES.map((movement) =>
                renderTile(
                  movement,
                  CATEGORY_COLORS.POPULAR,
                  true,
                  POPULAR_EXERCISES.length === 4 ? "48%" : "30%"
                )
              )}
            </XStack>
          </YStack>
        </YStack>

        {/* Categorized Sections */}
        {Object.entries(categorizedMovements).map(([category, movements]) =>
          renderCategory(category, movements)
        )}
      </ScrollView>
    </YStack>
  );
}
