import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import WorkoutItem from "@/components/workout/atoms/WorkoutItem";
import {
  WorkoutWithConversation,
  CompleteWorkout,
  SetInput,
} from "@/types/workout";
import { convertToCompleteWorkout } from "@/utils/workoutConversion";

interface SidebarWorkoutListProps {
  workouts: WorkoutWithConversation[];
  maxDisplayed?: number;
}

const SidebarWorkoutList: React.FC<SidebarWorkoutListProps> = ({
  workouts,
  maxDisplayed = 5,
}) => {
  const displayWorkouts = workouts.slice(0, maxDisplayed);

  if (workouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No workouts in this conversation yet
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={displayWorkouts}
      renderItem={({ item, index }) => (
        <WorkoutItem
          workout={convertToCompleteWorkout(item)}
          isLastItem={index === displayWorkouts.length - 1}
        />
      )}
      keyExtractor={(item) => item.id}
      style={styles.container}
      scrollEnabled={false} // Disable scroll as parent ScrollView handles scrolling
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111",
    borderRadius: 8,
    overflow: "hidden",
    maxHeight: 300,
  },
  emptyContainer: {
    padding: 12,
    backgroundColor: "#111",
    borderRadius: 8,
    alignItems: "center",
  },
  emptyText: {
    color: "#8cd884",
    fontStyle: "italic",
  },
});

export default SidebarWorkoutList;
