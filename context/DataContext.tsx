import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { uuidv4 } from "@/utils/uuid";
import { WorkoutService } from "../services/db/workout";
import { attachmentService } from "../services/db/attachment";
import { authService } from "@/services/db/auth";
import {
  WorkoutDataBundle,
  WorkoutWithConversation,
  AttachmentType,
} from "@/types/workout";

import {
  registerContextHandlers,
  unregisterContextHandlers,
  DataContextHandlers,
} from "@/services/websocket/GlobalWebsocketService";

type DataContextType = {
  handleSignal: (type: string, data: any) => Promise<void>;
  getWorkoutsByConversation: (
    conversationId: string
  ) => WorkoutWithConversation[];
  graphBundles: Map<string, WorkoutDataBundle>;
  addGraphBundle: (bundle: WorkoutDataBundle, conversationId: string) => void;
  getGraphBundlesByConversation: (
    conversationId: string
  ) => WorkoutDataBundle[];
  clearAttachmentsForConversation: (conversationId: string) => void;
  deleteAttachment: (
    attachmentId: string,
    type: AttachmentType
  ) => Promise<void>;
  isLoading: boolean;
};

type Props = {
  children: React.ReactNode;
  conversationId: string;
};

const MAX_BUNDLES_PER_CONVERSATION = 20;
const MAX_WORKOUTS_PER_CONVERSATION = 10;

const DataContext = createContext<DataContextType>(null!);

