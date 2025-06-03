// import React from "react";
// import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { WorkoutExercise } from "@/types/workout";
// import WorkoutExerciseItem from "../molecules/WorkoutExerciseItem";
// import WorkoutExerciseItemEdit from "../molecules/WorkoutExerciseItemEdit";

// // Update the interface in WorkoutExerciseList.tsx
// interface WorkoutExerciseListProps {
//   exercises: WorkoutExercise[];
//   editMode: boolean;
//   onExercisesChange: (exercises: WorkoutExercise[]) => void;
//   workoutId?: string;
//   // Add these new props:
//   templateId?: string | null;
//   modifiedFields?: Record<string, boolean>;
//   onFieldModified?: (fieldId: string) => void;
//   // Keep the existing templateValues for backward compatibility
//   templateValues?: {
//     exerciseIds?: Set<string>;
//     setIds?: Set<string>;
//   } | null;
// }

// const WorkoutExerciseList: React.FC<WorkoutExerciseListProps> = ({
//   exercises,
//   editMode,
//   onExercisesChange,
//   workoutId,
//   // Add default values for all optional props
//   templateId = null,
//   modifiedFields = {},
//   onFieldModified = () => {},
//   templateValues = null,
// }) => {
//   // Ensure exercises is always an array
//   const safeExercises = exercises || [];

//   // Create safe templateValues with all required properties
//   const safeTemplateValues = {
//     exerciseIds: new Set<string>(templateValues?.exerciseIds || []),
//     setIds: new Set<string>(templateValues?.setIds || []),
//   };

//   const sortedExercises = [...safeExercises].sort(
//     (a, b) => (a.order_index || 0) - (b.order_index || 0)
//   );

//   const handleExerciseChange = (
//     updatedExercise: WorkoutExercise,
//     index: number
//   ) => {
//     console.log("Exercise changed in list:", {
//       name: updatedExercise.name,
//       definitionId: updatedExercise.definition_id,
//     });

//     const newExercises = [...safeExercises];
//     newExercises[index] = updatedExercise;
//     onExercisesChange(newExercises);
//   };

//   const handleDeleteExercise = (index: number) => {
//     if (safeExercises.length <= 1) {
//       return; // Don't allow deleting the last exercise
//     }

//     const newExercises = safeExercises.filter((_, i) => i !== index);
//     // Reorder exercise indices
//     newExercises.forEach((exercise, i) => {
//       exercise.order_index = i;
//     });
//     onExercisesChange(newExercises);
//   };

//   const addExercise = () => {
//     const now = new Date().toISOString();
//     const newExercise: WorkoutExercise = {
//       id: `temp-${Date.now()}`,
//       workout_id:
//         safeExercises.length > 0
//           ? safeExercises[0].workout_id
//           : workoutId || `temp-workout-${Date.now()}`,
//       name: "",
//       order_index: safeExercises.length,
//       weight_unit: "kg",
//       distance_unit: "m",
//       created_at: now,
//       updated_at: now,
//       workout_exercise_sets: [
//         {
//           id: `temp-set-${Date.now()}`,
//           exercise_id: `temp-${Date.now()}`,
//           set_number: 1,
//           weight: null,
//           reps: null,
//           rpe: null,
//           distance: null,
//           duration: null,
//           created_at: now,
//           updated_at: now,
//         },
//       ],
//     };

//     onExercisesChange([...safeExercises, newExercise]);
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.sectionTitle}>Exercises</Text>
//       {sortedExercises.map((exercise, index) =>
//         editMode ? (
//           <WorkoutExerciseItemEdit
//             key={exercise.id || `exercise-${index}`}
//             exercise={exercise}
//             isLastExercise={index === safeExercises.length - 1}
//             onExerciseChange={(updatedExercise) =>
//               handleExerciseChange(updatedExercise, index)
//             }
//             onDeleteExercise={() => handleDeleteExercise(index)}
//             templateId={templateId}
//             // Ensure modifiedFields is always an object, never undefined
//             modifiedFields={modifiedFields || {}}
//             // Ensure onFieldModified is always a function, never undefined
//             onFieldModified={onFieldModified || (() => {})}
//           />
//         ) : (
//           <WorkoutExerciseItem
//             key={exercise.id || `exercise-${index}`}
//             exercise={exercise}
//             isLastExercise={index === safeExercises.length - 1}
//           />
//         )
//       )}
//       {editMode && (
//         <TouchableOpacity
//           style={styles.addExerciseButton}
//           onPress={addExercise}
//         >
//           <Ionicons name="add-circle-outline" size={20} color="#8cd884" />
//           <Text style={styles.addExerciseText}>Add Exercise</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingVertical: 16,
//   },
//   sectionTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 12,
//   },
//   addExerciseButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#1a1a1a",
//     padding: 16,
//     borderRadius: 8,
//     marginTop: 12,
//   },
//   addExerciseText: {
//     color: "#8cd884",
//     fontSize: 16,
//     marginLeft: 8,
//   },
// });

// export default WorkoutExerciseList;
