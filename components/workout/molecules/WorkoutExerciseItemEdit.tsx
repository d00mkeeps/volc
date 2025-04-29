// components/workout/molecules/WorkoutExerciseItemEdit.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutExercise, WorkoutField, WorkoutSet } from "@/types/workout";
import WorkoutSetEditor from "../atoms/WorkoutSetEditor";
import ExerciseSearch from "./ExerciseSearch";
import { ExerciseDefinition } from "@/types/workout";

interface WorkoutExerciseItemEditProps {
  exercise: WorkoutExercise;
  isLastExercise: boolean;
  onExerciseChange: (exercise: WorkoutExercise) => void;
  onDeleteExercise: () => void;
  templateId?: string | null;
  modifiedFields?: Record<string, boolean>;
  onFieldModified?: (fieldId: string) => void;
}

const WorkoutExerciseItemEdit: React.FC<WorkoutExerciseItemEditProps> = ({
  exercise,
  isLastExercise,
  onExerciseChange,
  onDeleteExercise,
  templateId,
  modifiedFields,
  onFieldModified,
}) => {
  const [visibleFields, setVisibleFields] = useState<Set<WorkoutField>>(() => {
    const fields = new Set<WorkoutField>();
    exercise.workout_exercise_sets.forEach((set) => {
      if (set.weight !== null) fields.add("weight");
      if (set.reps !== null) fields.add("reps");
      if (set.rpe !== null) fields.add("rpe");
      if (set.distance !== null) fields.add("distance");
      if (set.duration !== null) fields.add("duration");
    });
    if (fields.size === 0) fields.add("reps");
    return fields;
  });

  const isTemplateField = (fieldId: string): boolean => {
    return Boolean(templateId && !modifiedFields?.[fieldId]);
  };

  const handleExerciseSelect = (selectedExercise: ExerciseDefinition) => {
    console.log("Exercise selection received in item edit:", {
      id: selectedExercise.id,
      name: selectedExercise.standard_name,
    });

    // Update visible fields based on exercise definition
    const newFields = new Set<WorkoutField>();

    // Always include reps by default
    newFields.add("reps");

    // Add other fields based on exercise definition metrics
    if (selectedExercise.uses_weight) newFields.add("weight");
    if (selectedExercise.uses_rpe) newFields.add("rpe");
    if (selectedExercise.uses_distance) newFields.add("distance");
    if (selectedExercise.uses_duration) newFields.add("duration");

    setVisibleFields(newFields);

    // Update sets to include the necessary fields
    const updatedSets = exercise.workout_exercise_sets.map((set) => {
      const newSet = { ...set };

      // Initialize fields based on the exercise definition
      if (selectedExercise.uses_weight && set.weight === null)
        newSet.weight = 0;
      if (selectedExercise.uses_reps && set.reps === null) newSet.reps = 0;
      if (selectedExercise.uses_rpe && set.rpe === null) newSet.rpe = 0;
      if (selectedExercise.uses_distance && set.distance === null)
        newSet.distance = 0;
      if (selectedExercise.uses_duration && set.duration === null)
        newSet.duration = 0;

      return newSet;
    });

    // Update exercise with new definition-based data
    onExerciseChange({
      ...exercise,
      name: selectedExercise.standard_name,
      definition_id: selectedExercise.id,
      workout_exercise_sets: updatedSets,
    });
  };

  const handleSetChange = (updatedSet: WorkoutSet, index: number) => {
    const newSets = [...exercise.workout_exercise_sets];
    newSets[index] = updatedSet;

    onExerciseChange({
      ...exercise,
      workout_exercise_sets: newSets,
    });
  };

  const addSet = () => {
    const lastSet =
      exercise.workout_exercise_sets[exercise.workout_exercise_sets.length - 1];
    const newSet: WorkoutSet = {
      ...lastSet,
      id: `temp-${Date.now()}`, // Will be replaced on save
      set_number: lastSet.set_number + 1,
    };

    onExerciseChange({
      ...exercise,
      workout_exercise_sets: [...exercise.workout_exercise_sets, newSet],
    });
  };

  const deleteSet = (index: number) => {
    if (exercise.workout_exercise_sets.length === 1) {
      return; // Don't allow deleting the last set
    }

    const newSets = exercise.workout_exercise_sets.filter(
      (_, i) => i !== index
    );
    // Reorder set numbers
    newSets.forEach((set, i) => {
      set.set_number = i + 1;
    });

    onExerciseChange({
      ...exercise,
      workout_exercise_sets: newSets,
    });
  };

  return (
    <View style={[styles.container, !isLastExercise && styles.bottomBorder]}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <ExerciseSearch
            value={exercise.name}
            onSelect={handleExerciseSelect}
            isTemplateValue={isTemplateField(`exercise_${exercise.id}_name`)}
            onFieldModified={() =>
              onFieldModified?.(`exercise_${exercise.id}_name`)
            }
          />
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDeleteExercise}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.setsContainer}>
        {exercise.workout_exercise_sets
          .sort((a, b) => a.set_number - b.set_number)
          .map((set, index) => (
            <View key={set.id} style={styles.setRow}>
              <Text style={styles.setNumber}>{index + 1}</Text>
              <View style={styles.setEditorContainer}>
                <WorkoutSetEditor
                  set={set}
                  visibleFields={Array.from(visibleFields)}
                  onSetChange={(updatedSet) => {
                    handleSetChange(updatedSet, index);
                    onFieldModified?.(`set_${set.id}`);
                  }}
                  isLastSet={
                    index === exercise.workout_exercise_sets.length - 1
                  }
                  isTemplateValue={isTemplateField(`set_${set.id}`)}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.deleteSetButton,
                  exercise.workout_exercise_sets.length === 1 &&
                    styles.deleteSetButtonDisabled,
                ]}
                onPress={() => deleteSet(index)}
                disabled={exercise.workout_exercise_sets.length === 1}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={
                    exercise.workout_exercise_sets.length === 1
                      ? "#666"
                      : "#ff4444"
                  }
                />
              </TouchableOpacity>
            </View>
          ))}
      </View>

      <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
        <Ionicons name="add-circle-outline" size={20} color="#8cd884" />
        <Text style={styles.addSetText}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    overflow: "hidden",
  },
  bottomBorder: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#222",
  },
  nameContainer: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  setsContainer: {
    padding: 12,
  },
  setEditorContainer: {
    flex: 1,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  setNumber: {
    color: "#888",
    fontSize: 14,
    width: 24,
    textAlign: "center",
  },
  deleteSetButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteSetButtonDisabled: {
    opacity: 0.5,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  templateValue: {
    opacity: 0.6,
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#222",
  },
  addSetText: {
    color: "#8cd884",
    fontSize: 14,
    marginLeft: 8,
  },
});

export default WorkoutExerciseItemEdit;
