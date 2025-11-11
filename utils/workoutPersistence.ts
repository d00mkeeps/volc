import AsyncStorage from "@react-native-async-storage/async-storage";
import { CompleteWorkout } from "@/types/workout";

const STORAGE_KEY = "ACTIVE_WORKOUT_SESSION";
const MAX_AGE_HOURS = 24;

interface PersistedWorkoutSession {
  workout: CompleteWorkout;
  startTime: string; // ISO timestamp
  persistedAt: string; // ISO timestamp
  elapsedSeconds: number;
  totalPausedMs: number;
  isPaused: boolean;
  pausedAt: string | null;
}

export const workoutPersistence = {
  /**
   * Save current workout session to AsyncStorage
   * (/utils/workoutPersistence.save)
   */
  async save(data: {
    workout: CompleteWorkout;
    startTime: Date;
    elapsedSeconds: number;
    totalPausedMs: number;
    isPaused: boolean;
    pausedAt: Date | null;
  }): Promise<void> {
    try {
      const session: PersistedWorkoutSession = {
        workout: data.workout,
        startTime: data.startTime.toISOString(),
        persistedAt: new Date().toISOString(),
        elapsedSeconds: data.elapsedSeconds,
        totalPausedMs: data.totalPausedMs,
        isPaused: data.isPaused,
        pausedAt: data.pausedAt?.toISOString() || null,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      console.log("💾 Workout persisted to AsyncStorage");
    } catch (error) {
      console.error("Failed to persist workout:", error);
    }
  },

  /**
   * Load workout session from AsyncStorage
   * Returns null if no session, expired, or invalid
   * (/utils/workoutPersistence.load)
   */
  async load(): Promise<{
    workout: CompleteWorkout;
    startTime: Date;
    elapsedSeconds: number;
    totalPausedMs: number;
    isPaused: boolean;
    pausedAt: Date | null;
  } | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const session: PersistedWorkoutSession = JSON.parse(stored);

      // Check if session is too old (24 hours)
      const persistedTime = new Date(session.persistedAt).getTime();
      const now = new Date().getTime();
      const ageInHours = (now - persistedTime) / (1000 * 60 * 60);

      if (ageInHours > MAX_AGE_HOURS) {
        console.log("🗑️ Persisted workout expired, clearing");
        await this.clear();
        return null;
      }

      console.log("📂 Loaded persisted workout from AsyncStorage");
      return {
        workout: session.workout,
        startTime: new Date(session.startTime),
        elapsedSeconds: session.elapsedSeconds,
        totalPausedMs: session.totalPausedMs,
        isPaused: session.isPaused,
        pausedAt: session.pausedAt ? new Date(session.pausedAt) : null,
      };
    } catch (error) {
      console.error("Failed to load persisted workout:", error);
      return null;
    }
  },

  /**
   * Clear persisted workout session
   * (/utils/workoutPersistence.clear)
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("🗑️ Cleared persisted workout");
    } catch (error) {
      console.error("Failed to clear persisted workout:", error);
    }
  },
};
