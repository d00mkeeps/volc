import { Input } from "tamagui";
import type { AuthInputProps } from "@/types/auth";

export function AuthInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType = "default",
}: AuthInputProps) {
  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="$textMuted"
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      backgroundColor="$backgroundStrong"
      borderRadius="$4"
      padding="$3"
      marginBottom="$3"
      fontSize="$4"
      borderWidth={1}
      borderColor="$borderSoft"
      color="$color"
    />
  );
}
