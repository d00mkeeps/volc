// // WorkoutModalHeader.tsx
// import React from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
// import { CompleteWorkout } from '@/types/workout';

// interface WorkoutModalHeaderProps {
//   workout: CompleteWorkout;
//   editMode: boolean;
//   onWorkoutChange: React.Dispatch<React.SetStateAction<CompleteWorkout>>;
//   onDeletePress: () => void;
//   hideDeleteButton?: boolean
// }

// const WorkoutModalHeader: React.FC<WorkoutModalHeaderProps> = ({
//   workout,
//   editMode,
//   onWorkoutChange,
//   onDeletePress,
//   hideDeleteButton = false
// }) => {
//   const formattedDate = new Date(workout.created_at).toLocaleDateString();

//   const handleNameChange = (name: string) => {
//     onWorkoutChange(prev => ({
//       ...prev,
//       name
//     }));
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.titleContainer}>
//         {editMode ? (
//           <TextInput
//             style={[styles.title, styles.input]}
//             value={workout.name}
//             onChangeText={handleNameChange}
//             placeholder="Workout Name"
//             placeholderTextColor="#666"
//           />
//         ) : (
//           <Text style={styles.title}>{workout.name}</Text>
//         )}
//         {!hideDeleteButton && (
//           <TouchableOpacity
//             style={styles.deleteButton}
//             onPress={onDeletePress}
//           >
//             <Text style={styles.deleteButtonText}>Delete</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//       <Text style={styles.date}>{formattedDate}</Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingTop: 20,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#444',
//   },
//   titleContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   title: {
//     color: '#8cd884',
//     fontSize: 24,
//     fontWeight: 'bold',
//     flex: 1,
//     marginRight: 12,
//   },
//   input: {
//     backgroundColor: '#333',
//     padding: 8,
//     borderRadius: 4,
//   },
//   date: {
//     color: '#888',
//     fontSize: 14,
//   },
//   deleteButton: {
//     backgroundColor: '#ff4444',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 4,
//   },
//   deleteButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
// });

// export default WorkoutModalHeader;
