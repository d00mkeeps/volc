// /components/organisms/Slide1.tsx
import React from "react";
import { YStack, XStack } from "tamagui";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";

interface Slide1Props {
  isImperial: boolean | null;
  setIsImperial: (value: boolean) => void;
  goToSlide: (index: number) => void;
}

export default function Slide1({
  isImperial,
  setIsImperial,
  goToSlide,
}: Slide1Props) {
  return (
    <YStack paddingTop="$2" paddingHorizontal="$6">
      <YStack paddingBottom="$2">
        <Text size="large" fontWeight="700" fontSize={28}>
          Welcome to Volc! 🌋
        </Text>
      </YStack>

      <YStack
        gap="$4"
        alignItems="center"
        justifyContent="center"
        paddingTop="$10"
      >
        <Text fontSize={18} fontWeight="600" color="$color" marginBottom="$2">
          Which do you use?
        </Text>

        <XStack
          backgroundColor="$gray4"
          borderRadius="$4"
          padding="$1.5"
          width="100%"
        >
          <Button
            flex={1}
            backgroundColor={
              isImperial === false ? "$background" : "transparent"
            }
            borderRadius="$3"
            paddingVertical="$2"
            onPress={() => {
              console.log("[Slide1] Selected: kg/km");
              setIsImperial(false);
              setTimeout(() => goToSlide(1), 150);
            }}
            pressStyle={{ opacity: 0.8 }}
            borderColor="$primary"
            borderWidth={isImperial === false ? 0.25 : 0}
            shadowColor={isImperial === false ? "$shadowColor" : "transparent"}
            shadowOffset={
              isImperial === false
                ? { width: 0, height: 1 }
                : { width: 0, height: 0 }
            }
            shadowOpacity={isImperial === false ? 0.1 : 0}
            shadowRadius={isImperial === false ? 2 : 0}
            elevation={isImperial === false ? 2 : 0}
          >
            <Text
              fontWeight={isImperial === false ? "600" : "400"}
              color={isImperial === false ? "$color" : "$textMuted"}
              fontSize={16}
            >
              kg / km
            </Text>
          </Button>

          <Button
            flex={1}
            backgroundColor={
              isImperial === true ? "$background" : "transparent"
            }
            borderRadius="$3"
            paddingVertical="$2"
            onPress={() => {
              console.log("[Slide1] Selected: lbs/miles");
              setIsImperial(true);
              setTimeout(() => goToSlide(1), 150);
            }}
            pressStyle={{ opacity: 0.8 }}
            borderColor="$primary"
            borderWidth={isImperial === true ? 0.25 : 0}
            shadowColor={isImperial === true ? "$shadowColor" : "transparent"}
            shadowOffset={
              isImperial === true
                ? { width: 0, height: 1 }
                : { width: 0, height: 0 }
            }
            shadowOpacity={isImperial === true ? 0.1 : 0}
            shadowRadius={isImperial === true ? 2 : 0}
            elevation={isImperial === true ? 2 : 0}
          >
            <Text
              fontWeight={isImperial === true ? "600" : "400"}
              color={isImperial === true ? "$color" : "$textMuted"}
              fontSize={16}
            >
              lbs / miles
            </Text>
          </Button>
        </XStack>
      </YStack>
    </YStack>
  );
}
