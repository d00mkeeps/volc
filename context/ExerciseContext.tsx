// // contexts/ExerciseContext.tsx
// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useCallback,
// } from "react";
// import { ExerciseDefinition } from "@/types/workout";
// import { ExerciseDefinitionService } from "@/services/db/exerciseDefinition";

// interface ExerciseContextType {
//   exercises: ExerciseDefinition[];
//   loading: boolean;
//   error: Error | null;
//   refreshExercises: () => Promise<void>;
// }

// const ExerciseContext = createContext<ExerciseContextType | undefined>(
//   undefined
// );

// export const ExerciseProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<Error | null>(null);

//   const exerciseService = new ExerciseDefinitionService();

//   const fetchExercises = useCallback(async () => {
//     try {
//       console.log("🏋️‍♂️ ExerciseContext: Initializing exercise data fetch...");
//       setLoading(true);
//       setError(null);

//       const data = await exerciseService.getAllExerciseDefinitions();

//       console.log(
//         `✅ ExerciseContext: Loaded ${data.length} exercises successfully`
//       );

//       setExercises(data);
//     } catch (err) {
//       console.error("❌ ExerciseContext: Failed to fetch exercises:", err);
//       setError(
//         err instanceof Error ? err : new Error("Failed to fetch exercises")
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Load exercises when the context is initialized
//   useEffect(() => {
//     console.log(
//       "🚀 ExerciseContext: Provider initialized, fetching exercises..."
//     );
//     fetchExercises();
//   }, [fetchExercises]);

//   const value = {
//     exercises,
//     loading,
//     error,
//     refreshExercises: fetchExercises,
//   };

//   return (
//     <ExerciseContext.Provider value={value}>
//       {children}
//     </ExerciseContext.Provider>
//   );
// };

// export const useExerciseContext = (): ExerciseContextType => {
//   const context = useContext(ExerciseContext);
//   if (context === undefined) {
//     throw new Error(
//       "useExerciseContext must be used within an ExerciseProvider"
//     );
//   }
//   return context;
// };
