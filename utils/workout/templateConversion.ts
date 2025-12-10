// import { CompleteWorkout } from "@/types/workout";

// export const convertTemplateToWorkout = (
//   templateData: any,
//   userId: string
// ): CompleteWorkout | null => {
//   if (!templateData || !userId) {
//     console.error(
//       "[templateConversion] Missing template data or user profile:",
//       {
//         hasTemplate: !!templateData,
//         hasUserId: !!userId,
//         templateData,
//       }
//     );
//     return null;
//   }

//   const template = templateData;
//   const now = new Date().toISOString();

//   const convertedWorkout: CompleteWorkout = {
//     id: `ai-template-${Date.now()}`,
//     user_id: userId,
//     name: template.name || "AI Generated Workout",
//     notes: template.notes || "",
//     is_template: true,
//     workout_exercises:
//       template.workout_exercises?.map((exercise: any, index: number) => ({
//         id: `exercise-${Date.now()}-${index}`,
//         definition_id: exercise.definition_id || undefined,
//         workout_id: `ai-template-${Date.now()}`,
//         name: exercise.name || `Exercise ${index + 1}`,
//         notes: exercise.notes || undefined,
//         order_index: exercise.order_index ?? index,
//         weight_unit: "kg",
//         distance_unit: "km",
//         workout_exercise_sets:
//           exercise.workout_exercise_sets?.map(
//             (set: any, setIndex: number) => ({
//               id: `set-${Date.now()}-${index}-${setIndex}`,
//               exercise_id: `exercise-${Date.now()}-${index}`,
//               set_number: set.set_number || setIndex + 1,
//               reps: set.reps || undefined,
//               weight: set.weight || undefined,
//               distance: set.distance || undefined,
//               duration: set.duration || undefined,
//               rpe: set.rpe || undefined,
//               is_completed: false,
//               created_at: now,
//               updated_at: now,
//             })
//           ) || [],
//         created_at: now,
//         updated_at: now,
//       })) || [],
//     created_at: now,
//     updated_at: now,
//   };

//   console.log("[templateConversion] Converted template:", {
//     originalName: template.name,
//     convertedName: convertedWorkout.name,
//     exerciseCount: convertedWorkout.workout_exercises.length,
//   });

//   return convertedWorkout;
// };
