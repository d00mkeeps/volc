// components/molecules/workout/WorkoutScratchpadSheet.tsx
import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Animated,
} from "react-native";
import { XStack, TextArea, useTheme } from "tamagui";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import Text from "@/components/atoms/core/Text";
import { AppIcon } from "@/assets/icons/IconMap";
import { stagingService } from "@/services/api/stagingService";
import { useUserStore } from "@/stores/userProfileStore";
import { StagedWorkout } from "@/types/staging";

interface WorkoutScratchpadSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onStaged?: (staged: StagedWorkout) => void;
}

export default function WorkoutScratchpadSheet({
  isVisible,
  onClose,
  onStaged,
}: WorkoutScratchpadSheetProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      backdropAnim.setValue(0);
      cardAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 220,
          delay: 90,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleDismiss = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleStageWorkout = async () => {
    if (!text.trim()) {
      Toast.show({
        type: "error",
        text1: "Empty Notes",
        text2: "Please write or paste workout notes before staging.",
      });
      return;
    }

    try {
      Keyboard.dismiss();
      setIsLoading(true);
      const userProfile = useUserStore.getState().userProfile;
      const isImperial = userProfile?.is_imperial ?? false;

      const staged = await stagingService.stageWorkout({
        raw_text: text.trim(),
        reference_timestamp: new Date().toISOString(),
        is_imperial: isImperial,
      });

      Toast.show({
        type: "success",
        text1: "Workout Parsed",
        text2: `Extracted ${staged.parsed_workout?.exercises?.length || 0} exercises`,
      });

      handleDismiss();
      setText("");

      if (onStaged) {
        onStaged(staged);
      }

      // Navigate to review modal
      router.push({
        pathname: "/stage-review" as any,
        params: {
          stagedId: staged.id,
        },
      });
    } catch (err: any) {
      console.error("[WorkoutScratchpadSheet] Stage error:", err);
      Toast.show({
        type: "error",
        text1: "Staging Failed",
        text2: err?.message || "Could not parse workout text.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonePress = () => {
    if (isLoading) return;
    if (!text.trim()) {
      Toast.show({
        type: "error",
        text1: "Empty Notes",
        text2: "Please write or paste workout notes before tapping Done.",
      });
      return;
    }

    shimmerAnim.setValue(-1);
    Animated.timing(shimmerAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    handleStageWorkout();
  };

  const isDark = colorScheme === "dark";

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      {/* 1. Fullscreen Dark Overlay - extends completely behind keyboard to absolute bottom */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(0,0,0,0.88)"
              : "rgba(0,0,0,0.85)",
            opacity: backdropAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleDismiss}
        />
      </Animated.View>

      {/* 2. KeyboardAvoidingView containing ONLY the modal card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kavContainer}
        pointerEvents="box-none"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.cardWrapper} pointerEvents="box-none">
            {/* Modal Card with 4px border */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <Animated.View
                style={[
                  styles.modalCard,
                  {
                    opacity: cardAnim,
                    backgroundColor: theme.background.val,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.08)",
                  },
                ]}
              >
                {/* Scrollable Text Area - scrolls behind both Header and Footer */}
                <ScrollView
                  bounces={true}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.scrollContent}
                >
                  <TextArea
                    value={text}
                    onChangeText={setText}
                    placeholder={`e.g.\nBench Press 80kg 3x8\nIncline DB 28kg 3x10\nTricep Pushdown 25kg 3x12`}
                    placeholderTextColor="$textMuted"
                    backgroundColor="transparent"
                    borderWidth={0}
                    borderColor="transparent"
                    focusStyle={{
                      borderWidth: 0,
                      borderColor: "transparent",
                    }}
                    color="$text"
                    minHeight={240}
                    textAlignVertical="top"
                    multiline
                    autoFocus
                    editable={!isLoading}
                    style={{
                      fontSize: 16,
                      lineHeight: 24,
                      borderWidth: 0,
                      outlineWidth: 0,
                      padding: 0,
                    }}
                  />
                </ScrollView>

                {/* Pinned Header with Blur Gradient */}
                <View pointerEvents="box-none" style={styles.headerContainer}>
                  {/* Blur Gradient Background */}
                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <MaskedView
                      style={{ flex: 1 }}
                      maskElement={
                        <LinearGradient
                          colors={["black", "transparent"]}
                          locations={[0.65, 1]}
                          style={{ flex: 1 }}
                        />
                      }
                    >
                      <BlurView
                        intensity={60}
                        tint={isDark ? "dark" : "light"}
                        style={{ flex: 1 }}
                      />
                    </MaskedView>
                  </View>
                  <LinearGradient
                    colors={
                      isDark
                        ? ["rgba(35, 31, 32, 0.9)", "rgba(35, 31, 32, 0)"]
                        : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0)"]
                    }
                    locations={[0.5, 1]}
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Header Title & Floating Close Button */}
                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    paddingHorizontal="$4"
                    paddingTop="$3.5"
                    pointerEvents="box-none"
                  >
                    <Text size="large" fontWeight="700" color="$text">
                      New Workout
                    </Text>

                    <TouchableOpacity
                      onPress={onClose}
                      disabled={isLoading}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.floatingCloseBtn}
                    >
                      <BlurView
                        intensity={50}
                        tint={isDark ? "dark" : "light"}
                        style={[
                          styles.closeBlur,
                          {
                            borderColor: isDark
                              ? "rgba(255,255,255,0.22)"
                              : "rgba(0,0,0,0.1)",
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={
                            isDark
                              ? ["rgba(255,255,255,0.18)", "rgba(255,255,255,0.03)"]
                              : ["rgba(255,255,255,0.9)", "rgba(240,240,240,0.4)"]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                        <AppIcon name="X" size={16} color="$text" />
                      </BlurView>
                    </TouchableOpacity>
                  </XStack>
                </View>

                {/* Pinned Footer with Blur Gradient and Centered Volc Orange Done Button */}
                <View pointerEvents="box-none" style={styles.footerContainer}>
                  {/* Blur Gradient Background */}
                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <MaskedView
                      style={{ flex: 1 }}
                      maskElement={
                        <LinearGradient
                          colors={["transparent", "black"]}
                          locations={[0, 0.45]}
                          style={{ flex: 1 }}
                        />
                      }
                    >
                      <BlurView
                        intensity={60}
                        tint={isDark ? "dark" : "light"}
                        style={{ flex: 1 }}
                      />
                    </MaskedView>
                  </View>
                  <LinearGradient
                    colors={
                      isDark
                        ? ["rgba(35, 31, 32, 0)", "rgba(35, 31, 32, 0.9)"]
                        : ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.9)"]
                    }
                    locations={[0, 0.55]}
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Centered Done Button */}
                  <XStack
                    justifyContent="center"
                    alignItems="center"
                    paddingBottom="$3.5"
                    pointerEvents="box-none"
                  >
                    <TouchableOpacity
                      onPress={handleDonePress}
                      disabled={isLoading}
                      activeOpacity={0.85}
                      style={[
                        styles.doneButton,
                        {
                          opacity: isLoading || !text.trim() ? 0.6 : 1,
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={["#f84f3e", "#f97316"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />

                      {/* Shimmer Light Beam */}
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            transform: [
                              {
                                translateX: shimmerAnim.interpolate({
                                  inputRange: [-1, 1],
                                  outputRange: [-160, 160],
                                }),
                              },
                              { rotate: "25deg" },
                              { scale: 1.5 },
                            ],
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={[
                            "rgba(255, 255, 255, 0)",
                            "rgba(255, 255, 255, 0.45)",
                            "rgba(255, 255, 255, 0)",
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ flex: 1 }}
                        />
                      </Animated.View>

                      {isLoading ? (
                        <XStack alignItems="center" gap="$2">
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text size="medium" fontWeight="700" color="#ffffff">
                            Parsing Workout...
                          </Text>
                        </XStack>
                      ) : (
                        <XStack alignItems="center" gap="$2">
                          <AppIcon name="CheckCircle" size={18} color="#ffffff" />
                          <Text size="medium" fontWeight="700" color="#ffffff">
                            Done
                          </Text>
                        </XStack>
                      )}
                    </TouchableOpacity>
                  </XStack>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kavContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardWrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    height: 380,
    maxHeight: "85%",
    borderRadius: 24,
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
    position: "relative",
  },
  scrollContent: {
    paddingTop: 68,
    paddingBottom: 76,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    zIndex: 10,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 10,
  },
  doneButton: {
    minWidth: 150,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#f84f3e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  closeBlur: {
    flex: 1,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
});
