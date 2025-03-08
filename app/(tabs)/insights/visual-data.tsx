// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Text } from 'react-native';
// import { VisualDataDisplay } from '@/components/VisualDataDisplay/VisualDataDisplay'; // Adjust the import path as needed
// import { Workout } from '@/types'; // Adjust the import path as needed
// import { sampleWorkouts } from '@/assets/mockData'; // Adjust the import path as needed

// export default function VisualDataScreen() {
//   const [exercises, setExercises] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Extract unique exercise names from sampleWorkouts
//     const uniqueExercises = Array.from(new Set(
//       sampleWorkouts.flatMap(workout => 
//         workout.exercises.map(exercise => exercise.exercise_name)
//       )
//     ));
//     setExercises(uniqueExercises);
//     setIsLoading(false);
//   }, []);

//   const fetchWorkoutData = async (): Promise<Workout[]> => {
//     // In a real app, this would be an API call
//     // For now, we're returning the mock data
//     return sampleWorkouts;
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.text}>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {exercises.length > 0 ? (
//         <VisualDataDisplay 
//           exercises={exercises}
//           fetchWorkoutData={fetchWorkoutData}
//         />
//       ) : (
//         <Text style={styles.text}>No exercises found. Start logging workouts to see your progress!</Text>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 10,
//     backgroundColor: '#222', // Adjust this to match your app's background color
//   },
//   text: {
//     color: '#fff', // Adjust this to match your app's text color
//     textAlign: 'center',
//   },
// });