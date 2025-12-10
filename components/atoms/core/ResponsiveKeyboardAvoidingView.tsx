import {
  KeyboardAvoidingView,
  Platform,
  KeyboardAvoidingViewProps,
} from "react-native";
import React from "react";

interface ResponsiveKeyboardAvoidingViewProps
  extends KeyboardAvoidingViewProps {
  children: React.ReactNode;
  additionalOffset?: number;
}

export function ResponsiveKeyboardAvoidingView({
  children,
  additionalOffset = 0,
  ...rest
}: ResponsiveKeyboardAvoidingViewProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={additionalOffset}
      {...rest}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
