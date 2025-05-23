import React, { useState } from "react";
import { Stack, Text, AnimatePresence, YStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import MiniFAB from "./MiniFAB";

interface FABProps {
  onCreateWorkout: () => void;
  onCreateConversation: () => void;
}

export default function FAB({
  onCreateWorkout,
  onCreateConversation,
}: FABProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const handleAction = (action: () => void) => {
    action();
    setIsExpanded(false);
  };

  return (
    <>
      {/* Backdrop overlay with fade animation */}
      <AnimatePresence>
        {isExpanded && (
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 98,
            }}
            onPress={() => setIsExpanded(false)}
          >
            <Stack
              flex={1}
              backgroundColor="rgba(0,0,0,0.3)"
              animation="quick"
              enterStyle={{
                opacity: 0,
              }}
              exitStyle={{
                opacity: 0,
              }}
            />
          </Pressable>
        )}
      </AnimatePresence>

      {/* Mini FABs with slide + stagger animation */}
      <AnimatePresence>
        {isExpanded && (
          <YStack
            position="absolute"
            bottom={98} // Your updated positioning
            right={16}
            zIndex={99}
            gap="$3"
            animation="quick"
            enterStyle={{
              opacity: 0,
              scale: 0.5,
              y: 50,
            }}
            exitStyle={{
              opacity: 0,
              scale: 0.5,
              y: 50,
            }}
          >
            <MiniFAB
              icon="fitness-outline"
              label="New Workout"
              onPress={() => handleAction(onCreateWorkout)}
              delay={0}
            />
            <MiniFAB
              icon="chatbubble-outline"
              label="New Chat"
              onPress={() => handleAction(onCreateConversation)}
              delay={100}
            />
          </YStack>
        )}
      </AnimatePresence>

      {/* Main FAB with rotation */}
      <Stack
        position="absolute"
        bottom={20} // Your updated positioning
        right={16}
        zIndex={100}
        width={64}
        height={64}
        backgroundColor="$primary"
        borderRadius={32}
        justifyContent="center"
        alignItems="center"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.3}
        shadowRadius={8}
        pressStyle={{
          scale: 0.95,
        }}
        animation="tooltip"
        rotate={isExpanded ? "45deg" : "0deg"} // Rotation animation
        onPress={toggleExpanded}
      >
        <Ionicons name={isExpanded ? "close" : "add"} size={24} color="white" />
      </Stack>
    </>
  );
}
