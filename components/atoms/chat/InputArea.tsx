import { WorkoutValidation } from "@/utils/validation";
import React, { useState, useCallback } from "react";
import { XStack } from "tamagui";
import TextArea from "@/components/atoms/core/TextArea";
import Button from "@/components/atoms/core/Button";
import { Send } from "@/assets/icons/IconMap";

interface InputAreaProps {
  disabled?: boolean;
  placeholder?: string;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export const InputArea = ({
  disabled = false,
  placeholder = "send message...",
  onSendMessage,
  isLoading = false,
}: InputAreaProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | undefined>();

  const handleSend = useCallback(() => {
    const validation = WorkoutValidation.chatMessage(input);

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    if (!disabled && input.trim()) {
      onSendMessage(input.trim());
      setInput("");
      setError(undefined);
    }
  }, [disabled, isLoading, input, onSendMessage]);

  return (
    <XStack
      padding="$2"
      gap="$2"
      backgroundColor="$background"
      alignItems="flex-end"
    >
      <TextArea
        flex={1}
        size="small"
        numberOfLines={8}
        value={input}
        onChangeText={(text) => {
          setInput(text);
          if (error && text.length <= 500) setError(undefined);
        }}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        borderColor={error ? "$error" : "$borderSoft"}
        color="$color"
        opacity={isLoading ? 0.6 : 1}
        placeholderTextColor="$textMuted"
        onSubmitEditing={handleSend}
        returnKeyType="send"
        maxLength={500}
        verticalAlign="top"
        paddingTop="$2"
        paddingBottom="$2"
      />
      <Button
        size="$3"
        alignSelf="auto"
        backgroundColor={isPressed ? "$primary" : "$background"}
        disabled={disabled || !input.trim()}
        onPress={handleSend}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        circular
        icon={<Send color="#f84f3e" size={22} />}
        disabledStyle={{
          backgroundColor: "$background",
          opacity: 0.5,
        }}
      />
    </XStack>
  );
};
