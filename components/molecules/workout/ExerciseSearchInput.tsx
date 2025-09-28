import React, { useState, useEffect } from "react";
import { YStack, Stack, XStack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Input from "@/components/atoms/core/Input";
import { View, TouchableOpacity } from "react-native";
import { useExerciseStore } from "@/stores/workout/exerciseStore";
import { ExerciseDefinition } from "@/types/workout";
import { Check, X, Info } from "@/assets/icons/IconMap";
import ExerciseDefinitionView from "./ExerciseDefinitionView";

interface ExerciseSearchInputProps {
  value: string;
  onSelect: (exerciseName: string) => void;
  placeholder?: string;
  onValidationChange?: (isValid: boolean) => void;
  isReplacing?: boolean; // New prop to indicate if we're replacing an existing exercise
}

const ExerciseSearchInput: React.FC<ExerciseSearchInputProps> = ({
  value,
  onSelect,
  placeholder = "Search exercises...",
  onValidationChange,
  isReplacing = false,
}) => {
  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [definitionModalVisible, setDefinitionModalVisible] = useState(false);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<
    string | null
  >(null);

  const { exercises, loading } = useExerciseStore();

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

  const handleShowDefinition = (exercise: ExerciseDefinition) => {
    setSelectedDefinitionId(exercise.id);
    setDefinitionModalVisible(true);
  };

  const handleFocus = () => {
    if (searchText.length > 0) {
      setShowDropdown(true);
    }
  };

  const renderExerciseItem = (exercise: ExerciseDefinition, index: number) => (
    <View
      key={exercise.id}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: index < filteredExercises.length - 1 ? 1 : 0,
        borderBottomColor: "#333",
        backgroundColor: "#222",
      }}
    >
      <TouchableOpacity
        onPress={() => handleSelectExercise(exercise)}
        style={{ flex: 1 }}
      >
        <Text color="$color" size="medium" fontWeight="500">
          {exercise.standard_name}
        </Text>
        {exercise.primary_muscles && exercise.primary_muscles.length > 0 && (
          <Text color="$textMuted" size="small" marginTop="$0.5">
            {exercise.primary_muscles
              .slice(0, 2)
              .map((muscle) =>
                muscle
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())
              )
              .join(", ")}
            {exercise.primary_muscles.length > 2 && "..."}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          handleShowDefinition(exercise);
        }}
        style={{
          padding: 8,
          marginLeft: 8,
          borderRadius: 6,
          backgroundColor: "#333",
        }}
      >
        <Info size={16} color="#666" />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <XStack flex={1} gap="$2" justifyContent="center" alignContent="center">
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
          size="medium"
          fontWeight="600"
          borderRadius="$3"
          paddingHorizontal="$3"
          paddingVertical="$2"
          onFocus={handleFocus}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {isValid ? (
          <Stack justifyContent="center">
            <Check size={20} color="#22c55e" />
          </Stack>
        ) : (
          <Stack justifyContent="center">
            <X size={20} color="#ef4444" />
          </Stack>
        )}
      </XStack>

      {/* Search Results */}
      {showDropdown && !loading && filteredExercises.length > 0 && (
        <View
          style={{
            backgroundColor: "#222",
            borderColor: "#333",
            borderWidth: 1,
            borderRadius: 12,
            maxHeight: 300,
          }}
        >
          {filteredExercises.map((exercise, index) =>
            renderExerciseItem(exercise, index)
          )}
        </View>
      )}

      {/* No Results */}
      {showDropdown &&
        !loading &&
        searchText.length > 0 &&
        filteredExercises.length === 0 && (
          <View
            style={{
              backgroundColor: "#222",
              borderColor: "#333",
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text color="$textMuted" size="medium" textAlign="center">
              No exercises found for "{searchText}"
            </Text>
          </View>
        )}

      {/* Search Instructions */}
      {!showDropdown && !searchText.trim() && (
        <Text size="small" color="$textMuted">
          Start typing to search exercises by name or muscle group
        </Text>
      )}

      {/* Exercise Definition Modal */}
      <ExerciseDefinitionView
        definitionId={selectedDefinitionId || ""}
        isVisible={definitionModalVisible && !!selectedDefinitionId}
        onClose={() => {
          setDefinitionModalVisible(false);
          setSelectedDefinitionId(null);
        }}
      />
    </>
  );
};

export default ExerciseSearchInput;
