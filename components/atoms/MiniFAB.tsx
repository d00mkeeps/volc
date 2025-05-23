// MiniFAB.tsx
import React from "react";
import { Stack, Text } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
// Updated MiniFAB with staggered animation
interface MiniFABProps {
  icon: keyof typeof Ionicons.glyphMap; // Proper Ionicons type
  label: string;
  onPress: () => void;
  delay?: number;
}

function MiniFAB({ icon, label, onPress, delay = 0 }: MiniFABProps) {
  return (
    <Stack
      flexDirection="row"
      alignItems="center"
      gap="$2"
      pressStyle={{ scale: 0.95 }}
      onPress={onPress}
      animation="quick"
      animationDelay={`${delay}ms`}
      enterStyle={{
        opacity: 0,
        x: 50,
        scale: 0.8,
      }}
    >
      <Text
        fontSize="$3"
        fontWeight="500"
        color="$text"
        backgroundColor="$backgroundSoft"
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderRadius="$2"
      >
        {label}
      </Text>
      <Stack
        width={48}
        height={48}
        backgroundColor="$primary"
        borderRadius={24}
        justifyContent="center"
        alignItems="center"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.2}
        shadowRadius={4}
      >
        <Ionicons name={icon} size={20} color="white" />
      </Stack>
    </Stack>
  );
}

export default MiniFAB;
