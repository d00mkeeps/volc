import { useUserSessionStore } from "@/stores/userSessionStore";
import { useMemo } from "react";

export function useWorkoutSession() {
  const isActive = useUserSessionStore((state) => state.isActive);
  const currentWorkout = useUserSessionStore((state) => state.currentWorkout);
  const showTemplateSelector = useUserSessionStore(
    (state) => state.showTemplateSelector
  );
  const selectedTemplate = useUserSessionStore(
    (state) => state.selectedTemplate
  );

  const progress = useMemo(() => {
    if (!currentWorkout) return { completed: 0, total: 0 };

    const totalSets =
      currentWorkout.workout_exercises?.reduce(
        (sum, exercise) => sum + (exercise.workout_exercise_sets?.length || 0),
        0
      ) || 0;

    // Count sets as completed if they have any actual data
    const completedSets =
      currentWorkout.workout_exercises?.reduce(
        (sum, exercise) =>
          sum +
          (exercise.workout_exercise_sets?.filter(
            (set) =>
              set.weight !== undefined ||
              set.reps !== undefined ||
              set.distance !== undefined ||
              set.duration !== undefined
          ).length || 0),
        0
      ) || 0;

    return { completed: completedSets, total: totalSets };
  }, [currentWorkout?.workout_exercises]);

  return {
    isActive,
    currentWorkout,
    showTemplateSelector,
    selectedTemplate,
    progress,
  };
}
