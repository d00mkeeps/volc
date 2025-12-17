import React, { useState } from "react";
import { Stack, YStack, Separator } from "tamagui";
import Button from "@/components/atoms/core/Button";
import Text from "@/components/atoms/core/Text";
import { AppIcon } from "@/assets/icons/IconMap";
import { Modal, TouchableOpacity, Pressable } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";

interface ____HomeScreenHeaderMenuProps____ {
  onNewChat: () => void;
  onNewWorkout: () => void;
}

// /components/molecules/headers/HomeScreenHeaderMenu
export const HomeScreenHeaderMenu = ({
  onNewChat,
  onNewWorkout,
}: ____HomeScreenHeaderMenuProps____) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNewChat = () => {
    setIsOpen(false);
    onNewChat();
  };

  const handleNewWorkout = () => {
    setIsOpen(false);
    onNewWorkout();
  };

  return (
    <>
      <Button
        size="$3"
        circular
        onPress={() => setIsOpen(true)}
        backgroundColor="$backgroundHover"
      >
        <Text size="large">+</Text>
      </Button>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.3)",
              justifyContent: "flex-start",
              alignItems: "flex-end",
              paddingTop: 120,
              paddingRight: 110,
            }}
          >
            <Animated.View
              entering={FadeInDown.duration(250).springify()}
              exiting={FadeOutUp.duration(200)}
              layout={Layout.springify()}
            >
              <YStack
                backgroundColor="$background"
                borderRadius="$4"
                paddingVertical="$3"
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.25}
                shadowRadius={8}
                elevation={5}
                minWidth={160}
              >
                <TouchableOpacity onPress={handleNewChat}>
                  <Stack
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="center"
                    gap="$6"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                  >
                    <AppIcon name="MessageCircle" size={22} color="$text" />
                    <Text size="medium" color="$text">
                      New Chat
                    </Text>
                  </Stack>
                </TouchableOpacity>

                <Separator marginVertical="$2" />

                <TouchableOpacity onPress={handleNewWorkout}>
                  <Stack
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="center"
                    gap="$6"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                  >
                    <AppIcon name="Dumbbell" size={22} color="$text" />
                    <Text size="medium" color="$text">
                      New Workout
                    </Text>
                  </Stack>
                </TouchableOpacity>
              </YStack>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};
