import React from "react";
import { TouchableOpacity, Animated, useColorScheme } from "react-native";
import { YStack, XStack, Stack, useTheme } from "tamagui";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import { AppIcon } from "@/assets/icons/IconMap";
import DateTimePicker from "@react-native-community/datetimepicker";

interface Slide2Props {
  theme: ReturnType<typeof useTheme>;
  dob: Date;
  setDob: (date: Date) => void;
  dobChanged: boolean;
  setDobChanged: (changed: boolean) => void;
  formatDate: (date: Date) => string;
  isAgeValid: (date: Date) => boolean;
  iconOpacity: Animated.Value;
  canProgressDob: boolean;
  goToSlide: (index: number) => void;
}

export default function Slide2({
  theme,
  dob,
  setDob,
  dobChanged,
  setDobChanged,
  formatDate,
  isAgeValid,
  iconOpacity,
  canProgressDob,
  goToSlide,
}: Slide2Props) {
  const colorScheme = useColorScheme();

  return (
    <YStack paddingHorizontal="$6">
      {/* Header */}
      <YStack paddingBottom="$2">
        <XStack alignItems="center" gap="$4" marginBottom="$1">
          <TouchableOpacity
            onPress={() => goToSlide(0)}
            style={{ padding: 4, marginLeft: -4 }}
          >
            <AppIcon name="ChevronLeft" size={20} color={theme.color.val} />
          </TouchableOpacity>
          <Text size="large" fontWeight="700" fontSize={24}>
            Select your birthday
          </Text>
        </XStack>
      </YStack>

      {/* Middle content */}
      <YStack justifyContent="center">
        <YStack alignItems="center" gap="$2" marginTop="$6">
          <XStack gap="$4" alignItems="center" justifyContent="center">
            <Text
              color="$textMuted"
              fontWeight="700"
              fontSize={22}
              textAlign="center"
            >
              {formatDate(dob)}
            </Text>
            <Animated.View style={{ opacity: iconOpacity }}>
              {isAgeValid(dob) ? (
                <AppIcon name="Check" size={20} color="$green8" />
              ) : (
                <AppIcon name="X" size={20} color="$red8" />
              )}
            </Animated.View>
          </XStack>
          <Text
            color="$red10"
            fontSize={14}
            textAlign="center"
            opacity={dobChanged && !isAgeValid(dob) ? 1 : 0}
          >
            You must be 16 or older to use Volc
          </Text>
        </YStack>

        <Stack
          backgroundColor="transparent"
          borderRadius="$4"
          overflow="hidden"
          width="100%"
          alignItems="center"
          paddingVertical="$2"
        >
          <DateTimePicker
            value={dob}
            mode="date"
            display="spinner"
            themeVariant={colorScheme === "dark" ? "dark" : "light"}
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                console.log("[Slide2] DOB selected:", selectedDate);
                setDob(selectedDate);
                setDobChanged(true);
              }
            }}
            minimumDate={(() => {
              const minDate = new Date();
              minDate.setFullYear(minDate.getFullYear() - 100);
              return minDate;
            })()}
            style={{ height: 180 }}
            maximumDate={new Date()}
          />
        </Stack>
      </YStack>

      {/* Spacer to push button down */}
      <Stack flex={1} minHeight="$4" />

      <Button
        onPress={() => goToSlide(2)}
        disabled={!canProgressDob}
        marginBottom="$4"
        size="large"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.15}
        shadowRadius={4}
        elevation={3}
      >
        <Text color="white" fontWeight="600" fontSize={18}>
          Continue
        </Text>
      </Button>
    </YStack>
  );
}
