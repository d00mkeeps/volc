// /components/atoms/DurationInput.tsx

import React, { useState, useEffect, useRef } from "react";
import { XStack, Input, Text } from "tamagui";
import { WorkoutValidation } from "@/utils/validation";

interface DurationInputProps {
  value: number | string | null | undefined;
  onChange: (seconds: number | undefined) => void;
  isActive: boolean;
}

export default function DurationInput({
  value,
  onChange,
  isActive,
}: DurationInputProps) {
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");

  const minutesRef = useRef<any>(null);
  const secondsRef = useRef<any>(null);

  useEffect(() => {
    if (typeof value === "number") {
      const h = Math.floor(value / 3600);
      const m = Math.floor((value % 3600) / 60);
      const s = value % 60;
      setHours(h.toString());
      setMinutes(m.toString().padStart(2, "0"));
      setSeconds(s.toString().padStart(2, "0"));
    }
  }, [value]);

  // /components/atoms/DurationInput.tsx (update handleChange method)

  const handleChange = (type: "hours" | "minutes" | "seconds", val: string) => {
    const sanitized = val.replace(/[^0-9]/g, "");

    if (type === "hours") {
      const hrs = parseInt(sanitized || "0");
      if (hrs > 23) {
        setHours("23");
      } else {
        setHours(sanitized.slice(0, 2));
      }
      if (sanitized.length >= 2) minutesRef.current?.focus();
    } else if (type === "minutes") {
      const mins = parseInt(sanitized || "0");
      if (mins > 59) {
        setMinutes("59");
      } else {
        setMinutes(sanitized.slice(0, 2));
      }
      if (sanitized.length >= 2) secondsRef.current?.focus();
    } else {
      const secs = parseInt(sanitized || "0");
      if (secs > 59) {
        setSeconds("59");
      } else {
        setSeconds(sanitized.slice(0, 2));
      }
    }
  };

  const updateDuration = () => {
    const h = parseInt(hours || "0");
    const m = parseInt(minutes || "0");
    const s = parseInt(seconds || "0");
    const totalSeconds = h * 3600 + m * 60 + s;

    const validation = WorkoutValidation.duration(totalSeconds);
    if (validation.isValid) {
      onChange(totalSeconds);
    }
  };

  return (
    <XStack flex={1} gap="$0.5" alignItems="center">
      <Input
        size="$3"
        value={hours}
        onChangeText={(val) => handleChange("hours", val)}
        onBlur={updateDuration}
        selectTextOnFocus
        placeholder="00"
        keyboardType="number-pad"
        textAlign="center"
        backgroundColor={isActive ? "$background" : "$backgroundMuted"}
        borderColor={isActive ? "$borderSoft" : "$borderMuted"}
        color={isActive ? "$color" : "$textMuted"}
        editable={isActive}
        width={45}
        maxLength={2}
      />
      <Text fontSize="$3" color="$textMuted">
        :
      </Text>
      <Input
        ref={minutesRef}
        size="$3"
        value={minutes}
        onChangeText={(val) => handleChange("minutes", val)}
        onBlur={updateDuration}
        selectTextOnFocus
        placeholder="00"
        keyboardType="number-pad"
        textAlign="center"
        backgroundColor={isActive ? "$background" : "$backgroundMuted"}
        borderColor={isActive ? "$borderSoft" : "$borderMuted"}
        color={isActive ? "$color" : "$textMuted"}
        editable={isActive}
        width={45}
        maxLength={2}
      />
      <Text fontSize="$3" color="$textMuted">
        :
      </Text>
      <Input
        ref={secondsRef}
        size="$3"
        value={seconds}
        onChangeText={(val) => handleChange("seconds", val)}
        onBlur={updateDuration}
        selectTextOnFocus
        placeholder="00"
        keyboardType="number-pad"
        textAlign="center"
        backgroundColor={isActive ? "$background" : "$backgroundMuted"}
        borderColor={isActive ? "$borderSoft" : "$borderMuted"}
        color={isActive ? "$color" : "$textMuted"}
        editable={isActive}
        width={45}
        maxLength={2}
      />
    </XStack>
  );
}
