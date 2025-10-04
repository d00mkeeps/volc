import React from "react";
import { LeaderboardScreen } from "@/components/screens/LeaderboardScreen";

interface WorkoutScreenProps {
  isActive?: boolean;
}

export default function WorkoutScreen({ isActive = true }: WorkoutScreenProps) {
  return <LeaderboardScreen isActive={isActive} />;
}
