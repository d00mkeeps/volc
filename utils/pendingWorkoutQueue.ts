import AsyncStorage from "@react-native-async-storage/async-storage";
import { CompleteWorkout } from "@/types/workout";

const STORAGE_KEY = "PENDING_WORKOUT_SYNC_QUEUE";

export interface PendingWorkoutItem {
  id: string;
  workout: CompleteWorkout;
  attempts: number;
  lastAttemptAt: number;
  addedAt: number;
}

class PendingWorkoutQueue {
  /**
   * Add a workout to the pending queue
   */
  async add(workout: CompleteWorkout): Promise<void> {
    try {
      const queue = await this.getAll();
      
      // Check if already exists to prevent duplicates
      if (queue.some(item => item.id === workout.id)) {
        console.log(`[PendingWorkoutQueue] Workout ${workout.id} already in queue`);
        return;
      }

      const newItem: PendingWorkoutItem = {
        id: workout.id,
        workout,
        attempts: 0,
        lastAttemptAt: 0,
        addedAt: Date.now(),
      };

      queue.push(newItem);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      console.log(`[PendingWorkoutQueue] Added workout ${workout.id} to queue`);
    } catch (error) {
      console.error("[PendingWorkoutQueue] Error adding to queue:", error);
    }
  }

  /**
   * Remove a workout from the pending queue
   */
  async remove(workoutId: string): Promise<void> {
    try {
      const queue = await this.getAll();
      const filtered = queue.filter(item => item.id !== workoutId);
      
      if (queue.length !== filtered.length) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        console.log(`[PendingWorkoutQueue] Removed workout ${workoutId} from queue`);
      }
    } catch (error) {
      console.error("[PendingWorkoutQueue] Error removing from queue:", error);
    }
  }

  /**
   * Get all pending workouts
   */
  async getAll(): Promise<PendingWorkoutItem[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error("[PendingWorkoutQueue] Error getting queue:", error);
      return [];
    }
  }

  /**
   * Update attempt count for a workout
   */
  async updateAttempt(workoutId: string): Promise<void> {
    try {
      const queue = await this.getAll();
      const index = queue.findIndex(item => item.id === workoutId);
      
      if (index !== -1) {
        queue[index].attempts += 1;
        queue[index].lastAttemptAt = Date.now();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        console.log(`[PendingWorkoutQueue] Updated attempts for ${workoutId} to ${queue[index].attempts}`);
      }
    } catch (error) {
      console.error("[PendingWorkoutQueue] Error updating attempt:", error);
    }
  }

  /**
   * Clear the entire queue (debug/dev use)
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("[PendingWorkoutQueue] Queue cleared");
    } catch (error) {
      console.error("[PendingWorkoutQueue] Error clearing queue:", error);
    }
  }
}

export const pendingWorkoutQueue = new PendingWorkoutQueue();
