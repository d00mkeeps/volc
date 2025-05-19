// components/workout/organisms/WorkoutCreateModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CompleteWorkout } from "@/types/workout";
import WorkoutModalHeader from "../molecules/WorkoutModalHeader";
import WorkoutNotesList from "../molecules/WorkoutNotesList";
import WorkoutExerciseList from "./WorkoutExerciseList";
import TemplateSelector from "../molecules/TemplateSelector";
import { useAuth } from "@/context/AuthContext";
import { WorkoutService } from "@/services/db/workout";
import { useWorkout } from "@/context/WorkoutContext";
import { useWorkoutAnalysis } from "@/hooks/useWorkoutAnalysis";

interface WorkoutCreateModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (workout: CompleteWorkout) => Promise<void>;
  templates: CompleteWorkout[];
}

const WorkoutCreateModal: React.FC<WorkoutCreateModalProps> = ({
  isVisible,
  onClose,
  onSave,
  templates,
}) => {
  const [workout, setWorkout] = useState<CompleteWorkout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [templateValues, setTemplateValues] = useState<{
    exerciseIds: Set<string>;
    setIds: Set<string>;
  }>({ exerciseIds: new Set(), setIds: new Set() });
  const [modifiedFields, setModifiedFields] = useState<Record<string, boolean>>(
    {}
  );
  const { fetchTemplates, templates: contextTemplates } = useWorkout();
  const { user } = useAuth();
  const workoutService = new WorkoutService();
  const { analyzeWorkout } = useWorkoutAnalysis();

  useEffect(() => {
    if (isVisible && user?.id) {
      fetchTemplates(user.id);
    }
  }, [isVisible, user, fetchTemplates]);

  // Initialize empty workout when modal opens
  useEffect(() => {
    if (isVisible && !workout) {
      createEmptyWorkout();
    }
  }, [isVisible]);

  const createEmptyWorkout = () => {
    const now = new Date().toISOString();
    setWorkout({
      id: `temp-${Date.now()}`,
      user_id: user?.id || "",
      name: "",
      notes: JSON.stringify([""]),
      created_at: now,
      updated_at: now,
      workout_exercises: [],
    });
  };

  const handleTemplateSelect = async (template: CompleteWorkout) => {
    // Deep copy the template
    const now = new Date().toISOString();
    const newWorkout: CompleteWorkout = {
      ...JSON.parse(JSON.stringify(template)), // Deep copy
      id: `temp-${Date.now()}`,
      template_id: template.id,
      is_template: false,
      created_at: now,
      updated_at: now,
      notes: JSON.stringify([""]), // Start with empty notes
    };

    setWorkout(newWorkout);
    setSelectedTemplateId(template.id);
    setModifiedFields({}); // Reset modified fields
    console.log(
      "Template exercises with definition_ids:",
      template.workout_exercises.map((exercise) => ({
        name: exercise.name,
        definition_id: exercise.definition_id,
        exercise_id: exercise.id,
      }))
    );

    try {
      await workoutService.updateTemplateUsage(template.id);
    } catch (error) {
      console.error("Failed to update template usage:", error);
    }
  };
  // Add a function to track modified fields
  const markFieldAsModified = (fieldId: string) => {
    setModifiedFields((prev) => ({ ...prev, [fieldId]: true }));
  };

  const handleWorkoutChange = (updatedWorkout: CompleteWorkout) => {
    setWorkout(updatedWorkout);
  };

  const validateWorkout = (workout: CompleteWorkout): string[] => {
    const errors: string[] = [];

    if (!workout.name?.trim()) {
      errors.push("Workout name is required");
    }

    if (!workout.workout_exercises?.length) {
      errors.push("At least one exercise is required");
    } else {
      workout.workout_exercises.forEach((exercise, index) => {
        if (!exercise.name?.trim()) {
          errors.push(`Exercise ${index + 1} requires a name`);
        }
        if (!exercise.workout_exercise_sets?.length) {
          errors.push(
            `Exercise ${exercise.name || index + 1} requires at least one set`
          );
        }
      });
    }

    return errors;
  };

  const handleClose = () => {
    if (workout && (workout.name || workout.workout_exercises.length > 0)) {
      Alert.alert(
        "Discard Workout",
        "Are you sure you want to discard this workout?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setWorkout(null);
              setSelectedTemplateId(null);
              onClose();
            },
          },
        ]
      );
    } else {
      setWorkout(null);
      setSelectedTemplateId(null);
      onClose();
    }
  };

  const handleSave = async () => {
    if (!workout) return;

    console.log(
      "Saving workout with exercises:",
      workout.workout_exercises.map((ex) => ({
        name: ex.name,
        definitionId: ex.definition_id,
      }))
    );

    const errors = validateWorkout(workout);
    if (errors.length > 0) {
      Alert.alert("Validation Error", errors.join("\n"), [{ text: "OK" }]);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(workout);

      Alert.alert("Workout Saved", "Would you like to analyze this workout?", [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              console.log(`analysing workout: ${workout}`);
              await analyzeWorkout(workout);
            } catch (error) {
              Alert.alert("Error", "Failed to start workout analysis");
            }
          },
        },
      ]);

      setWorkout(null);
      setSelectedTemplateId(null);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to save workout", [{ text: "OK" }]);
    } finally {
      setIsSaving(false);
    }
  };

  if (!workout) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClose}
              disabled={isSaving}
            >
              <Ionicons
                name="close"
                size={24}
                color={isSaving ? "#666" : "#fff"}
              />
            </TouchableOpacity>
          </View>

          {/* Template Selector */}
          <TemplateSelector
            templates={contextTemplates || []}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={handleTemplateSelect}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {workout ? (
              <>
                <WorkoutModalHeader
                  workout={workout}
                  editMode={true}
                  onWorkoutChange={(value) => {
                    if (typeof value === "function") {
                      setWorkout((prev) => value(prev!));
                    } else {
                      setWorkout(value);
                    }
                  }}
                  onDeletePress={() => {}}
                  hideDeleteButton={true}
                />

                <WorkoutNotesList
                  notes={workout.notes || ""}
                  editMode={true}
                  onNotesChange={(notes) =>
                    setWorkout((prev) => ({ ...prev!, notes }))
                  }
                />

                <WorkoutExerciseList
                  exercises={workout.workout_exercises || []}
                  editMode={true}
                  onExercisesChange={(exercises) =>
                    setWorkout((prev) => ({
                      ...prev!,
                      workout_exercises: exercises,
                    }))
                  }
                  templateId={selectedTemplateId}
                  modifiedFields={modifiedFields}
                  onFieldModified={markFieldAsModified}
                />
              </>
            ) : (
              <View>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}
          </ScrollView>

          {/* Floating action button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons
              name={isSaving ? "hourglass-outline" : "checkmark"}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#222",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: "80%",
    maxHeight: "90%",
    padding: 20,
    position: "relative",
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerButton: {
    padding: 8,
  },
  saveButton: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: "#446044",
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },

  scrollContent: {
    paddingBottom: 88, // Add extra padding for the floating button
  },
  loadingText: {
    color: "#fff",
    textAlign: "center",
    padding: 20,
  },
});

export default WorkoutCreateModal;
