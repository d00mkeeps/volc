import AsyncStorage from "@react-native-async-storage/async-storage";

const GLOSSARY_DISMISS_KEY = "@glossary_dismissed_terms";

interface GlossaryDismissState {
  dismissedTermIds: string[];
  lastUpdated: string;
}

/**
 * Persistence utility for glossary term dismissals.
 * Users can dismiss terms so they render as plain text instead of tappable links.
 */
export const glossaryPersistence = {
  /**
   * Dismiss a glossary term so it won't show as a link
   */
  async dismiss(termId: string): Promise<void> {
    try {
      const current = await this.getState();
      const updated: GlossaryDismissState = {
        dismissedTermIds: [...new Set([...current.dismissedTermIds, termId])],
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(GLOSSARY_DISMISS_KEY, JSON.stringify(updated));
      console.log(`🚫 Glossary term dismissed: ${termId}`);
    } catch (error) {
      console.error("Failed to dismiss glossary term:", error);
    }
  },

  /**
   * Check if a term has been dismissed
   */
  async isDismissed(termId: string): Promise<boolean> {
    const state = await this.getState();
    return state.dismissedTermIds.includes(termId);
  },

  /**
   * Get all dismissed term IDs
   */
  async getDismissedIds(): Promise<string[]> {
    const state = await this.getState();
    return state.dismissedTermIds;
  },

  /**
   * Get current dismissal state
   */
  async getState(): Promise<GlossaryDismissState> {
    try {
      const stored = await AsyncStorage.getItem(GLOSSARY_DISMISS_KEY);
      if (!stored) {
        return { dismissedTermIds: [], lastUpdated: new Date().toISOString() };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error("Failed to load glossary dismissal state:", error);
      return { dismissedTermIds: [], lastUpdated: new Date().toISOString() };
    }
  },

  /**
   * Reset all dismissals - all terms will show as links again
   */
  async resetAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GLOSSARY_DISMISS_KEY);
      console.log("🔄 Glossary dismissals reset");
    } catch (error) {
      console.error("Failed to reset glossary dismissals:", error);
    }
  },
};
