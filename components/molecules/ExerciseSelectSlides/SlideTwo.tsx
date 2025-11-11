import React, { useState, useMemo } from "react";
import { YStack, XStack, Stack, Separator } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Chip from "@/components/atoms/core/Chip";
import { ScrollView, TouchableOpacity, ViewStyle } from "react-native";
import { ExerciseDefinition } from "@/types/workout";
import * as Haptics from "expo-haptics";
import { ChevronLeft } from "@/assets/icons/IconMap";

interface SlideTwoProps {
  baseMovement: string;
  exercises: ExerciseDefinition[];
  onBack: () => void;
  onSelectExercise: (exercise: ExerciseDefinition) => void;
  fromPopular?: boolean; // Add this
}

// Mapping of base_movement to muscle target (from SlideOne)
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

// Category groupings (from SlideOne)
const CATEGORY_MAPPING: Record<string, string[]> = {
  CHEST: ["chest"],
  BACK: ["lats", "traps", "rear_delts"],
  SHOULDERS: ["shoulders"],
  ARMS: ["biceps", "triceps"],
  LEGS: ["quadriceps", "glutes", "hamstrings", "calves"],
  CORE: ["abs", "core", "lower_back"],
};

// Category color mapping (from SlideOne)
const CATEGORY_COLORS: Record<string, string> = {
  POPULAR: "$primary", // ← Add this
  CHEST: "$green9",
  BACK: "$darkBlue9",
  SHOULDERS: "$purple9",
  ARMS: "$primary",
  LEGS: "$blue9",
  CORE: "$purple9",
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

// Helper to format base_movement for display
const formatBaseMovement = (baseMovement: string): string => {
  return baseMovement
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Smart formatter for display names - handles ~300 variations automatically
const formatDisplayName = (rawName: string): string => {
  // Special cases that don't follow normal capitalization rules
  const specialCases: Record<string, string> = {
    db: "DB",
    bb: "BB",
    ez: "EZ",
    ohp: "OHP",
    t: "T",
    rdl: "RDL",
    // Add any other acronyms as you discover them
  };

  return rawName
    .split("_")
    .map((word) => {
      const lower = word.toLowerCase();
      return (
        specialCases[lower] || word.charAt(0).toUpperCase() + word.slice(1)
      );
    })
    .join(" ");
};

export default function SlideTwo({
  baseMovement,
  exercises,
  fromPopular,
  onBack,
  onSelectExercise,
}: SlideTwoProps) {
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [flashingExerciseId, setFlashingExerciseId] = useState<string | null>(
    null
  );

  const category = getCategoryForBaseMovement(baseMovement);
  const categoryColor = fromPopular
    ? CATEGORY_COLORS.POPULAR
    : category
    ? CATEGORY_COLORS[category]
    : "$text";

  // Filter exercises by base movement
  const baseExercises = useMemo(
    () => exercises.filter((ex) => ex.base_movement === baseMovement),
    [exercises, baseMovement]
  );

  // Extract unique variations and equipment
  const variations = useMemo(() => {
    const unique = [
      ...new Set(
        baseExercises
          .map((ex) => ex.major_variation)
          .filter((v): v is string => v !== null)
      ),
    ];
    return unique.sort();
  }, [baseExercises]);

  const equipment = useMemo(() => {
    const unique = [
      ...new Set(
        baseExercises
          .map((ex) => ex.equipment)
          .filter((e): e is string => e !== null)
      ),
    ];
    return unique.sort();
  }, [baseExercises]);

  // Filter exercises based on selected chips
  const filteredExercises = useMemo(() => {
    return baseExercises.filter((ex) => {
      const matchesVariation =
        selectedVariations.length === 0 ||
        (ex.major_variation && selectedVariations.includes(ex.major_variation));

      const matchesEquipment =
        selectedEquipment.length === 0 ||
        (ex.equipment && selectedEquipment.includes(ex.equipment));

      return matchesVariation && matchesEquipment;
    });
  }, [baseExercises, selectedVariations, selectedEquipment]);

  const handleVariationToggle = (variation: string) => {
    setSelectedVariations((prev) =>
      prev.includes(variation)
        ? prev.filter((v) => v !== variation)
        : [...prev, variation]
    );
  };

  const handleEquipmentToggle = (equip: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(equip) ? prev.filter((e) => e !== equip) : [...prev, equip]
    );
  };

  const handleExerciseSelect = (exercise: ExerciseDefinition) => {
    // Flash effect
    setFlashingExerciseId(exercise.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Brief delay to show the flash before closing
    setTimeout(() => {
      onSelectExercise(exercise);
    }, 150);
  };

  return (
    <YStack flex={1} position="relative">
      {/* Full-screen colored background overlay */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundColor={categoryColor}
        opacity={0.04}
        zIndex={0}
      />

      {/* Header with back button */}
      <XStack
        paddingHorizontal="$4"
        paddingTop="$4"
        paddingBottom="$3"
        alignItems="center"
        gap="$2"
        zIndex={1}
      >
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Stack borderRadius="$2" padding="$1">
            <ChevronLeft size={24} color={categoryColor} />
          </Stack>
        </TouchableOpacity>
        <Text size="large" fontWeight="700" color="$text">
          {formatBaseMovement(baseMovement)}
        </Text>
      </XStack>

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Unified Filter Section - Variation + Equipment */}
        {(variations.length > 0 || equipment.length > 0) && (
          <YStack marginBottom="$4" padding="$2">
            <YStack gap="$4">
              {/* Variation chips */}
              {variations.length > 0 && (
                <YStack gap="$2">
                  <XStack alignItems="center" gap="$2" paddingLeft="$2">
                    <Stack
                      width={3}
                      height={20}
                      backgroundColor={categoryColor}
                      borderRadius="$4"
                    />
                    <Text size="large" fontWeight="700" color="$text">
                      Variation
                    </Text>
                  </XStack>
                  <XStack gap="$2" flexWrap="wrap">
                    {variations.map((variation) => (
                      <Chip
                        key={variation}
                        label={formatDisplayName(variation)}
                        selected={selectedVariations.includes(variation)}
                        selectedBackgroundOpacity={0.3}
                        onPress={() => handleVariationToggle(variation)}
                        borderWidth={
                          selectedVariations.includes(variation) ? 0.5 : 0.25
                        }
                        borderColor={categoryColor}
                        selectedTextColor="$white"
                        selectedBorderColor={categoryColor}
                        selectedBackgroundColor={categoryColor}
                      />
                    ))}
                  </XStack>
                </YStack>
              )}

              {/* Equipment chips */}
              {equipment.length > 0 && (
                <YStack gap="$2">
                  <XStack alignItems="center" gap="$2" paddingLeft="$2">
                    <Stack
                      width={3}
                      height={20}
                      backgroundColor={categoryColor}
                      borderRadius="$4"
                    />
                    <Text size="large" fontWeight="700" color="$text">
                      Equipment
                    </Text>
                  </XStack>
                  <XStack gap="$2" flexWrap="wrap">
                    {equipment.map((equip) => (
                      <Chip
                        key={equip}
                        selectedBackgroundOpacity={0.3}
                        label={formatDisplayName(equip)}
                        selected={selectedEquipment.includes(equip)}
                        onPress={() => handleEquipmentToggle(equip)}
                        borderWidth={
                          selectedEquipment.includes(equip) ? 0.5 : 0.25
                        }
                        borderColor={categoryColor}
                        selectedTextColor="$white"
                        selectedBorderColor={categoryColor}
                        selectedBackgroundColor={categoryColor}
                      />
                    ))}
                  </XStack>
                </YStack>
              )}
            </YStack>
          </YStack>
        )}

        <Separator marginVertical="$3" borderColor="$borderSoft" />

        {/* Exercise list */}
        <YStack gap="$2">
          <XStack
            alignItems="center"
            gap="$2"
            paddingLeft="$2"
            paddingBottom="$2"
          >
            <Stack
              width={3}
              height={20}
              backgroundColor={categoryColor}
              borderRadius="$4"
            />
            <Text size="large" fontWeight="700" color="$text">
              Matching Exercises ({filteredExercises.length})
            </Text>
          </XStack>

          {filteredExercises.length === 0 ? (
            <Stack padding="$4" alignItems="center">
              <Text size="medium" color="$textMuted" textAlign="center">
                No exercises match these filters
              </Text>
            </Stack>
          ) : (
            <YStack gap="$2">
              {filteredExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => handleExerciseSelect(exercise)}
                  activeOpacity={0.7}
                >
                  <Stack
                    minHeight={64}
                    backgroundColor={
                      flashingExerciseId === exercise.id
                        ? categoryColor
                        : "$backgroundMuted"
                    }
                    borderRadius={20}
                    borderWidth={0.25}
                    borderColor={
                      flashingExerciseId === exercise.id
                        ? categoryColor
                        : categoryColor
                    }
                    padding="$3"
                    justifyContent="center"
                    shadowColor="$black"
                    shadowOffset={{ width: 0, height: 1 }}
                    shadowOpacity={0.08}
                    shadowRadius={4}
                  >
                    <Text size="medium" fontWeight="500" color="$text">
                      {exercise.standard_name}
                    </Text>
                    <Text size="small" color="$textSoft" marginTop="$1">
                      {formatDisplayName(exercise.major_variation || "")} •{" "}
                      {formatDisplayName(exercise.equipment || "")}
                    </Text>
                  </Stack>
                </TouchableOpacity>
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
