// import React, {
//   createContext,
//   useContext,
//   useState,
//   useCallback,
//   ReactNode,
// } from "react";
// import { workoutService } from "@/services/db/workout"; // Import the singleton
// import { CompleteWorkout, WorkoutInput } from "@/types/workout";

// interface WorkoutContextType {
//   workouts: CompleteWorkout[];
//   setWorkouts: React.Dispatch<React.SetStateAction<CompleteWorkout[]>>;
//   currentWorkout: CompleteWorkout | null;
//   loading: boolean;
//   error: Error | null;
//   loadWorkouts: (userId: string) => Promise<void>;
//   getWorkout: (workoutId: string) => Promise<void>;
//   createWorkout: (userId: string, workout: WorkoutInput) => Promise<void>;
//   deleteWorkout: (workoutId: string) => Promise<void>;
//   clearError: () => void;
//   templates: CompleteWorkout[];
//   fetchTemplates: (userId: string) => Promise<void>;
//   saveAsTemplate: (workout: CompleteWorkout) => Promise<CompleteWorkout>;
// }

// const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// // Remove this line as we're using the singleton export
// // const workoutService = new WorkoutService();

// export function WorkoutProvider({ children }: { children: ReactNode }) {
//   const [workouts, setWorkouts] = useState<CompleteWorkout[]>([]);
//   const [currentWorkout, setCurrentWorkout] = useState<CompleteWorkout | null>(
//     null
//   );
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<Error | null>(null);
//   const [templates, setTemplates] = useState<CompleteWorkout[]>([]);

//   const fetchTemplates = useCallback(async (userId: string) => {
//     try {
//       setLoading(true);
//       const templateList = await workoutService.getTemplates(userId);
//       setTemplates(templateList);
//     } catch (err) {
//       setError(
//         err instanceof Error ? err : new Error("Failed to load templates")
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const saveAsTemplate = useCallback(async (workout: CompleteWorkout) => {
//     try {
//       setLoading(true);
//       const template = await workoutService.saveAsTemplate(workout);
//       setTemplates((prev) => [template, ...prev]);
//       return template;
//     } catch (err) {
//       setError(
//         err instanceof Error ? err : new Error("Failed to save template")
//       );
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const loadWorkouts = useCallback(async (userId: string) => {
//     try {
//       setLoading(true);
//       const userWorkouts = await workoutService.getUserWorkouts(userId);
//       setWorkouts(userWorkouts);
//     } catch (err) {
//       setError(
//         err instanceof Error ? err : new Error("Failed to load workouts")
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const getWorkout = useCallback(
//     async (workoutId: string) => {
//       try {
//         setLoading(true);
//         // First check if we already have the workout in our state
//         const existingWorkout = workouts.find((w) => w.id === workoutId);
//         if (existingWorkout) {
//           setCurrentWorkout(existingWorkout);
//           return;
//         }

//         const workout = await workoutService.getWorkout(workoutId);
//         setCurrentWorkout(workout);
//       } catch (err) {
//         setError(
//           err instanceof Error ? err : new Error("Failed to load workout")
//         );
//       } finally {
//         setLoading(false);
//       }
//     },
//     [workouts]
//   );

//   const createWorkout = useCallback(
//     async (userId: string, workoutInput: WorkoutInput) => {
//       try {
//         setLoading(true);
//         const newWorkout = await workoutService.createWorkout(
//           userId,
//           workoutInput
//         );
//         setWorkouts((prev) => [newWorkout, ...prev]);
//         setCurrentWorkout(newWorkout);
//       } catch (err) {
//         setError(
//           err instanceof Error ? err : new Error("Failed to create workout")
//         );
//       } finally {
//         setLoading(false);
//       }
//     },
//     []
//   );

//   const deleteWorkout = useCallback(
//     async (workoutId: string) => {
//       try {
//         setLoading(true);
//         await workoutService.deleteWorkout(workoutId);
//         setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
//         if (currentWorkout?.id === workoutId) {
//           setCurrentWorkout(null);
//         }
//       } catch (err) {
//         setError(
//           err instanceof Error ? err : new Error("Failed to delete workout")
//         );
//       } finally {
//         setLoading(false);
//       }
//     },
//     [currentWorkout]
//   );

//   const clearError = useCallback(() => {
//     setError(null);
//   }, []);

//   const value = {
//     workouts,
//     currentWorkout,
//     loading,
//     error,
//     loadWorkouts,
//     getWorkout,
//     createWorkout,
//     deleteWorkout,
//     clearError,
//     setWorkouts,
//     templates,
//     fetchTemplates,
//     saveAsTemplate,
//   };

//   return (
//     <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
//   );
// }

// // Custom hook to use the workout context
// export function useWorkout() {
//   const context = useContext(WorkoutContext);
//   if (context === undefined) {
//     throw new Error("useWorkout must be used within a WorkoutProvider");
//   }
//   return context;
// }
