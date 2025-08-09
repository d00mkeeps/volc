// /utils/validation.ts

export const WorkoutValidation = {
  chatMessage: (message: string) => {
    if (!message?.trim()) return { isValid: false, error: "Message required" };
    if (message.length > 240)
      return { isValid: false, error: "Max 240 characters" };
    return { isValid: true };
  },

  weight: (value: number | undefined, isMetric: boolean) => {
    if (value === undefined || value < 0)
      return { isValid: false, error: "Invalid weight" };
    const maxKg = 500;
    const max = isMetric ? maxKg : maxKg * 2.205; // ~1102 lbs
    if (value > max)
      return { isValid: false, error: `Max ${max}${isMetric ? "kg" : "lbs"}` };
    return { isValid: true };
  },

  reps: (value: number | undefined) => {
    if (value === undefined || value < 0)
      return { isValid: false, error: "Invalid reps" };
    if (value > 100) return { isValid: false, error: "Max 100 reps" };
    return { isValid: true };
  },

  distance: (value: number | undefined, isMetric: boolean) => {
    if (value === undefined || value < 0)
      return { isValid: false, error: "Invalid distance" };
    const maxKm = 200;
    const max = isMetric ? maxKm : maxKm * 0.621371; // ~124 miles
    if (value > max)
      return { isValid: false, error: `Max ${max}${isMetric ? "km" : "mi"}` };
    return { isValid: true };
  },

  duration: (seconds: number | undefined) => {
    if (seconds === undefined || seconds < 0)
      return { isValid: false, error: "Invalid duration" };
    const maxSeconds = 72 * 60 * 60; // 72 hours
    if (seconds > maxSeconds) return { isValid: false, error: "Max 72:00:00" };
    return { isValid: true };
  },

  rpe: (value: number | undefined) => {
    if (value === undefined) return { isValid: true }; // RPE is optional
    if (value < 0 || value > 10)
      return { isValid: false, error: "RPE must be 0-10" };
    return { isValid: true };
  },

  // For sanitizing numeric input strings
  sanitizeNumeric: (input: string): string => {
    return input.replace(/[^0-9.,]/g, "");
  },
};

export const DurationFormatter = {
  // Convert seconds to HH:MM:SS string
  secondsToDisplay: (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  },

  // Parse HH:MM:SS or MM:SS string to seconds
  displayToSeconds: (display: string): number | undefined => {
    const parts = display.split(":").map((p) => parseInt(p, 10));

    if (parts.some(isNaN)) return undefined;

    if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }

    return undefined;
  },

  // Validate duration format
  isValidFormat: (input: string): boolean => {
    return /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/.test(input);
  },
};
