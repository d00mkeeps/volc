import React from "react";
import { YStack, Text } from "tamagui";

interface DataCardProps {
  title: string;
  data: any;
}

export default function DataCard({ title, data }: DataCardProps) {
  const hasData = data && Object.keys(data).length > 0;

  return (
    <YStack
      backgroundColor="$backgroundSoft"
      borderRadius="$3"
      padding="$3"
      gap="$2"
    >
      <Text fontSize="$4" fontWeight="600" color="$color">
        {title}
      </Text>

      {hasData ? (
        <YStack
          backgroundColor="$backgroundPress"
          borderRadius="$2"
          padding="$2"
        >
          <Text fontSize="$2" fontFamily="$mono" color="$color" lineHeight={18}>
            {JSON.stringify(data, null, 2)}
          </Text>
        </YStack>
      ) : (
        <Text fontSize="$3" color="$textSoft" fontStyle="italic">
          No data set
        </Text>
      )}
    </YStack>
  );
}
