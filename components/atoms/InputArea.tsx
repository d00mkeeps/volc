// components/chat/atoms/InputArea.tsx
import React, { useState, useCallback } from "react";
import { XStack, Input, Button, Text } from "tamagui";
import { Send } from "@tamagui/lucide-icons";

interface InputAreaProps {
  disabled?: boolean;
  placeholder?: string;
  onSendMessage: (message: string) => void;
}

export const InputArea = ({
  disabled = false,
  placeholder = "Type a message...",
  onSendMessage,
}: InputAreaProps) => {
  const [input, setInput] = useState("");

  const handleSend = useCallback(() => {
    if (!disabled && input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  }, [disabled, input, onSendMessage]);

  const handleSubmit = useCallback(() => {
    handleSend();
  }, [handleSend]);

  return (
    <XStack
      padding="$3"
      gap="$2"
      backgroundColor="$background"
      borderTopWidth={1}
      borderTopColor="$borderSoft"
    >
      <Input
        flex={1}
        value={input}
        onChangeText={setInput}
        placeholder={disabled ? "Please wait..." : placeholder}
        disabled={disabled}
        backgroundColor={disabled ? "$backgroundMuted" : "$backgroundSoft"}
        borderColor="$borderSoft"
        color="$color"
        placeholderTextColor="$textMuted"
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
        multiline={false}
        maxLength={1000}
      />

      <Button
        size="$3"
        backgroundColor="$primary"
        disabled={disabled || !input.trim()}
        onPress={handleSend}
        circular
        icon={Send}
        color="white"
      />
    </XStack>
  );
};
