// // stores/ContextBundleStore.ts
// import { create } from 'zustand';
// import { contextBundleService } from '@/services/db/analysis';
// import { authService } from '@/services/db/auth';
// import { ContextBundle } from '@/types/workout';

// // ContextBundleStore.ts - Update the interface:
// interface ContextBundleState {
//   bundles: Map<string, ContextBundle>;
//   isLoading: boolean;
//   error: Error | null;

//   // Actions
//   loadBundlesForConversation: (conversationId: string) => Promise<void>;
//   getBundlesByConversation: (conversationId: string) => ContextBundle[];
//   addBundle: (bundle: ContextBundle, conversationId: string) => Promise<void>;
//   deleteBundle: (bundleId: string) => Promise<void>;
//   clearBundlesForConversation: (conversationId: string) => Promise<void>;
//   updateBundleConversation: (oldConversationId: string, newConversationId: string) => Promise<void>; // Add this line
// }

// const MAX_BUNDLES_PER_CONVERSATION = 20;

// export const useContextBundleStore = create<ContextBundleState>((set, get) => ({
//   bundles: new Map<string, ContextBundle>(),
//   isLoading: false,
//   error: null,

//   loadBundlesForConversation: async (conversationId: string) => {
//     try {
//       set({ isLoading: true, error: null });

//       const session = await authService.getSession();
//       if (!session?.user?.id) return;

//       const savedBundles = await contextBundleService.getContextBundlesByConversation(
//         session.user.id,
//         conversationId
//       );

//       if (savedBundles?.length) {
//         const bundleMap = new Map<string, ContextBundle>();
//         savedBundles.forEach((bundle: ContextBundle) => {
//           bundleMap.set(bundle.bundle_id, bundle);
//         });

//         set({ bundles: bundleMap });
//       }
//     } catch (error) {
//       console.error("[ContextBundleStore] Failed to load bundles:", error);
//       set({ error: error instanceof Error ? error : new Error(String(error)) });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   getBundlesByConversation: (conversationId: string) => {
//     const { bundles } = get();
//     return Array.from(bundles.values())
//       .filter((b) => b.conversationId === conversationId)
//       .sort((a, b) =>
//         new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//       );
//   },

//   addBundle: async (bundle: ContextBundle, conversationId: string) => {
//     const { bundles } = get();

//     try {
//       set({ isLoading: true, error: null });

//       const session = await authService.getSession();
//       if (!session?.user?.id) {
//         throw new Error("No authenticated user found");
//       }

//       // Add conversationId to bundle if not present
//       const bundleWithConversation = {
//         ...bundle,
//         conversationId
//       };

//       // Update state first
//       const newBundles = new Map(bundles);

//       // Check if we need to remove older bundles
//       const conversationBundles = Array.from(newBundles.values())
//         .filter((b) => b.conversationId === conversationId);

//       if (conversationBundles.length >= MAX_BUNDLES_PER_CONVERSATION) {
//         // Sort by creation time (oldest first)
//         const sortedBundles = conversationBundles.sort((a, b) =>
//           new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
//         );

//         // Remove oldest
//         const toRemove = sortedBundles[0];
//         if (toRemove) {
//           newBundles.delete(toRemove.bundle_id);
//         }
//       }

//       // Add new bundle
//       newBundles.set(bundle.bundle_id, bundleWithConversation);
//       set({ bundles: newBundles });

//       // Save to database
//       await contextBundleService.saveContextBundle(session.user.id, bundleWithConversation);

//     } catch (error) {
//       console.error("[ContextBundleStore] Failed to add bundle:", error);

//       // Rollback state
//       const rollbackBundles = new Map(get().bundles);
//       rollbackBundles.delete(bundle.bundle_id);
//       set({ bundles: rollbackBundles });

//       set({ error: error instanceof Error ? error : new Error(String(error)) });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   deleteBundle: async (bundleId: string) => {
//     try {
//       set({ isLoading: true, error: null });

//       const session = await authService.getSession();
//       if (!session?.user?.id) {
//         throw new Error("No authenticated user found");
//       }

//       // Remove from state
//       const newBundles = new Map(get().bundles);
//       newBundles.delete(bundleId);
//       set({ bundles: newBundles });

//       // Delete from database
//       await contextBundleService.deleteContextBundle(session.user.id, bundleId);

//     } catch (error) {
//       console.error("[ContextBundleStore] Failed to delete bundle:", error);
//       set({ error: error instanceof Error ? error : new Error(String(error)) });
//     } finally {
//       set({ isLoading: false });
//     }
//   },
//   // ContextBundleStore.ts - Update updateBundleConversation method:
// updateBundleConversation: async (oldConversationId: string, newConversationId: string) => {
//   try {
//     set({ isLoading: true, error: null });

//     const session = await authService.getSession();
//     if (!session?.user?.id) {
//       throw new Error("No authenticated user found");
//     }

//     // Get pending bundles
//     const pendingBundles = await contextBundleService.getContextBundlesByConversation(
//       session.user.id,
//       oldConversationId
//     );

//     if (pendingBundles.length > 0) {
//       const bundle = pendingBundles[0];

//       // Create updated bundle
//       const updatedBundle = {
//         ...bundle,
//         conversationId: newConversationId
//       };

//       // Delete old bundle and save new one
//       await contextBundleService.deleteContextBundle(session.user.id, bundle.bundle_id);
//       await contextBundleService.saveContextBundle(session.user.id, updatedBundle);

//       // Update local state
//       const newBundles = new Map(get().bundles);
//       newBundles.delete(bundle.bundle_id);
//       newBundles.set(bundle.bundle_id, updatedBundle);
//       set({ bundles: newBundles });
//     }
//   } catch (error) {
//     console.error("[ContextBundleStore] Failed to update bundle conversation:", error);
//     set({ error: error instanceof Error ? error : new Error(String(error)) });
//   } finally {
//     set({ isLoading: false });
//   }
// },

//   clearBundlesForConversation: async (conversationId: string) => {
//     try {
//       set({ isLoading: true, error: null });

//       const session = await authService.getSession();
//       if (!session?.user?.id) {
//         throw new Error("No authenticated user found");
//       }

//       // Update state
//       const newBundles = new Map(get().bundles);
//       Array.from(newBundles.entries())
//         .filter(([_, bundle]) => bundle.conversationId === conversationId)
//         .forEach(([id, _]) => newBundles.delete(id));

//       set({ bundles: newBundles });

//       // Delete from database
//       await contextBundleService.deleteConversationContextBundles(session.user.id, conversationId);

//     } catch (error) {
//       console.error("[ContextBundleStore] Failed to clear bundles for conversation:", error);
//       set({ error: error instanceof Error ? error : new Error(String(error)) });
//     } finally {
//       set({ isLoading: false });
//     }
//   }
// }));
