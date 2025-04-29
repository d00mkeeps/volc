// components/workout/molecules/ExerciseSearch.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseContext } from "@/context/ExerciseContext";
import { ExerciseDefinition } from "@/types/workout";
import ExerciseCreationModal from "../organisms/ExerciseCreateModal";

interface ExerciseSearchProps {
  value: string;
  onSelect: (exercise: ExerciseDefinition) => void;
  isTemplateValue?: boolean;
  onFieldModified?: () => void;
}

const muscleGroupColors = {
  chest: "#ff4d4d",
  shoulders: "#ff8c40",
  biceps: "#ffcc33",
  back: "#99cc33",
  triceps: "#4caf50",
  forearms: "#33ccaa",
  abs: "#33aacc",
  obliques: "#3366cc",
  glutes: "#6633cc",
  hamstrings: "#9933cc",
  quads: "#cc33aa",
  calves: "#f06292",
  // Default for any unlisted muscle
  default: "#888888",
};

const ExerciseSearch: React.FC<ExerciseSearchProps> = ({
  value,
  onSelect,
  isTemplateValue = false,
  onFieldModified,
}) => {
  const { exercises, loading } = useExerciseContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState<ExerciseDefinition[]>([]);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);

  const dropdownHeight = useRef(new Animated.Value(0)).current;

  // Filter exercises based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Show recent or popular exercises when no search term
      setResults(exercises.slice(0, 10));
      return;
    }

    const normalizedTerm = searchTerm.toLowerCase();
    const filtered = exercises.filter((exercise) => {
      // Search in name
      if (exercise.standard_name.toLowerCase().includes(normalizedTerm)) {
        return true;
      }

      // Search in base movement
      if (exercise.base_movement.toLowerCase().includes(normalizedTerm)) {
        return true;
      }

      // Search in muscles (both primary and secondary)
      if (
        exercise.primary_muscles.some((muscle) =>
          muscle.toLowerCase().includes(normalizedTerm)
        )
      ) {
        return true;
      }

      if (
        exercise.secondary_muscles &&
        Array.isArray(exercise.secondary_muscles) &&
        exercise.secondary_muscles.some((muscle) =>
          muscle.toLowerCase().includes(normalizedTerm)
        )
      ) {
        return true;
      }

      // Search in movement pattern
      if (exercise.movement_pattern.toLowerCase().includes(normalizedTerm)) {
        return true;
      }

      // Search in aliases
      if (exercise.aliases && Array.isArray(exercise.aliases)) {
        if (
          exercise.aliases.some((alias) =>
            alias.toLowerCase().includes(normalizedTerm)
          )
        ) {
          return true;
        }
      }

      return false;
    });

    // Sort by relevance
    filtered.sort((a, b) => {
      const aName = a.standard_name.toLowerCase();
      const bName = b.standard_name.toLowerCase();

      // Exact matches first
      if (aName === normalizedTerm && bName !== normalizedTerm) return -1;
      if (bName === normalizedTerm && aName !== normalizedTerm) return 1;

      // Then starts with matches
      if (aName.startsWith(normalizedTerm) && !bName.startsWith(normalizedTerm))
        return -1;
      if (bName.startsWith(normalizedTerm) && !aName.startsWith(normalizedTerm))
        return 1;

      // Then alphabetical
      return aName.localeCompare(bName);
    });

    setResults(filtered);
  }, [searchTerm, exercises]);

  const handleFocus = () => {
    setIsExpanded(true);
    Animated.timing(dropdownHeight, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    // We'll handle blur in a different way to allow selecting items
  };

  const handleCreateExercise = (exercise: ExerciseDefinition) => {
    // Close the modal
    setIsCreationModalOpen(false);

    // Select the newly created exercise
    handleExerciseSelect(exercise);
  };

  const handleCloseDropdown = () => {
    setIsExpanded(false);
    setSearchTerm("");
    Animated.timing(dropdownHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    Keyboard.dismiss();
  };

  const handleExerciseSelect = (exercise: ExerciseDefinition) => {
    console.log("Exercise selected in search:", {
      id: exercise.id,
      name: exercise.standard_name,
      primaryMuscles: exercise.primary_muscles,
    });
    onSelect(exercise);
    onFieldModified?.();
    handleCloseDropdown();
  };

  const renderMuscleTags = (muscles: string[], isSecondary = false) => {
    if (!muscles || muscles.length === 0) return null;

    return (
      <View style={styles.muscleContainer}>
        {muscles.map((muscle, index) => {
          const muscleColor =
            muscleGroupColors[
              muscle.toLowerCase() as keyof typeof muscleGroupColors
            ] || muscleGroupColors.default;

          return (
            <View
              key={`${muscle}-${index}-${isSecondary ? "sec" : "pri"}`}
              style={[
                styles.muscleTag,
                { backgroundColor: muscleColor },
                isSecondary && styles.secondaryMuscleTag,
              ]}
            >
              <Text
                style={[
                  styles.muscleText,
                  isSecondary && styles.secondaryMuscleText,
                ]}
              >
                {muscle}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderResultItem = (exercise: ExerciseDefinition) => {
    return (
      <TouchableOpacity
        key={`result-${exercise.id}`}
        style={styles.resultItem}
        onPress={() => handleExerciseSelect(exercise)}
      >
        <Text style={styles.exerciseTitle}>{exercise.standard_name}</Text>

        {/* Primary muscle groups */}
        {renderMuscleTags(exercise.primary_muscles)}

        {/* Secondary muscle groups */}
        {exercise.secondary_muscles &&
          exercise.secondary_muscles.length > 0 &&
          renderMuscleTags(exercise.secondary_muscles, true)}

        <View style={styles.exerciseDetails}>
          <Text style={styles.movementPattern}>
            {exercise.movement_pattern}
          </Text>
          <Text style={styles.creator}>
            {exercise.is_default ? "volc" : "custom"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.inputContainer, isTemplateValue && styles.templateValue]}
      >
        <TextInput
          style={styles.input}
          value={isExpanded ? searchTerm : value}
          onChangeText={setSearchTerm}
          placeholder="Search exercises..."
          placeholderTextColor="#666"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </View>

      {isExpanded && (
        <>
          <TouchableOpacity
            style={styles.backdropOverlay}
            activeOpacity={1}
            onPress={handleCloseDropdown}
          />

          <Animated.View
            style={[
              styles.dropdown,
              {
                maxHeight: dropdownHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
              },
            ]}
          >
            {loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Loading exercises...</Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No matching exercises found
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.scrollContainer}>
                {results.map((exercise) => renderResultItem(exercise))}
              </ScrollView>
            )}

            <ExerciseCreationModal
              isVisible={isCreationModalOpen}
              initialName={searchTerm}
              onClose={() => setIsCreationModalOpen(false)}
              onExerciseCreated={handleCreateExercise}
            />

            <TouchableOpacity
              style={styles.createNewButton}
              onPress={() => setIsCreationModalOpen(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#8cd884" />
              <Text style={styles.createNewText}>Create New Exercise</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 4,
    padding: 8,
  },
  templateValue: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: "#8cd884",
    fontSize: 18,
    fontWeight: "bold",
  },
  backdropOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  dropdown: {
    position: "absolute",
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: "#222",
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  scrollContainer: {
    maxHeight: 250,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  exerciseTitle: {
    color: "#8cd884",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  muscleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  muscleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  secondaryMuscleTag: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  muscleText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  secondaryMuscleText: {
    fontWeight: "normal",
  },
  exerciseDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  movementPattern: {
    color: "#bbb",
    fontSize: 14,
  },
  creator: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
  },
  emptyContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontStyle: "italic",
  },
  createNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  createNewText: {
    color: "#8cd884",
    marginLeft: 8,
    fontSize: 16,
  },
});

export default ExerciseSearch;
