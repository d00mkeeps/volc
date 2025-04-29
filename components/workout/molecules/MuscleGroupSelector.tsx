// components/workout/molecules/MuscleGroupSelector.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MuscleGroupSelectorProps {
  selectedMuscles: string[];
  onSelectionChange: (muscles: string[]) => void;
  error?: string;
}

const muscleGroups = {
  "Upper Body": [
    "Chest",
    "Shoulders",
    "Biceps",
    "Triceps",
    "Forearms",
    "Traps",
    "Lats",
  ],
  Core: ["Abs", "Obliques", "Lower Back"],
  "Lower Body": [
    "Glutes",
    "Quads",
    "Hamstrings",
    "Calves",
    "Hip Flexors",
    "Adductors",
  ],
};

const MuscleGroupSelector: React.FC<MuscleGroupSelectorProps> = ({
  selectedMuscles,
  onSelectionChange,
  error,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleMuscle = (muscle: string) => {
    const newSelection = [...selectedMuscles];

    if (newSelection.includes(muscle)) {
      // Remove muscle if already selected
      const index = newSelection.indexOf(muscle);
      newSelection.splice(index, 1);
    } else {
      // Add muscle if not already selected
      newSelection.push(muscle);
    }

    onSelectionChange(newSelection);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setIsModalVisible(true)}
      >
        {selectedMuscles.length > 0 ? (
          <View style={styles.selectedContainer}>
            {selectedMuscles.map((muscle) => (
              <View key={muscle} style={styles.selectedItem}>
                <Text style={styles.selectedText}>{muscle}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select muscle groups</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#8cd884" />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Muscle Groups</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {Object.entries(muscleGroups).map(([category, muscles]) => (
                <View key={category} style={styles.category}>
                  <Text style={styles.categoryTitle}>{category}</Text>

                  <View style={styles.muscleContainer}>
                    {muscles.map((muscle) => (
                      <TouchableOpacity
                        key={muscle}
                        style={[
                          styles.muscleItem,
                          selectedMuscles.includes(muscle) &&
                            styles.selectedMuscle,
                        ]}
                        onPress={() => toggleMuscle(muscle)}
                      >
                        <Text
                          style={[
                            styles.muscleText,
                            selectedMuscles.includes(muscle) &&
                              styles.selectedMuscleText,
                          ]}
                        >
                          {muscle}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorError: {
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  placeholderText: {
    color: "#666",
    flex: 1,
  },
  selectedContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  selectedItem: {
    backgroundColor: "#446044",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  selectedText: {
    color: "#fff",
    fontSize: 14,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#222",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBody: {
    marginBottom: 20,
  },
  category: {
    marginBottom: 20,
  },
  categoryTitle: {
    color: "#8cd884",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  muscleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  muscleItem: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedMuscle: {
    backgroundColor: "#446044",
  },
  muscleText: {
    color: "#ddd",
  },
  selectedMuscleText: {
    color: "#fff",
    fontWeight: "bold",
  },
  doneButton: {
    backgroundColor: "#446044",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MuscleGroupSelector;
