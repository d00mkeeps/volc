// components/workout/organisms/ExerciseCreationModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExerciseDefinition } from "@/types/workout";
import { ExerciseDefinitionService } from "@/services/db/exerciseDefinition";
import MuscleGroupSelector from "../molecules/MuscleGroupSelector";

interface ExerciseCreationModalProps {
  isVisible: boolean;
  initialName?: string;
  onClose: () => void;
  onExerciseCreated: (exercise: ExerciseDefinition) => void;
}

const movementPatterns = [
  "Push",
  "Pull",
  "Squat",
  "Hinge",
  "Carry",
  "Rotation",
  "Lunge",
  "Isometric",
];

const ExerciseCreationModal: React.FC<ExerciseCreationModalProps> = ({
  isVisible,
  initialName = "",
  onClose,
  onExerciseCreated,
}) => {
  const [name, setName] = useState(initialName);
  const [baseMovement, setBaseMovement] = useState("");
  const [majorVariation, setMajorVariation] = useState("");
  const [movementPattern, setMovementPattern] = useState("Push");
  const [equipment, setEquipment] = useState("");
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [usesWeight, setUsesWeight] = useState(true);
  const [usesReps, setUsesReps] = useState(true);
  const [usesRPE, setUsesRPE] = useState(false);
  const [usesDuration, setUsesDuration] = useState(false);
  const [usesDistance, setUsesDistance] = useState(false);
  const [isBodyweight, setIsBodyweight] = useState(false);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const exerciseService = new ExerciseDefinitionService();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Exercise name is required";
    }

    if (!baseMovement.trim()) {
      newErrors.baseMovement = "Base movement is required";
    }

    if (primaryMuscles.length === 0) {
      newErrors.primaryMuscles = "At least one primary muscle is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const newExercise = {
        base_movement: baseMovement,
        major_variation: majorVariation || null,
        standard_name: name,
        aliases: [] as string[],
        equipment: equipment || null,
        movement_pattern: movementPattern,
        primary_muscles: primaryMuscles,
        secondary_muscles:
          secondaryMuscles.length > 0 ? secondaryMuscles : null,
        uses_weight: usesWeight,
        uses_reps: usesReps,
        uses_rpe: usesRPE,
        uses_duration: usesDuration,
        uses_distance: usesDistance,
        is_bodyweight: isBodyweight,
        description: description || null,
        is_default: false,
      };

      const createdExercise = await exerciseService.createExerciseDefinition(
        newExercise
      );
      onExerciseCreated(createdExercise);
      resetForm();
    } catch (error) {
      console.error("Failed to create exercise:", error);
      setErrors({
        form: "Failed to create exercise. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setBaseMovement("");
    setMajorVariation("");
    setMovementPattern("Push");
    setEquipment("");
    setPrimaryMuscles([]);
    setSecondaryMuscles([]);
    setUsesWeight(true);
    setUsesReps(true);
    setUsesRPE(false);
    setUsesDuration(false);
    setUsesDistance(false);
    setIsBodyweight(false);
    setDescription("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Exercise</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Exercise Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Exercise Name*</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="Enter exercise name"
                placeholderTextColor="#666"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Base Movement */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Base Movement*</Text>
              <TextInput
                style={[styles.input, errors.baseMovement && styles.inputError]}
                value={baseMovement}
                onChangeText={setBaseMovement}
                placeholder="E.g., Squat, Bench Press, Pull-up"
                placeholderTextColor="#666"
              />
              {errors.baseMovement && (
                <Text style={styles.errorText}>{errors.baseMovement}</Text>
              )}
            </View>

            {/* Variation */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Major Variation</Text>
              <TextInput
                style={styles.input}
                value={majorVariation}
                onChangeText={setMajorVariation}
                placeholder="E.g., Barbell, Dumbbell, Single-arm"
                placeholderTextColor="#666"
              />
            </View>

            {/* Movement Pattern */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Movement Pattern*</Text>
              <View style={styles.chipContainer}>
                {movementPatterns.map((pattern) => (
                  <TouchableOpacity
                    key={pattern}
                    style={[
                      styles.chip,
                      movementPattern === pattern && styles.selectedChip,
                    ]}
                    onPress={() => setMovementPattern(pattern)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        movementPattern === pattern && styles.selectedChipText,
                      ]}
                    >
                      {pattern}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Equipment */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Equipment</Text>
              <TextInput
                style={styles.input}
                value={equipment}
                onChangeText={setEquipment}
                placeholder="E.g., Barbell, Kettlebell, Machine"
                placeholderTextColor="#666"
              />
            </View>

            {/* Primary Muscles */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Primary Muscles*</Text>
              <MuscleGroupSelector
                selectedMuscles={primaryMuscles}
                onSelectionChange={setPrimaryMuscles}
                error={errors.primaryMuscles}
              />
            </View>

            {/* Secondary Muscles */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Secondary Muscles</Text>
              <MuscleGroupSelector
                selectedMuscles={secondaryMuscles}
                onSelectionChange={setSecondaryMuscles}
              />
            </View>

            {/* Exercise Metrics */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Exercise Metrics</Text>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Uses Weight</Text>
                <Switch
                  value={usesWeight}
                  onValueChange={setUsesWeight}
                  trackColor={{ false: "#444", true: "#446044" }}
                  thumbColor={usesWeight ? "#8cd884" : "#f4f3f4"}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Uses Reps</Text>
                <Switch
                  value={usesReps}
                  onValueChange={setUsesReps}
                  trackColor={{ false: "#444", true: "#446044" }}
                  thumbColor={usesReps ? "#8cd884" : "#f4f3f4"}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Uses RPE</Text>
                <Switch
                  value={usesRPE}
                  onValueChange={setUsesRPE}
                  trackColor={{ false: "#444", true: "#446044" }}
                  thumbColor={usesRPE ? "#8cd884" : "#f4f3f4"}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Uses Duration</Text>
                <Switch
                  value={usesDuration}
                  onValueChange={setUsesDuration}
                  trackColor={{ false: "#444", true: "#446044" }}
                  thumbColor={usesDuration ? "#8cd884" : "#f4f3f4"}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Uses Distance</Text>
                <Switch
                  value={usesDistance}
                  onValueChange={setUsesDistance}
                  trackColor={{ false: "#444", true: "#446044" }}
                  thumbColor={usesDistance ? "#8cd884" : "#f4f3f4"}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Bodyweight Exercise</Text>
                <Switch
                  value={isBodyweight}
                  onValueChange={setIsBodyweight}
                  trackColor={{ false: "#444", true: "#446044" }}
                  thumbColor={isBodyweight ? "#8cd884" : "#f4f3f4"}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter exercise description, tips, or form notes"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {errors.form && (
              <Text style={styles.formErrorText}>{errors.form}</Text>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>
                {isSaving ? "Saving..." : "Save Exercise"}
              </Text>
            </TouchableOpacity>
          </View>
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContent: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#ddd",
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
    marginTop: 4,
  },
  formErrorText: {
    color: "#ff4444",
    fontSize: 16,
    textAlign: "center",
    padding: 10,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: "#446044",
  },
  chipText: {
    color: "#ddd",
  },
  selectedChipText: {
    color: "#fff",
    fontWeight: "bold",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  switchLabel: {
    color: "#ddd",
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  saveButton: {
    flex: 2,
    backgroundColor: "#446044",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ExerciseCreationModal;
