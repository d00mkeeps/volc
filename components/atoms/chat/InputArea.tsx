import { WorkoutValidation } from "@/utils/validation";
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { XStack, YStack, Text } from "tamagui";
import { Animated } from "react-native";
import TextArea from "@/components/atoms/core/TextArea";
import Button from "@/components/atoms/core/Button";
import { AppIcon } from "@/assets/icons/IconMap";
import { useChatStore } from "@/stores/chat/ChatStore";

interface InputAreaProps {
  placeholder?: string;
  onSendMessage: (message: string) => void;
  isStreaming?: boolean;
  shouldPulse?: boolean;
  onPulseComplete?: () => void;
  onFocus?: () => void;
  onCancel?: () => void;
}

export interface InputAreaRef {
  setText: (text: string) => void;
}

export const InputArea = forwardRef<InputAreaRef, InputAreaProps>(
  (
    {
      placeholder = "send message...",
      onSendMessage,
      isStreaming = false, // Keep for backwards compatibility, but we'll override with store
      shouldPulse = false,
      onPulseComplete,
      onFocus: onFocusProp,
      onCancel,
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);
    const [input, setInput] = useState("");
    const [error, setError] = useState<string | undefined>();
    const [isPulsing, setIsPulsing] = useState(false);
    const [stopCooldown, setStopCooldown] = useState(false);

    // Get loading state from ChatStore
    const loadingState = useChatStore((state) => state.loadingState);

    // Component is busy when pending OR streaming
    const isBusy = loadingState === "pending" || loadingState === "streaming";

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const sendOpacity = useRef(new Animated.Value(1)).current;
    const stopOpacity = useRef(new Animated.Value(0)).current;
    const stopCooldownOpacity = useRef(new Animated.Value(1)).current;

    const pulseTimeout = useRef<NodeJS.Timeout | null>(null);
    const cooldownTimeout = useRef<NodeJS.Timeout | null>(null);
    const textAreaKey = useRef(0);

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        setText: (text: string) => {
          setInput(text);
          setError(undefined);
          textAreaKey.current += 1; // Force re-render with new value
        },
      }),
      []
    );

    // Crossfade between Send and Stop buttons (now triggers on pending OR streaming)
    useEffect(() => {
      Animated.parallel([
        Animated.timing(sendOpacity, {
          toValue: isBusy ? 0 : 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(stopOpacity, {
          toValue: isBusy ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isBusy, sendOpacity, stopOpacity]);

    // Pulse animation effect
    useEffect(() => {
      if (shouldPulse) {
        setIsPulsing(true);

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
      setInput("");
      setError(undefined);
      textAreaKey.current += 1;
    }, []);

    const handleSend = useCallback(() => {
      const trimmedInput = input.trim();

      if (!trimmedInput) {
        return;
      }

      const validation = WorkoutValidation.chatMessage(trimmedInput);
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }

      onSendMessage(trimmedInput);
      clearInput();

      setTimeout(() => {
        clearInput();
      }, 100);
    }, [input, onSendMessage, clearInput]);

    const handleCancel = useCallback(() => {
      console.log("[InputArea] Cancel button pressed", {
        timestamp: Date.now(),
        stopCooldown,
        isBusy,
        loadingState,
      });

      if (stopCooldown) return;

      onCancel?.();
      setStopCooldown(true);

      // Fade out stop button opacity over 5 seconds
      Animated.timing(stopCooldownOpacity, {
        toValue: 0.3,
        duration: 5000,
        useNativeDriver: true,
      }).start();

      // Re-enable after 5 seconds
      cooldownTimeout.current = setTimeout(() => {
        setStopCooldown(false);
        stopCooldownOpacity.setValue(1);
      }, 5000) as unknown as NodeJS.Timeout;
    }, [stopCooldown, onCancel, stopCooldownOpacity]);

    // Cleanup cooldown timer
    useEffect(() => {
      return () => {
        if (cooldownTimeout.current) {
          clearTimeout(cooldownTimeout.current);
        }
      };
    }, []);

    // Reset cooldown when no longer busy
    useEffect(() => {
      if (!isBusy && stopCooldown) {
        setStopCooldown(false);
        stopCooldownOpacity.setValue(1);
        if (cooldownTimeout.current) {
          clearTimeout(cooldownTimeout.current);
        }
      }
    }, [isBusy, stopCooldown, stopCooldownOpacity]);

    const handleFocus = useCallback(() => {
      if (isPulsing) {
        setIsPulsing(false);
        pulseAnim.setValue(1);
        if (pulseTimeout.current) {
          clearTimeout(pulseTimeout.current);
        }
        onPulseComplete?.();
      }
      onFocusProp?.();
    }, [isPulsing, pulseAnim, onPulseComplete, onFocusProp]);

    const handleTextChange = useCallback(
      (text: string) => {
        setInput(text);
        if (error && text.length <= 500) {
          setError(undefined);
        }
      },
      [error]
    );

    // Internal validation - can send if not busy and input is valid
    const canSend = !isBusy && !!input.trim();
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
              placeholder={placeholder}
              disabled={false} // Always enabled
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

            {/* Send Button */}
            <Animated.View
              style={{
                opacity: sendOpacity,
                position: isBusy ? "absolute" : "relative",
                right: isBusy ? 8 : undefined,
                bottom: isBusy ? 8 : undefined,
              }}
              pointerEvents={isBusy ? "none" : "auto"}
            >
              <Button
                size="$3"
                alignSelf="auto"
                backgroundColor="$transparent"
                borderColor={isPressed ? "$primary" : "$borderSoft"}
                borderWidth={isPressed ? 2 : 0}
                disabled={!canSend}
                onPress={handleSend}
                onPressIn={() => setIsPressed(true)}
                onPressOut={() => setIsPressed(false)}
                circular
                icon={<AppIcon name="Send" color="#f84f3e" size={22} />}
                pressStyle={{
                  backgroundColor: "$transparent",
                }}
                disabledStyle={{
                  backgroundColor: "$transparent",
                  opacity: 0.7,
                }}
              />
            </Animated.View>

            {/* Stop Button */}
            <Animated.View
              style={{
                opacity: Animated.multiply(stopOpacity, stopCooldownOpacity),
                position: !isBusy ? "absolute" : "relative",
                right: !isBusy ? 8 : undefined,
                bottom: !isBusy ? 8 : undefined,
              }}
              pointerEvents={!isBusy ? "none" : "auto"}
            >
              <Button
                size="$3"
                alignSelf="auto"
                backgroundColor="$transparent"
                borderColor={
                  isPressed && !stopCooldown ? "$primary" : "$borderSoft"
                }
                borderWidth={isPressed && !stopCooldown ? 2 : 0}
                disabled={stopCooldown}
                onPress={handleCancel}
                onPressIn={() => !stopCooldown && setIsPressed(true)}
                onPressOut={() => setIsPressed(false)}
                circular
                icon={<AppIcon name="Stop" color="#f84f3e" size={22} />}
                pressStyle={{
                  backgroundColor: "$transparent",
                }}
                disabledStyle={{
                  backgroundColor: "$transparent",
                  opacity: 1, // Don't apply default disabled opacity
                }}
              />
            </Animated.View>
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
  }
);

InputArea.displayName = "InputArea";
