import React, { useState, useMemo } from "react";
import { YStack, XStack, Stack, Separator } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Chip from "@/components/atoms/core/Chip";
import { ScrollView, TouchableOpacity } from "react-native";
import { ExerciseDefinition } from "@/types/workout";
import * as Haptics from "expo-haptics";
import { ChevronLeft } from "@/assets/icons/IconMap";

interface SlideTwoProps {
  baseMovement: string;
  exercises: ExerciseDefinition[];
  onBack: () => void;
  onSelectExercise: (exercise: ExerciseDefinition) => void;
}

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
  onBack,
  onSelectExercise,
}: SlideTwoProps) {
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [flashingExerciseId, setFlashingExerciseId] = useState<string | null>(
    null
  );

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
    <YStack flex={1}>
      {/* Header with back button */}
      <XStack
        paddingHorizontal="$4"
        paddingTop="$4"
        paddingBottom="$3"
        alignItems="center"
        gap="$2"
      >
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Stack borderRadius="$2">
            <ChevronLeft size={24} color="$text" />
          </Stack>
        </TouchableOpacity>
        <Text size="large" fontWeight="700" color="$text">
          {formatBaseMovement(baseMovement)}
        </Text>
      </XStack>

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Variation chips */}
        {variations.length > 0 && (
          <YStack gap="$2" marginBottom="$4">
            <Text
              size="large"
              fontWeight="600"
              color="$textSoft"
              paddingLeft="$2"
            >
              Variation
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {variations.map((variation) => (
                <Chip
                  key={variation}
                  label={formatDisplayName(variation)}
                  selected={selectedVariations.includes(variation)}
                  onPress={() => handleVariationToggle(variation)}
                />
              ))}
            </XStack>
          </YStack>
        )}

        {/* Equipment chips */}
        {equipment.length > 0 && (
          <YStack gap="$2" marginBottom="$4">
            <Text
              size="large"
              fontWeight="600"
              color="$textSoft"
              paddingLeft="$2"
            >
              Equipment
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {equipment.map((equip) => (
                <Chip
                  key={equip}
                  label={formatDisplayName(equip)}
                  selected={selectedEquipment.includes(equip)}
                  onPress={() => handleEquipmentToggle(equip)}
                />
              ))}
            </XStack>
          </YStack>
        )}

        <Separator marginVertical="$3" borderColor="$borderSoft" />

        {/* Exercise list */}
        <YStack gap="$2.5">
          <Text
            size="medium"
            fontWeight="600"
            color="$textSoft"
            paddingBottom="$2"
            paddingLeft="$2"
          >
            Matching Exercises ({filteredExercises.length})
          </Text>

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
                        ? "$green8"
                        : "$backgroundMuted"
                    }
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor={
                      flashingExerciseId === exercise.id
                        ? "$green8"
                        : "$borderSoft"
                    }
                    padding="$3"
                    justifyContent="center"
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
