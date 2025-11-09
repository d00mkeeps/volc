import React, { useState, useEffect, useRef } from "react";
import { YStack, XStack, Stack } from "tamagui";
import Text from "@/components/atoms/core/Text";
import Input from "@/components/atoms/core/Input";
import { WorkoutValidation } from "@/utils/validation";

interface DurationInputProps {
  value: number | string | null | undefined;
  onChange: (seconds: number | undefined) => void;
  isActive: boolean;
  showError?: boolean;
}

export default function DurationInput({
  value,
  onChange,
  isActive,
  showError = false,
}: DurationInputProps) {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");

  const minutesRef = useRef<any>(null);
  const secondsRef = useRef<any>(null);

  useEffect(() => {
    if (typeof value === "number" && value > 0) {
      const h = Math.floor(value / 3600);
      const m = Math.floor((value % 3600) / 60);
      const s = value % 60;
      setHours(h > 0 ? h.toString() : "");
      setMinutes(m > 0 ? m.toString().padStart(2, "0") : "");
      setSeconds(s > 0 ? s.toString().padStart(2, "0") : "");
    } else if (!value) {
      setHours("");
      setMinutes("");
      setSeconds("");
    }
  }, [value]);

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

    if (totalSeconds > 0) {
      const validation = WorkoutValidation.duration(totalSeconds);
      if (validation.isValid) {
        onChange(totalSeconds);
      }
    } else {
      onChange(undefined);
    }
  };

  const isEmpty =
    (!hours || hours === "0") &&
    (!minutes || minutes === "0" || minutes === "00") &&
    (!seconds || seconds === "0" || seconds === "00");
  const shouldShowError = showError && isEmpty;
  const errorBorderColor = shouldShowError
    ? "$red8"
    : isActive
    ? "$borderSoft"
    : "$borderMuted";
  const errorBackground = shouldShowError
    ? "rgba(239, 68, 68, 0.08)"
    : isActive
    ? "$background"
    : "$backgroundMuted";

  const inputProps = {
    size: "$3" as const,
    placeholder: "00",
    placeholderTextColor: shouldShowError ? "$red8" : "$textMuted",
    keyboardType: "number-pad" as const,
    textAlign: "center" as const,
    backgroundColor: errorBackground,
    borderColor: errorBorderColor,
    borderWidth: shouldShowError ? 1.5 : 1,
    color: isActive ? "$color" : "$textMuted",
    editable: isActive,
    width: 55,
    maxLength: 2,
    focusStyle: { borderColor: "$primary" },
  };

  return (
    <YStack flex={1} alignSelf="center" position="relative">
      <YStack position="relative">
        <XStack gap="$0.5" alignItems="center" justifyContent="center">
          <Input
            {...inputProps}
            value={hours}
            onChangeText={(val) => handleChange("hours", val)}
            onBlur={updateDuration}
          />
          <Text size="medium" color="$textMuted">
            :
          </Text>
          <Input
            {...inputProps}
            ref={minutesRef}
            value={minutes}
            onChangeText={(val) => handleChange("minutes", val)}
            onBlur={updateDuration}
          />
          <Text size="medium" color="$textMuted">
            :
          </Text>
          <Input
            {...inputProps}
            ref={secondsRef}
            value={seconds}
            onChangeText={(val) => handleChange("seconds", val)}
            onBlur={updateDuration}
          />
        </XStack>
        {shouldShowError && (
          <Stack
            position="absolute"
            top="100%"
            left={0}
            right={0}
            marginTop="$1"
            zIndex={1000}
            backgroundColor="$backgroundSoft"
            paddingHorizontal="$1"
            borderRadius="$2"
          >
            <Text
              size="small"
              color="$red8"
              textAlign="center"
              numberOfLines={1}
            >
              missing duration
            </Text>
          </Stack>
        )}
      </YStack>
    </YStack>
  );
}
