// hooks/useWorkoutTimer.tsx
import { useState, useEffect, useRef } from "react";

interface UseWorkoutTimerProps {
  scheduledTime?: string; // Format: "HH:MM" (24-hour)
  isActive: boolean;
}

export function useWorkoutTimer({ scheduledTime, isActive }: UseWorkoutTimerProps) {
  const [timeString, setTimeString] = useState("0:00");
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time without leading zeros
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate seconds until scheduled time
  const getSecondsUntilScheduled = (): number => {
    if (!scheduledTime) return 0;

    const now = new Date();
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);

    // If scheduled time has passed today, assume it's for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    return Math.max(0, Math.floor((scheduled.getTime() - now.getTime()) / 1000));
  };

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isActive) {
      // Countdown mode
      const updateCountdown = () => {
        const secondsRemaining = getSecondsUntilScheduled();
        setTimeString(formatTime(secondsRemaining));
      };

      updateCountdown(); // Initial update
      intervalRef.current = setInterval(updateCountdown, 1000);
    } else if (!isPaused) {
      // Stopwatch mode (only run when not paused)
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, scheduledTime]);

  useEffect(() => {
    // Update display when elapsed seconds change
    if (isActive) {
      setTimeString(formatTime(elapsedSeconds));
    }
  }, [elapsedSeconds, isActive]);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setElapsedSeconds(0);
    setIsPaused(false);
  };

  return {
    timeString,
    isPaused,
    togglePause,
    resetTimer,
  };
}