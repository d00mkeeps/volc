import { WorkoutValidation } from "@/utils/validation";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { XStack, YStack, Spinner, Text } from "tamagui";
import { Animated } from "react-native";
import TextArea from "@/components/atoms/core/TextArea";
import Button from "@/components/atoms/core/Button";
import { Send } from "@/assets/icons/IconMap";

interface InputAreaProps {
  disabled?: boolean;
  placeholder?: string;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  shouldPulse?: boolean;
  onPulseComplete?: () => void;
  onFocus?: () => void; // Added onFocus prop
}

export const InputArea = ({
  disabled = false,
  placeholder = "send message...",
  onSendMessage,
  isLoading = false,
  shouldPulse = false,
  onPulseComplete,
  onFocus: onFocusProp,
}: InputAreaProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseTimeout = useRef<NodeJS.Timeout | null>(null);
  const textAreaKey = useRef(0);

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

  const clearInput = useCallback(() => {
    // More robust clearing: update state, increment key to force remount, clear error
    setInput("");
    setError(undefined);
    textAreaKey.current += 1;
  }, []);

  const handleSend = useCallback(() => {
    const trimmedInput = input.trim();

    // Early return if empty
    if (!trimmedInput) {
      return;
    }

    // Validate the message
    const validation = WorkoutValidation.chatMessage(trimmedInput);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    // If not disabled, send the message and clear immediately
    if (!disabled) {
      onSendMessage(trimmedInput);
      // Clear input immediately after sending
      clearInput();

      // Double clear to handle autocorrect race conditions
      setTimeout(() => {
        clearInput();
      }, 100);
    }
  }, [disabled, input, onSendMessage, clearInput]);

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
    // Call external onFocus if provided
    onFocusProp?.();
  }, [isPulsing, pulseAnim, onPulseComplete, onFocusProp]);

  const handleTextChange = useCallback(
    (text: string) => {
      setInput(text);
      // Clear error if we're back under the limit
      if (error && text.length <= 500) {
        setError(undefined);
      }
    },
    [error]
  );

  // Calculate remaining characters
  const length = input.length;
  const showCounter = input.length >= 200;

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }],
      }}
    >
      <YStack gap="$1">
        <XStack
          paddingHorizontal="$2"
          gap="$2"
          backgroundColor="$transparent"
          alignItems="flex-end"
        >
          <TextArea
            key={textAreaKey.current}
            flex={1}
            size="small"
            borderRadius={16}
            value={input}
            verticalAlign="top"
            onChangeText={handleTextChange}
            placeholder={isLoading ? "please wait" : placeholder}
            disabled={disabled}
            borderColor={
              error ? "$error" : isPulsing ? "$primary" : "$borderSoft"
            }
            color="$color"
            opacity={1}
            placeholderTextColor="$textMuted"
            onSubmitEditing={handleSend}
            onFocus={handleFocus}
            returnKeyType="send"
            maxLength={500}
            numberOfLines={8}
          />
          <Button
            size="$3"
            alignSelf="auto"
            backgroundColor="$transparent"
            borderColor={isPressed ? "$primary" : "$borderSoft"}
            borderWidth={isPressed ? 2 : 0}
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
            pressStyle={{
              backgroundColor: "$transparent",
            }}
            disabledStyle={{
              backgroundColor: "$transparent",
              opacity: 0.7,
            }}
          />
        </XStack>
        {showCounter && (
          <XStack justifyContent="flex-end" paddingHorizontal="$2">
            <Text
              fontSize={11}
              color={length > 450 ? "$error" : "$textMuted"}
              opacity={0.7}
            >
              {length}/500
            </Text>
          </XStack>
        )}
      </YStack>
    </Animated.View>
  );
};
