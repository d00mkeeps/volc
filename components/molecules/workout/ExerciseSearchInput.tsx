// components/molecules/ExerciseSearchInput.tsx
import React, { useState, useEffect } from "react";
import { Input, YStack, Text, Stack, ScrollView } from "tamagui";
import { View, TouchableOpacity } from "react-native"; // Use native components
import { useExerciseStore } from "@/stores/workout/exerciseStore";
import { ExerciseDefinition } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";

interface ExerciseSearchInputProps {
  value: string;
  onSelect: (exerciseName: string) => void;
  placeholder?: string;
  onValidationChange?: (isValid: boolean) => void;
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
    .slice(0, 8);

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

  const handleTextChange = (text: string) => {
    setSearchText(text);
    setShowDropdown(text.length > 0);
    const valid = validateExercise(text);
    setIsValid(valid);
    onValidationChange?.(valid);
  };

  const handleSelectExercise = (exercise: ExerciseDefinition) => {
    console.log("🎯 Exercise selected:", exercise.standard_name);
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
    // Don't hide dropdown on blur - let user tap
  };

  const renderExerciseItem = ({
    item,
    index,
  }: {
    item: ExerciseDefinition;
    index: number;
  }) => (
    <TouchableOpacity
      onPress={() => {
        console.log("🔥 TouchableOpacity pressed:", item.standard_name);
        handleSelectExercise(item);
      }}
      style={{
        padding: 12,
        borderBottomWidth: index < filteredExercises.length - 1 ? 1 : 0,
        borderBottomColor: "#333",
        backgroundColor: "#222",
      }}
    >
      <Text color="$color" fontSize="$4" fontWeight="500">
        {item.standard_name}
      </Text>
    </TouchableOpacity>
  );

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
          paddingRight={searchText.trim() ? "$6" : "$3"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="words"
        />

        {searchText.trim() && (
          <Stack
            position="absolute"
            right="$2"
            top="50%"
            transform={[{ translateY: -10 }]}
            zIndex={1}
          >
            <Ionicons
              name={isValid ? "checkmark" : "close"}
              size={20}
              color={isValid ? "#22c55e" : "#ef4444"}
            />
          </Stack>
        )}
      </Stack>

      {/* Replace the FlatList section with: */}
      {showDropdown && !loading && filteredExercises.length > 0 && (
        <View
          style={{
            backgroundColor: "#222",
            borderColor: "#333",
            borderWidth: 1,
            borderRadius: 12,
            marginTop: 4,
          }}
        >
          {filteredExercises.map((exercise, index) => (
            <TouchableOpacity
              key={exercise.id}
              onPress={() => handleSelectExercise(exercise)}
              style={{
                padding: 12,
                borderBottomWidth: index < filteredExercises.length - 1 ? 1 : 0,
                borderBottomColor: "#333",
                backgroundColor: "#222",
              }}
            >
              <Text color="$color" fontSize="$4" fontWeight="500">
                {exercise.standard_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </YStack>
  );
};

export default ExerciseSearchInput;
