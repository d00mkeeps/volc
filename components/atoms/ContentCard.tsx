import React from "react";
import { Stack, Text } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

interface ContentCardProps {
  title: string;
  subtitle: string;
  date: Date;
  onPress: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}

export default function ContentCard({
  title,
  subtitle,
  date,
  onPress,
  showDelete = false,
  onDelete,
}: ContentCardProps) {
  const handleDelete = (e: any) => {
    e.stopPropagation();
    onDelete?.();
  };

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
      <Stack
        flexDirection="row"
        justifyContent="space-between"
        alignItems="flex-start"
        marginBottom="$2"
      >
        <Stack flex={1} marginRight="$1">
          <Text fontSize="$4" fontWeight="600" color="$text" numberOfLines={1}>
            {title}
          </Text>
        </Stack>

        <Stack flexDirection="row" alignItems="center" gap="$2">
          {!showDelete && (
            <Text fontSize="$4" color="$textSoft" fontWeight={800}>
              {formatDate(date)}
            </Text>
          )}

          {showDelete && (
            <Stack
              padding="$2"
              borderRadius="$2"
              pressStyle={{ backgroundColor: "$backgroundHover" }}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            </Stack>
          )}
        </Stack>
      </Stack>

      <Text fontSize="$4" color="$textSoft" numberOfLines={2} fontWeight="500">
        {subtitle}
      </Text>
    </Stack>
  );
}
