// stores/GraphBundleStore.ts
import { create } from 'zustand';
import { graphBundleService } from '@/services/db/graphBundle';
import { authService } from '@/services/db/auth';
import { WorkoutDataBundle } from '@/types/workout';

// GraphBundleStore.ts - Update the interface:
interface GraphBundleState {
  bundles: Map<string, WorkoutDataBundle>;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  loadBundlesForConversation: (conversationId: string) => Promise<void>;
  getBundlesByConversation: (conversationId: string) => WorkoutDataBundle[];
  addBundle: (bundle: WorkoutDataBundle, conversationId: string) => Promise<void>;
  deleteBundle: (bundleId: string) => Promise<void>;
  clearBundlesForConversation: (conversationId: string) => Promise<void>;
  updateBundleConversation: (oldConversationId: string, newConversationId: string) => Promise<void>; // Add this line
}

const MAX_BUNDLES_PER_CONVERSATION = 20;

export const useGraphBundleStore = create<GraphBundleState>((set, get) => ({
  bundles: new Map<string, WorkoutDataBundle>(),
  isLoading: false,
  error: null,
  
  loadBundlesForConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const session = await authService.getSession();
      if (!session?.user?.id) return;
      
      const savedBundles = await graphBundleService.getGraphBundlesByConversation(
        session.user.id,
        conversationId
      );
      
      if (savedBundles?.length) {
        const bundleMap = new Map<string, WorkoutDataBundle>();
        savedBundles.forEach((bundle: WorkoutDataBundle) => {
          bundleMap.set(bundle.bundle_id, bundle);
        });
        
        set({ bundles: bundleMap });
      }
    } catch (error) {
      console.error("[GraphBundleStore] Failed to load bundles:", error);
      set({ error: error instanceof Error ? error : new Error(String(error)) });
    } finally {
      set({ isLoading: false });
    }
  },
  
  getBundlesByConversation: (conversationId: string) => {
    const { bundles } = get();
    return Array.from(bundles.values())
      .filter((b) => b.conversationId === conversationId)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },
  
  addBundle: async (bundle: WorkoutDataBundle, conversationId: string) => {
    const { bundles } = get();
    
    try {
      set({ isLoading: true, error: null });
      
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }
      
      // Add conversationId to bundle if not present
      const bundleWithConversation = {
        ...bundle,
        conversationId
      };
      
      // Update state first
      const newBundles = new Map(bundles);
      
      // Check if we need to remove older bundles
      const conversationBundles = Array.from(newBundles.values())
        .filter((b) => b.conversationId === conversationId);
      
      if (conversationBundles.length >= MAX_BUNDLES_PER_CONVERSATION) {
        // Sort by creation time (oldest first)
        const sortedBundles = conversationBundles.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Remove oldest
        const toRemove = sortedBundles[0];
        if (toRemove) {
          newBundles.delete(toRemove.bundle_id);
        }
      }
      
      // Add new bundle
      newBundles.set(bundle.bundle_id, bundleWithConversation);
      set({ bundles: newBundles });
      
      // Save to database
      await graphBundleService.saveGraphBundle(session.user.id, bundleWithConversation);
      
    } catch (error) {
      console.error("[GraphBundleStore] Failed to add bundle:", error);
      
      // Rollback state
      const rollbackBundles = new Map(get().bundles);
      rollbackBundles.delete(bundle.bundle_id);
      set({ bundles: rollbackBundles });
      
      set({ error: error instanceof Error ? error : new Error(String(error)) });
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteBundle: async (bundleId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }
      
      // Remove from state
      const newBundles = new Map(get().bundles);
      newBundles.delete(bundleId);
      set({ bundles: newBundles });
      
      // Delete from database
      await graphBundleService.deleteGraphBundle(session.user.id, bundleId);
      
    } catch (error) {
      console.error("[GraphBundleStore] Failed to delete bundle:", error);
      set({ error: error instanceof Error ? error : new Error(String(error)) });
    } finally {
      set({ isLoading: false });
    }
  },
  // GraphBundleStore.ts - Update updateBundleConversation method:
updateBundleConversation: async (oldConversationId: string, newConversationId: string) => {
  try {
    set({ isLoading: true, error: null });
    
    const session = await authService.getSession();
    if (!session?.user?.id) {
      throw new Error("No authenticated user found");
    }
    
    // Get pending bundles
    const pendingBundles = await graphBundleService.getGraphBundlesByConversation(
      session.user.id, 
      oldConversationId
    );
    
    if (pendingBundles.length > 0) {
      const bundle = pendingBundles[0];
      
      // Create updated bundle
      const updatedBundle = {
        ...bundle,
        conversationId: newConversationId
      };
      
      // Delete old bundle and save new one
      await graphBundleService.deleteGraphBundle(session.user.id, bundle.bundle_id);
      await graphBundleService.saveGraphBundle(session.user.id, updatedBundle);
      
      // Update local state
      const newBundles = new Map(get().bundles);
      newBundles.delete(bundle.bundle_id);
      newBundles.set(bundle.bundle_id, updatedBundle);
      set({ bundles: newBundles });
    }
  } catch (error) {
    console.error("[GraphBundleStore] Failed to update bundle conversation:", error);
    set({ error: error instanceof Error ? error : new Error(String(error)) });
  } finally {
    set({ isLoading: false });
  }
},
  
  clearBundlesForConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }
      
      // Update state
      const newBundles = new Map(get().bundles);
      Array.from(newBundles.entries())
        .filter(([_, bundle]) => bundle.conversationId === conversationId)
        .forEach(([id, _]) => newBundles.delete(id));
      
      set({ bundles: newBundles });
      
      // Delete from database
      await graphBundleService.deleteConversationGraphBundles(session.user.id, conversationId);
      
    } catch (error) {
      console.error("[GraphBundleStore] Failed to clear bundles for conversation:", error);
      set({ error: error instanceof Error ? error : new Error(String(error)) });
    } finally {
      set({ isLoading: false });
    }
  }
}));

