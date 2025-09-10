import { PlusCircle, Settings, Play, Pause } from "@/assets/icons/IconMap";
import React from "react";
import { Stack } from "tamagui";
import Text from "@/components/atoms/Text";
import Button from "@/components/atoms/Button";

interface ActionButtonProps {
  icon?: string;
  label: string;
  onPress: () => void;
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    "add-circle": PlusCircle,
    "settings-outline": Settings,
    play: Play,
    pause: Pause,
  };
  return iconMap[iconName] || PlusCircle;
};

export default function FloatingActionButton({
  icon,
  label,
  onPress,
}: ActionButtonProps) {
  return (
    <Button
      width="50%"
      height={60}
      alignSelf="center"
      backgroundColor="$primary"
      borderRadius="$4"
      pressStyle={{
        backgroundColor: "$primaryMuted",
        scale: 0.98,
      }}
      hoverStyle={{
        backgroundColor: "$primaryLight",
      }}
      onPress={onPress}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        gap={icon ? "$1" : 0}
        flex={1}
      >
        {icon &&
          React.createElement(getIconComponent(icon), {
            size: 20,
            color: "white",
          })}
        <Text color="white" size="large" fontWeight="700" textAlign="center">
          {label}
        </Text>
      </Stack>
    </Button>
  );
}
