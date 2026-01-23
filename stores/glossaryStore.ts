import { create } from "zustand";
import { GlossaryService, GlossaryTerm } from "@/services/db/glossary";
import { authService } from "@/services/db/auth";
import { glossaryPersistence } from "@/utils/glossaryPersistence";

interface GlossaryStoreState {
  terms: GlossaryTerm[];
  termsById: Record<string, GlossaryTerm>;
  dismissedTermIds: Set<string>;
  loading: boolean;
  error: Error | null;
  initialized: boolean;

  // Auth-triggered methods (called by authStore)
  initializeIfAuthenticated: () => Promise<void>;
  clearData: () => void;

  // Public methods (called by components)
  fetchTerms: () => Promise<void>;
  getTerm: (id: string) => GlossaryTerm | undefined;
  refreshTerms: () => Promise<void>;

  // Dismissal methods
  isDismissed: (termId: string) => boolean;
  dismissTerm: (termId: string) => Promise<void>;
  resetDismissals: () => Promise<void>;
}

export const useGlossaryStore = create<GlossaryStoreState>((set, get) => {
  const glossaryService = new GlossaryService();

  const loadDismissedTerms = async () => {
    const dismissedIds = await glossaryPersistence.getDismissedIds();
    set({ dismissedTermIds: new Set(dismissedIds) });
  };

  const fetchTerms = async () => {
    try {
      set({ loading: true, error: null });

      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const terms = await glossaryService.getAllGlossaryTerms();
      const termsById = terms.reduce(
        (acc, term) => {
          acc[term.id] = term;
          return acc;
        },
        {} as Record<string, GlossaryTerm>,
      );

      // Also load dismissed terms
      await loadDismissedTerms();

      set({ terms, termsById, initialized: true });
    } catch (err) {
      console.error("❌ GlossaryStore: Failed to fetch terms:", err);
      set({
        error:
          err instanceof Error
            ? err
            : new Error("Failed to fetch glossary terms"),
        initialized: true,
      });
    } finally {
      set({ loading: false });
    }
  };

  return {
    // Initial state
    terms: [],
    termsById: {},
    dismissedTermIds: new Set<string>(),
    loading: false,
    error: null,
    initialized: false,

    // Called by authStore when user becomes authenticated
    initializeIfAuthenticated: async () => {
      const { initialized, loading } = get();
      if (initialized || loading) return; // Prevent double-initialization

      await fetchTerms();
    },

    // Called by authStore when user logs out
    clearData: () => {
      set({
        terms: [],
        termsById: {},
        dismissedTermIds: new Set<string>(),
        loading: false,
        error: null,
        initialized: false,
      });
    },

    // Public methods for components
    fetchTerms,
    getTerm: (id: string) => get().termsById[id],
    refreshTerms: fetchTerms,

    // Dismissal methods
    isDismissed: (termId: string) => get().dismissedTermIds.has(termId),

    dismissTerm: async (termId: string) => {
      await glossaryPersistence.dismiss(termId);
      const current = get().dismissedTermIds;
      set({ dismissedTermIds: new Set([...current, termId]) });
    },

    resetDismissals: async () => {
      await glossaryPersistence.resetAll();
      set({ dismissedTermIds: new Set<string>() });
    },
  };
});
