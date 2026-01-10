import { BaseDBService } from "./base";
import { CompleteWorkout, WorkoutWithConversation } from "@/types/workout";
import { apiGet, apiPost, apiPut, apiDelete } from "../api/core/apiClient";

// Conversion constants
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

// Helper to recursively convert weights in a workout object
const convertWorkoutWeights = <T extends any>(obj: T, factor: number): T => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertWorkoutWeights(item, factor)) as any;
  }

  const newObj = { ...obj } as any;

  // If this object has a 'weight' field and it's a number, convert it
  if ("weight" in newObj && typeof newObj.weight === "number") {
    newObj.weight = Math.round(newObj.weight * factor * 100) / 100;
  }

  // If this object has 'workout_exercise_sets', recurse into it
  if (
    "workout_exercise_sets" in newObj &&
    Array.isArray(newObj.workout_exercise_sets)
  ) {
    newObj.workout_exercise_sets = newObj.workout_exercise_sets.map(
      (set: any) => convertWorkoutWeights(set, factor)
    );
  }

  // If this object has 'workout_exercises', recurse into it
  if (
    "workout_exercises" in newObj &&
    Array.isArray(newObj.workout_exercises)
  ) {
    newObj.workout_exercises = newObj.workout_exercises.map((ex: any) =>
      convertWorkoutWeights(ex, factor)
    );
  }

  return newObj;
};

export class WorkoutService extends BaseDBService {
  /**
   * Create a new workout and store it in the database with direct conversation ID
   */

  async createWorkout(
    userId: string,
    workout: CompleteWorkout | WorkoutWithConversation,
    isImperial: boolean = false
  ): Promise<CompleteWorkout> {
    try {
      const workoutId = "id" in workout ? workout.id : "N/A";

      console.log(
        `[WorkoutService] Creating workout: ${workoutId} with exercises:`
      );

      // Convert to metric for storage if user is imperial
      const workoutToSave = isImperial
        ? convertWorkoutWeights(workout, LBS_TO_KG)
        : workout;

      workoutToSave.workout_exercises?.forEach((exercise) => {
        const setCount = exercise.workout_exercise_sets?.length || 0;
        console.log(`    ${exercise.id} (${exercise.name}, ${setCount} sets)`);
      });

      const response = await apiPost<CompleteWorkout>(
        "/db/workouts",
        workoutToSave
      );
      console.log("[WorkoutService] API Response:", response);

      // Extract the actual workout data from the wrapped response
      let data = (response as any).data || response;

      // Convert back to imperial for display if needed
      if (isImperial) {
        data = convertWorkoutWeights(data, KG_TO_LBS);
      }

      return data;
    } catch (error: any) {
      // If workout ID already exists on server, treat as success
      if (error?.response?.status === 409 || error?.status === 409) {
        console.log(
          "[WorkoutService] Workout already exists on server (duplicate ID)"
        );
        // Return the workout that was attempted (it's already on server)
        return workout as CompleteWorkout;
      }

      console.error("[WorkoutService] Error creating workout:", error);
      throw error; // Re-throw for retry logic
    }
  }
  /**
   * Save a completed workout (convenience method that handles conversion)
   */
  async saveCompletedWorkout(
    userId: string,
    workout: CompleteWorkout,
    isImperial: boolean = false
  ): Promise<CompleteWorkout> {
    try {
      console.log("[WorkoutService] Saving completed workout:", workout.id);

      // Use existing createWorkout method with conversion support
      const result = await this.createWorkout(userId, workout, isImperial);

      console.log(
        "[WorkoutService] Completed workout saved with ID:",
        result.id
      );
      return result;
    } catch (error) {
      console.error("[WorkoutService] Error saving completed workout:", error);
      return this.handleError(error);
    }
  }

  /**
   * Get a workout by ID
   */
  async getWorkout(
    workoutId: string,
    isImperial: boolean = false
  ): Promise<CompleteWorkout> {
    try {
      console.log(`[WorkoutService] Getting workout: ${workoutId}`);

      // Make API call to get workout
      const data = await apiGet<CompleteWorkout>(`/db/workouts/${workoutId}`);

      console.log(
        `[WorkoutService] Successfully retrieved workout: ${workoutId}`
      );

      // Convert for display if needed
      return isImperial ? convertWorkoutWeights(data, KG_TO_LBS) : data;
    } catch (error) {
      console.error(
        `[WorkoutService] Error fetching workout ${workoutId}:`,
        error
      );
      return this.handleError(error);
    }
  }

