// components/molecules/ExerciseSearchInput.tsx
import React, { useState, useEffect } from "react";
import { Input, YStack, Text, ScrollView, Stack, XStack } from "tamagui";
import { useExerciseStore } from "@/stores/workout/exerciseStore";
import { ExerciseDefinition } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";

interface ExerciseSearchInputProps {
  value: string;
  onSelect: (exerciseName: string) => void;
  placeholder?: string;
  onValidationChange?: (isValid: boolean) => void; // Add this
}

const ExerciseSearchInput: React.FC<ExerciseSearchInputProps> = ({
  value,
  onSelect,
  placeholder = "Search exercises...",
  onValidationChange,
}) => {
  const [searchText, setSearchText] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const { exercises, loading } = useExerciseStore();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setSearchText(value);
    const valid = validateExercise(value);
    setIsValid(valid);
    onValidationChange?.(valid);
  }, [value, exercises]);

  // Filter exercises based on search text
  const filteredExercises = exercises
    .filter((exercise) => {
      const searchLower = searchText.toLowerCase();
      const nameMatch = exercise.standard_name
        .toLowerCase()
        .includes(searchLower);
      const aliasMatch = exercise.aliases?.some((alias) =>
        alias.toLowerCase().includes(searchLower)
      );
      return nameMatch || aliasMatch;
    })
    .slice(0, 8); // Show up to 8 results

  const validateExercise = (text: string) => {
    if (!text.trim()) return false;

    return exercises.some(
      (exercise) =>
        exercise.standard_name.toLowerCase() === text.toLowerCase() ||
        exercise.aliases?.some(
          (alias) => alias.toLowerCase() === text.toLowerCase()
        )
    );
  };

  // Update handleTextChange
  const handleTextChange = (text: string) => {
    setSearchText(text);
    setShowDropdown(text.length > 0);

    // Real-time validation
    const valid = validateExercise(text);
    setIsValid(valid);
    onValidationChange?.(valid); // Pass back to parent
  };

  const handleSelectExercise = (exercise: ExerciseDefinition) => {
    setSearchText(exercise.standard_name);
    setShowDropdown(false);
    onSelect(exercise.standard_name);
  };

  const handleFocus = () => {
    if (searchText.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding dropdown to allow for selection
    setTimeout(() => setShowDropdown(false), 150);
  };

  return (
    <YStack flex={1}>
      <Stack position="relative">
        <Input
          value={searchText}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          backgroundColor="$backgroundStrong"
          borderColor={
            searchText.trim() ? (isValid ? "$green8" : "$red8") : "$borderSoft"
          }
          color="$color"
          placeholderTextColor="$textMuted"
          fontSize="$5"
          fontWeight="600"
          borderRadius="$3"
          paddingHorizontal="$3"
          paddingVertical="$2"
          paddingRight={searchText.trim() ? "$6" : "$3"} // Make room for icon
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="words"
        />

        {/* Validation Icon - positioned inside input */}
        {searchText.trim() && (
          <Stack
            position="absolute"
            right="$2"
            top="50%"
            transform={[{ translateY: -10 }]} // Half icon height
            zIndex={1}
          >
            <Ionicons
              name={isValid ? "checkmark" : "close"}
              size={20}
              color={isValid ? "#22c55e" : "#ef4444"} // Bold green/red
            />
          </Stack>
        )}
      </Stack>

      {/* Dropdown Results */}
      {showDropdown && !loading && filteredExercises.length > 0 && (
        <YStack
          backgroundColor="$backgroundStrong"
          borderColor="$borderSoft"
          borderWidth={1}
          borderRadius="$3"
          maxHeight={240}
          marginTop="$1"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredExercises.map((exercise, index) => (
              <Stack
                key={exercise.id}
                padding="$3"
                borderBottomWidth={index < filteredExercises.length - 1 ? 1 : 0}
                borderBottomColor="$borderSoft"
                pressStyle={{ backgroundColor: "$backgroundPress" }}
                onPress={() => handleSelectExercise(exercise)}
              >
                <Text color="$color" fontSize="$4" fontWeight="500">
                  {exercise.standard_name}
                </Text>
              </Stack>
            ))}
          </ScrollView>
        </YStack>
      )}

      {/* Loading state */}
      {showDropdown && loading && (
        <YStack
          backgroundColor="$backgroundStrong"
          borderColor="$borderSoft"
          borderWidth={1}
          borderRadius="$3"
          padding="$3"
          marginTop="$1"
        >
          <Text color="$textSoft" fontSize="$3" textAlign="center">
            Loading exercises...
          </Text>
        </YStack>
      )}

      {/* No results state */}
      {showDropdown &&
        !loading &&
        searchText.length > 0 &&
        filteredExercises.length === 0 && (
          <YStack
            backgroundColor="$backgroundStrong"
            borderColor="$borderSoft"
            borderWidth={1}
            borderRadius="$3"
            padding="$3"
            marginTop="$1"
          >
            <Text color="$textSoft" fontSize="$3" textAlign="center">
              No exercises found
            </Text>
          </YStack>
        )}
    </YStack>
  );
};

export default ExerciseSearchInput;
