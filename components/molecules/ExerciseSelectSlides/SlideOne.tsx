import React from "react";
import { YStack, XStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import { ScrollView, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

// Mapping of base_movement to muscle target
const BASE_MOVEMENT_TARGETS: Record<string, string> = {
  ab_wheel: "abs",
  back_extension: "lower_back",
  bench_press: "chest",
  bicep_curl: "biceps",
  bulgarian_split_squat: "glutes",
  calf_raise: "calves",
  chest_fly: "chest",
  crunch: "abs",
  deadlift: "glutes",
  dip: "chest",
  face_pull: "rear_delts",
  farmers_walk: "traps",
  front_raise: "shoulders",
  good_morning: "lower_back",
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
  reverse_fly: "rear_delts",
  romanian_deadlift: "lower_back",
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

  // Filter out popular exercises from categorization
  const nonPopularMovements = Object.keys(BASE_MOVEMENT_TARGETS).filter(
    (movement) => !POPULAR_EXERCISES.includes(movement)
  );

  nonPopularMovements.forEach((movement) => {
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
  onSelectBaseMovement: (baseMovement: string) => void;
}

export default function SlideOne({ onSelectBaseMovement }: SlideOneProps) {
  const categorizedMovements = organizeByCategory();

  const handleTilePress = (baseMovement: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectBaseMovement(baseMovement);
  };

  const renderTile = (baseMovement: string) => (
    <TouchableOpacity
      key={baseMovement}
      onPress={() => handleTilePress(baseMovement)}
      style={{ flex: 1, minWidth: "30%" }}
      activeOpacity={0.7}
    >
      <Stack
        minHeight={100}
        backgroundColor="$backgroundMuted"
        borderRadius="$3"
        borderWidth={1}
        borderColor="$borderSoft"
        justifyContent="center"
        alignItems="center"
        padding="$3"
      >
        <Text
          size="medium"
          fontWeight="600"
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

    return (
      <YStack key={categoryName} gap="$2" marginBottom="$4">
        <Text size="small" fontWeight="700" color="$textSoft" paddingLeft="$2">
          {categoryName}
        </Text>
        <XStack gap="$2" flexWrap="wrap">
          {movements.map((movement) => renderTile(movement))}
        </XStack>
      </YStack>
    );
  };

  return (
    <YStack flex={1}>
      {/* Header */}
      <Stack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$3">
        <Text size="large" fontWeight="700" color="$text">
          Select Exercise Type
        </Text>
      </Stack>

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Popular Section */}
        <YStack gap="$2" marginBottom="$4">
          <Text
            size="small"
            fontWeight="700"
            color="$textSoft"
            paddingLeft="$2"
          >
            POPULAR
          </Text>
          <XStack gap="$2" flexWrap="wrap">
            {POPULAR_EXERCISES.map((movement) => renderTile(movement))}
          </XStack>
        </YStack>

        {/* Categorized Sections */}
        {Object.entries(categorizedMovements).map(([category, movements]) =>
          renderCategory(category, movements)
        )}
      </ScrollView>
    </YStack>
  );
}
