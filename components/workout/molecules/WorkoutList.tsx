// import React from 'react';
// import { FlatList, StyleSheet } from 'react-native';
// import WorkoutItem from '../atoms/WorkoutItem';
// import { CompleteWorkout } from '@/types/workout';

// interface WorkoutListProps {
//   workouts: CompleteWorkout[];
//   onEndReached: () => void;
//   onEndReachedThreshold: number;
// }

// const WorkoutList: React.FC<WorkoutListProps> = ({ workouts, onEndReached, onEndReachedThreshold }) => (
//   <FlatList
//     data={workouts}
//     renderItem={({ item, index }) => (
//       <WorkoutItem
//         workout={item}
//         isLastItem={index === workouts.length - 1}
//       />
//     )}
//     keyExtractor={(item) => item.id}
//     style={styles.container}
//     onEndReached={onEndReached}
//     onEndReachedThreshold={onEndReachedThreshold}
//   />
// );

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#111',
//   },
// });

// export default WorkoutList