export function DataProvider({ children, conversationId }: Props) {
  const [workouts, setWorkouts] = useState<
    Map<string, WorkoutWithConversation>
  >(new Map());
  const [graphBundles, setGraphBundles] = useState<
    Map<string, WorkoutDataBundle>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const workoutService = new WorkoutService();
  const workoutServiceRef = useRef(workoutService);
  const attachmentServiceRef = useRef(attachmentService);
  const conversationIdRef = useRef(conversationId);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    workoutServiceRef.current = workoutService;
  }, [workoutService]);

  useEffect(() => {
    attachmentServiceRef.current = attachmentService;
  }, [attachmentService]);

  useEffect(() => {
    const loadSavedAttachments = async () => {
      try {
        const session = await authService.getSession();
        if (!session?.user?.id) return;

        console.log(
          `[DataContext] Loading attachments for conversation: ${conversationId}`
        );
        setIsLoading(true);

        // Load saved workouts using the attachment service
        const savedWorkouts = await attachmentService.getWorkoutsByConversation(
          session.user.id,
          conversationId
        );

        console.log(
          `[DataContext] Loaded ${
            savedWorkouts?.length || 0
          } workouts for conversation ${conversationId}`
        );
        if (savedWorkouts?.length) {
          const workoutMap = new Map();
          savedWorkouts.forEach((workout: WorkoutWithConversation) => {
            workoutMap.set(workout.id, workout);
          });
          setWorkouts(workoutMap);
        }

        // Load saved graph bundles
        const savedBundles =
          await attachmentService.getGraphBundlesByConversation(
            session.user.id,
            conversationId
          );

        console.log(
          `[DataContext] Loaded ${
            savedBundles?.length || 0
          } graph bundles for conversation ${conversationId}`
        );
        console.log(
          `[DataContext] Bundle IDs:`,
          savedBundles?.map((b) => b.bundle_id).join(", ")
        );

        if (savedBundles?.length) {
          const bundleMap = new Map();
          savedBundles.forEach((bundle: WorkoutDataBundle) => {
            bundleMap.set(bundle.bundle_id, bundle);
          });
          setGraphBundles(bundleMap);
        }
      } catch (error) {
        console.error("[DataContext] Failed to load saved attachments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedAttachments();
  }, [conversationId]);

  const handleSignal = useCallback(async (type: string, data: any) => {
    console.log("DataContext: Handling signal:", { type, data });

    // In the handleSignal method where workout_approved is processed
    // In DataContext.tsx - handleSignal method for workout_approved
    if (type === "workout_approved") {
      let workoutId: string | null = null;

      try {
        setIsLoading(true);
        const session = await authService.getSession();
        if (!session?.user?.id) {
          throw new Error("No authenticated user found");
        }

        console.log("Processing workout:", data);
        workoutId = uuidv4();
        const workoutWithMeta = {
          ...data,
          id: workoutId,
          conversationId: conversationIdRef.current, // This will be stored directly in the workout
          created_at: new Date().toISOString(),
        };

        // Add to state
        setWorkouts((prev) => {
          const newWorkouts = new Map(prev);

          // Check if we need to remove older workouts
          const conversationWorkouts = Array.from(newWorkouts.values()).filter(
            (w) => w.conversationId === conversationIdRef.current
          );

          if (conversationWorkouts.length >= MAX_WORKOUTS_PER_CONVERSATION) {
            // Sort by creation time (oldest first)
            const sortedWorkouts = conversationWorkouts.sort((a, b) => {
              return (
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
              );
            });

            // Remove oldest
            const toRemove = sortedWorkouts[0];
            if (toRemove) {
              newWorkouts.delete(toRemove.id);
            }
          }

          // Add new workout
          newWorkouts.set(workoutId!, workoutWithMeta);
          return newWorkouts;
        });

        try {
          // Save workout directly with the conversation ID included
          console.log("Saving workout to database:", workoutId);
          await workoutServiceRef.current.createWorkout(
            session.user.id,
            workoutWithMeta
          );

          console.log("Workout saved successfully:", workoutId);
        } catch (dbError: any) {
          // Log detailed error information
          console.error("Database error details:", dbError);
          throw dbError;
        }
      } catch (error) {
        // Error handling remains the same
        console.error("Failed to handle workout signal:", error);
        if (workoutId) {
          setWorkouts((prev) => {
            const newWorkouts = new Map(prev);
            newWorkouts.delete(workoutId!);
            return newWorkouts;
          });
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else if (type === "workout_data_bundle") {
      try {
        setIsLoading(true);
        const session = await authService.getSession();
        if (!session?.user?.id) {
          throw new Error("No authenticated user found");
        }

        console.log(
          "[DataContext] Received workout_data_bundle with ID:",
          data.bundle_id
        );
        console.log(
          "[DataContext] For conversation:",
          conversationIdRef.current
        );

        // Store the graph bundle with the current conversation ID
        const bundleWithConversation = {
          ...data,
          conversationId: conversationIdRef.current,
        };

        // Add to local state only, don't save to database since the backend already did this
        console.log(
          "[DataContext] Adding bundle to local state:",
          data.bundle_id
        );
        addGraphBundle(bundleWithConversation, conversationIdRef.current);

        console.log(
          "[DataContext] Bundle added to local state successfully:",
          data.bundle_id
        );

        // After receiving a bundle, refresh the graph bundles from the database
        // This ensures we have the most up-to-date data including any transformations the backend did
        console.log("[DataContext] Refreshing graph bundles from database");
        const savedBundles =
          await attachmentServiceRef.current.getGraphBundlesByConversation(
            session.user.id,
            conversationIdRef.current
          );

        console.log(
          `[DataContext] Refreshed ${
            savedBundles?.length || 0
          } bundles from database`
        );

        if (savedBundles?.length) {
          const bundleMap = new Map();
          savedBundles.forEach((bundle: WorkoutDataBundle) => {
            console.log(
              `[DataContext] Retrieved bundle from DB: ${bundle.bundle_id}`
            );
            bundleMap.set(bundle.bundle_id, bundle);
          });
          setGraphBundles(bundleMap);
        }
      } catch (error) {
        console.error(
          "[DataContext] Failed to handle graph bundle signal:",
          error
        );
        // Remove from state if processing failed
        if (data?.bundle_id) {
          setGraphBundles((prev) => {
            const newBundles = new Map(prev);
            newBundles.delete(data.bundle_id);
            return newBundles;
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // Create stable handler reference
  const stableDataHandler = useMemo(() => {
    return {
      handleSignal,
    };
  }, [handleSignal]);

  // Register with GlobalWebSocketService - optimized registration
  useEffect(() => {
    if (!conversationId) return;

    console.log(
      "DataContext: Registering handler for conversation",
      conversationId
    );
    registerContextHandlers(conversationId, null, stableDataHandler);

    return () => {
      console.log(
        "DataContext: Unregistering data handlers for conversation",
        conversationId
      );
      unregisterContextHandlers(conversationId);
    };
  }, [conversationId, stableDataHandler]); // Only depends on conversation ID and the stable handler

  const addGraphBundle = (bundle: WorkoutDataBundle, convId: string) => {
    setGraphBundles((prev) => {
      const newBundles = new Map(prev);

      // Check if we need to remove older bundles
      const conversationBundles = Array.from(newBundles.values()).filter(
        (b) => b.conversationId === convId
      );

      if (conversationBundles.length >= MAX_BUNDLES_PER_CONVERSATION) {
        // Sort by creation time (oldest first)
        const sortedBundles = conversationBundles.sort((a, b) => {
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

        // Remove oldest
        const toRemove = sortedBundles[0];
        if (toRemove) {
          newBundles.delete(toRemove.bundle_id);
        }
      }

      // Add new bundle
      newBundles.set(bundle.bundle_id, {
        ...bundle,
        conversationId: convId,
      });

      return newBundles;
    });
  };

  const getWorkoutsByConversation = (convId: string) =>
    Array.from(workouts.values())
      .filter((w) => w.conversationId === convId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

  const getGraphBundlesByConversation = (convId: string) =>
    Array.from(graphBundles.values())
      .filter((b) => b.conversationId === convId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

  const clearAttachmentsForConversation = (convId: string) => {
    // Clear workouts and graph bundles from state
    setWorkouts((prev) => {
      const newWorkouts = new Map(prev);
      Array.from(newWorkouts.entries())
        .filter(([_, workout]) => workout.conversationId === convId)
        .forEach(([id, _]) => newWorkouts.delete(id));
      return newWorkouts;
    });

    setGraphBundles((prev) => {
      const newBundles = new Map(prev);
      Array.from(newBundles.entries())
        .filter(([_, bundle]) => bundle.conversationId === convId)
        .forEach(([id, _]) => newBundles.delete(id));
      return newBundles;
    });

    // Delete from database
    const deleteFromDb = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user?.id) {
          await attachmentService.deleteConversationAttachments(
            session.user.id,
            convId
          );
        }
      } catch (error) {
        console.error("Failed to delete conversation attachments:", error);
      }
    };

    deleteFromDb();
  };

  const deleteAttachment = async (
    attachmentId: string,
    type: AttachmentType
  ) => {
    try {
      setIsLoading(true);
      const session = await authService.getSession();
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      // Remove from state
      if (type === "workout") {
        setWorkouts((prev) => {
          const newWorkouts = new Map(prev);
          newWorkouts.delete(attachmentId);
          return newWorkouts;
        });
      } else {
        setGraphBundles((prev) => {
          const newBundles = new Map(prev);
          newBundles.delete(attachmentId);
          return newBundles;
        });
      }

      // Delete from database
      await attachmentService.deleteAttachment(
        session.user.id,
        attachmentId,
        type
      );

      console.log(`${type} deleted successfully:`, attachmentId);
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        handleSignal,
        getWorkoutsByConversation,
        graphBundles,
        addGraphBundle,
        getGraphBundlesByConversation,
        clearAttachmentsForConversation,
        deleteAttachment,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

// Backwards compatibility
export const useWorkouts = useData;
