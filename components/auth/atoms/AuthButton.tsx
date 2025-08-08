import { Button, Spinner, Text } from "tamagui";
import type { AuthButtonProps } from "@/types/auth";

export function AuthButton({ onPress, loading, title }: AuthButtonProps) {
  return (
    <Button
      onPress={onPress}
      disabled={loading}
      backgroundColor="$primary"
      borderRadius="$4"
      marginVertical="$2"
      borderWidth={2}
      borderColor="$primary"
      fontSize="$4"
      fontWeight="600"
      pressStyle={{
        backgroundColor: "$primaryMuted",
        borderColor: "$primaryMuted",
      }}
      disabledStyle={{
        backgroundColor: "$primaryMuted",
        opacity: 0.7,
      }}
    >
      {loading ? (
        <Spinner color="#ffffff" />
      ) : (
        <Text color="#ffffff" fontSize="$4" fontWeight="600">
          {title}
        </Text>
      )}
    </Button>
  );
}
