import { Stack } from "tamagui";
import ActionButton from "./ActionButton";

interface FloatingActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}
// components/molecules/FloatingActionButton.tsx
export default function FloatingActionButton({
  icon,
  label,
  onPress,
}: FloatingActionButtonProps) {
  return (
    <Stack
      position="absolute"
      bottom="$4" // Adjust vertical position (e.g., "$6", "$8", 20, 40)
      left="$4" // Adjust left margin
      right="$4" // Adjust right margin
      // Or use specific positioning:
      // bottom={60}     // Specific pixel values
      // left={20}
      // right={20}
    >
      <ActionButton icon={icon} label={label} onPress={onPress} />
    </Stack>
  );
}
