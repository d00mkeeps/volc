import { WorkoutValidation } from "@/utils/validation";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { XStack, Spinner, AnimatePresence } from "tamagui";
import { Animated } from "react-native";
import TextArea from "@/components/atoms/core/TextArea";
import Button from "@/components/atoms/core/Button";
import { Send } from "@/assets/icons/IconMap";

interface InputAreaProps {
  disabled?: boolean;
  placeholder?: string;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  shouldPulse?: boolean; // Add this
  onPulseComplete?: () => void; // Add this
}

export const InputArea = ({
  disabled = false,
  placeholder = "send message...",
  onSendMessage,
  isLoading = false,
  shouldPulse = false,
  onPulseComplete,
}: InputAreaProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseTimeout = useRef<NodeJS.Timeout | null>(null);

  // Pulse animation effect
  useEffect(() => {
    if (shouldPulse) {
      setIsPulsing(true);

      // Start pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Stop after 10 seconds
      pulseTimeout.current = setTimeout(() => {
        pulse.stop();
        pulseAnim.setValue(1);
        setIsPulsing(false);
        onPulseComplete?.();
      }, 10000) as unknown as NodeJS.Timeout;

      return () => {
        pulse.stop();
        pulseAnim.setValue(1);
        if (pulseTimeout.current) {
          clearTimeout(pulseTimeout.current);
        }
      };
    }
  }, [shouldPulse, pulseAnim, onPulseComplete]);

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

  const handleFocus = useCallback(() => {
    // Stop pulse on focus
    if (isPulsing) {
      setIsPulsing(false);
      pulseAnim.setValue(1);
      if (pulseTimeout.current) {
        clearTimeout(pulseTimeout.current);
      }
      onPulseComplete?.();
    }
  }, [isPulsing, pulseAnim, onPulseComplete]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }],
      }}
    >
      <XStack
        padding="$2"
        gap="$2"
        backgroundColor="$transparent"
        alignItems="flex-end"
      >
        <TextArea
          flex={1}
          size="small"
          borderRadius={12}
          value={input}
          verticalAlign="top"
          onChangeText={(text) => {
            setInput(text);
            if (error && text.length <= 500) setError(undefined);
          }}
          placeholder={isLoading ? "please wait" : placeholder}
          disabled={disabled || isLoading}
          borderColor={
            error ? "$error" : isPulsing ? "$primary" : "$borderSoft"
          }
          color="$color"
          opacity={isLoading ? 0.6 : 1}
          placeholderTextColor="$textMuted"
          onSubmitEditing={handleSend}
          onFocus={handleFocus}
          returnKeyType="send"
          maxLength={500}
          paddingTop="$2"
          paddingBottom="$2"
          numberOfLines={8}
        />
        <Button
          size="$3"
          alignSelf="auto"
          backgroundColor={isPressed ? "$primary" : "$background"}
          disabled={disabled || !input.trim() || isLoading}
          onPress={handleSend}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          circular
          icon={
            isLoading ? (
              <Spinner size="small" color="$primary" />
            ) : (
              <Send color="#f84f3e" size={22} />
            )
          }
          disabledStyle={{
            backgroundColor: "$background",
            opacity: 0.7,
          }}
        />
      </XStack>
    </Animated.View>
  );
};