  /**
   * Get all workouts for a user
   */
  async getUserWorkouts(
    userId: string,
    isImperial: boolean = false
  ): Promise<CompleteWorkout[]> {
    try {
      console.log(`[WorkoutService] Getting all workouts for user: ${userId}`);

      // Call the endpoint to get all user workouts (always in KG)
      const data = await apiGet<CompleteWorkout[]>("/db/workouts/user");

      console.log(
        `[WorkoutService] Retrieved ${data.length} workouts for user: ${userId}`
      );

      // Convert all workouts if needed
      return isImperial
        ? data.map((w) => convertWorkoutWeights(w, KG_TO_LBS))
        : data;
    } catch (error) {
      console.error(`[WorkoutService] Error fetching user workouts:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Get all workouts for a specific user filtered by conversation ID
   */
  async getWorkoutsByConversation(
    userId: string,
    conversationId: string,
    isImperial: boolean = false
  ): Promise<WorkoutWithConversation[]> {
    try {
      console.log(
        `[WorkoutService] Getting workouts for conversation: ${conversationId}`
      );

      // Make API call to get workouts for conversation
      const data = await apiGet<WorkoutWithConversation[]>("/db/workouts", {
        conversation_id: conversationId,
      });

      console.log(
        `[WorkoutService] Retrieved ${data.length} workouts for conversation: ${conversationId}`
      );

      return isImperial
        ? data.map((w) => convertWorkoutWeights(w, KG_TO_LBS))
        : data;
    } catch (error) {
      console.error(
        `[WorkoutService] Error fetching workouts for conversation ${conversationId}:`,
        error
      );
      return this.handleError(error);
    }
  }

  /**
   * Update an existing workout
   */
  async updateWorkout(
    workoutId: string,
    workout: Partial<CompleteWorkout>, // ✅ Changed from CompleteWorkout to Partial<CompleteWorkout>
    isImperial: boolean = false
  ): Promise<CompleteWorkout> {
    try {
      console.log(`[WorkoutService] Updating workout: ${workoutId}`);

      // Convert to metric for storage if user is imperial
      const workoutToSave = isImperial
        ? convertWorkoutWeights(workout, LBS_TO_KG)
        : workout;

      const data = await apiPut<CompleteWorkout>(
        `/db/workouts/${workoutId}`,
        workoutToSave
      );

      console.log(
        `[WorkoutService] Successfully updated workout: ${workoutId}`
      );

      return isImperial ? convertWorkoutWeights(data, KG_TO_LBS) : data;
    } catch (error) {
      console.error(`[WorkoutService] Error updating workout:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Delete all workouts for a specific conversation
   */
  async deleteConversationWorkouts(
    userId: string,
    conversationId: string
  ): Promise<void> {
    try {
      console.log(
        `[WorkoutService] Deleting all workouts for conversation: ${conversationId}`
      );

      // Make API call to delete all workouts for conversation
      await apiDelete(`/db/workouts/conversation/${conversationId}`);

      console.log(
        `[WorkoutService] Successfully deleted all workouts for conversation: ${conversationId}`
      );
    } catch (error) {
      console.error(
        `[WorkoutService] Error deleting conversation workouts:`,
        error
      );
      return this.handleError(error);
    }
  }

  /**
   * Update template usage timestamp
   */
  // async updateTemplateUsage(templateId: string): Promise<void> {
  //   try {
  //     console.log(`[WorkoutService] Updating template usage for workout: ${templateId}`);

  //     // Make API call to update template usage
  //     await apiPut(`/db/workouts/template/${templateId}`, {});

  //     console.log(`[WorkoutService] Successfully updated template usage for workout: ${templateId}`);
  //   } catch (error) {
  //     console.error(`[WorkoutService] Error updating template usage:`, error);
  //     return this.handleError(error);
  //   }
  // }

  /**
   * Get all workout templates for a user
   */
  async getTemplates(
    userId: string,
    isImperial: boolean = false
  ): Promise<CompleteWorkout[]> {
    try {
      console.log(
        `[WorkoutService] Getting workout templates for user: ${userId}`
      );

      // Make API call to get templates
      const data = await apiGet<CompleteWorkout[]>("/db/workouts/templates");

      console.log(
        `[WorkoutService] Retrieved ${data.length} templates for user: ${userId}`
      );

      return isImperial
        ? data.map((t) => convertWorkoutWeights(t, KG_TO_LBS))
        : data;
    } catch (error) {
      console.error(`[WorkoutService] Error getting templates:`, error);
      return this.handleError(error);
    }
  }

  /**
   * Save a workout as a template
   */
  // Remove the conversion in saveAsTemplate
  async saveAsTemplate(
    workout: CompleteWorkout,
    isImperial: boolean = false
  ): Promise<CompleteWorkout> {
    try {
      console.log(`[WorkoutService] Saving workout as template: ${workout.id}`);

      // Convert to metric for storage if needed
      const workoutToSave = isImperial
        ? convertWorkoutWeights(workout, LBS_TO_KG)
        : workout;

      // Send CompleteWorkout directly instead of converting
      const data = await apiPost<CompleteWorkout>(
        "/db/workouts/template",
        workoutToSave
      );

      console.log(
        `[WorkoutService] Successfully saved workout as template: ${data.id}`
      );
      return isImperial ? convertWorkoutWeights(data, KG_TO_LBS) : data;
    } catch (error) {
      console.error(
        `[WorkoutService] Error saving workout as template:`,
        error
      );
      return this.handleError(error);
    }
  }

  /**
   * Get a public workout by ID (for leaderboard viewing)
   */

  /**
   * Get a public workout by ID (for leaderboard viewing)
   */
  async getPublicWorkout(
    workoutId: string,
    isImperial: boolean = false
  ): Promise<CompleteWorkout> {
    try {
      console.log(`[WorkoutService] Getting public workout: ${workoutId}`);

      // Make API call to get public workout
      const response = await apiGet<CompleteWorkout>(
        `/db/workouts/public/${workoutId}`
      );

      // Extract the actual workout data from the wrapped response
      const data = (response as any).data || response;

      console.log(
        `[WorkoutService] Successfully retrieved public workout: ${workoutId}`
      );

      return isImperial ? convertWorkoutWeights(data, KG_TO_LBS) : data;
    } catch (error) {
      console.error(
        `[WorkoutService] Error fetching public workout ${workoutId}:`,
        error
      );
      return this.handleError(error);
    }
  }
  /**
   * Delete a workout
   */
  async deleteWorkout(workoutId: string): Promise<void> {
    try {
      console.log(`[WorkoutService] Deleting workout: ${workoutId}`);

      // Make API call to delete workout
      await apiDelete(`/db/workouts/${workoutId}`);

      console.log(
        `[WorkoutService] Successfully deleted workout: ${workoutId}`
      );
    } catch (error) {
      console.error(`[WorkoutService] Error deleting workout:`, error);
      return this.handleError(error);
    }
  }
}

export const workoutService = new WorkoutService();
