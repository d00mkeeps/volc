import React from "react";
import { Stack, Text, ScrollView } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ContentCard from "@/components/atoms/ContentCard";

interface WorkoutListProps {
  limit?: number;
}

export default function WorkoutList({ limit = 3 }: WorkoutListProps) {
  const router = useRouter();

  // Mock data - replace with real data later
  const allWorkouts = [
    {
      id: "workout-1",
      title: "Push Day",
      subtitle: "Chest, shoulders, triceps • 45 min",
      date: new Date("2024-05-22"),
    },
    {
      id: "workout-2",
      title: "Pull Day",
      subtitle: "Back, biceps, rear delts • 50 min",
      date: new Date("2024-05-20"),
    },
    {
      id: "workout-3",
      title: "Leg Day",
      subtitle: "Quads, hamstrings, glutes • 60 min",
      date: new Date("2024-05-18"),
    },
    {
      id: "workout-4",
      title: "Upper Body",
      subtitle: "Full upper body • 55 min",
      date: new Date("2024-05-16"),
    },
  ];

  const displayedWorkouts = allWorkouts.slice(0, limit);
  const hasMore = allWorkouts.length > limit;

  const handleWorkoutPress = (workoutId: string) => {
    console.log("Open workout:", workoutId);
    // TODO: Navigate to workout detail or open modal
  };

  const handleViewAllPress = () => {
    //router.push('/workouts'); Navigate to dedicated workouts page
    console.log("Routing to /workouts!");
  };

  return (
    <Stack marginBottom="$4">
      <Text fontSize="$4" fontWeight="500" color="$text" marginBottom="$2">
        Workouts
      </Text>
      <Stack height={70}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Stack flexDirection="row" gap="$2" height="100%">
            {displayedWorkouts.map((workout) => (
              <Stack key={workout.id} width={240} flex={1}>
                <ContentCard
                  title={workout.title}
                  subtitle={workout.subtitle}
                  date={workout.date}
                  onPress={() => handleWorkoutPress(workout.id)}
                />
              </Stack>
            ))}
          </Stack>
        </ScrollView>
      </Stack>
    </Stack>
  );
}
