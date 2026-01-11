import AsyncStorage from "@react-native-async-storage/async-storage";

const TOUR_KEY = "@tour_completed_steps";

export type TourStepId =
  | "exercise_notes"
  | "exercise_definition"
  | "exercise_change"
  | "navigation_features";

interface TourState {
  completedSteps: TourStepId[];
  lastUpdated: string;
}

export const tourPersistence = {
  /**
   * Mark a tour step as completed
   */
  async markComplete(stepId: TourStepId): Promise<void> {
    try {
      const current = await this.getState();
      const updated: TourState = {
        completedSteps: [...new Set([...current.completedSteps, stepId])],
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(TOUR_KEY, JSON.stringify(updated));
      console.log(`✅ Tour step completed: ${stepId}`);
    } catch (error) {
      console.error("Failed to mark tour step complete:", error);
    }
  },

  /**
   * Check if a step is completed
   */
  async isComplete(stepId: TourStepId): Promise<boolean> {
    const state = await this.getState();
    return state.completedSteps.includes(stepId);
  },

  /**
   * Get current tour state
   */
  async getState(): Promise<TourState> {
    try {
      const stored = await AsyncStorage.getItem(TOUR_KEY);
      if (!stored) {
        return { completedSteps: [], lastUpdated: new Date().toISOString() };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error("Failed to load tour state:", error);
      return { completedSteps: [], lastUpdated: new Date().toISOString() };
    }
  },

  /**
   * Reset all tour progress (for testing)
   */
  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOUR_KEY);
      console.log("🔄 Tour progress reset");
    } catch (error) {
      console.error("Failed to reset tour:", error);
    }
  },
};
