import React from "react";
import { Stack, Text } from "tamagui";

interface ContentCardProps {
  title: string;
  subtitle: string;
  date: Date;
  onPress: () => void;
}

export default function ContentCard({
  title,
  subtitle,
  date,
  onPress,
}: ContentCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Stack
      flex={1}
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      paddingHorizontal="$3"
      paddingVertical="$2"
      borderWidth={1}
      borderColor="transparent"
      pressStyle={{
        borderColor: "$primary",
        backgroundColor: "$background",
        scale: 0.98,
      }}
      hoverStyle={{
        borderColor: "$primaryLight",
      }}
      cursor="pointer"
      onPress={onPress}
    >
      {/* Header with date */}
      <Stack
        flexDirection="row"
        justifyContent="space-between"
        alignItems="flex-start"
        marginBottom="$2"
      >
        <Stack flex={1} marginRight="$1">
          <Text fontSize="$6" fontWeight="600" color="$text" numberOfLines={1}>
            {title}
          </Text>
        </Stack>
        <Text fontSize="$2" color="$textSoft" fontWeight={800}>
          {formatDate(date)}
        </Text>
      </Stack>

      {/* Subtitle */}
      <Text fontSize="$3" color="$textSoft" numberOfLines={2} fontWeight="500">
        {subtitle}
      </Text>
    </Stack>
  );
}
