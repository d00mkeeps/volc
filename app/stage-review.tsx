// app/stage-review.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { YStack, XStack, Stack, useTheme } from "tamagui";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { v4 as uuidv4 } from "uuid";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import Text from "@/components/atoms/core/Text";
import Button from "@/components/atoms/core/Button";
import { AppIcon } from "@/assets/icons/IconMap";
import { stagingService } from "@/services/api/stagingService";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import { useUserStore } from "@/stores/userProfileStore";
import { toMetricWeight, roundWeight } from "@/utils/conversions";
import { CompleteWorkout } from "@/types/workout";
import { ParsedExerciseData, ParsedSetData, StagedWorkout } from "@/types/staging";

export default function StageReviewScreen() {
  const router = useRouter();
  const { stagedId } = useLocalSearchParams<{ stagedId?: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { userProfile } = useUserStore();
  const isImperial = userProfile?.is_imperial ?? false;
  const unitLabel = isImperial ? "lbs" : "kg";

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stagedRecord, setStagedRecord] = useState<StagedWorkout | null>(null);

  // Editable workout fields
  const [workoutName, setWorkoutName] = useState("Workout");
  const [workoutDate, setWorkoutDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [exercises, setExercises] = useState<ParsedExerciseData[]>([]);
  const [showOriginalNotes, setShowOriginalNotes] = useState(false);

  useEffect(() => {
    async function loadStaged() {
      if (!stagedId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const record = await stagingService.getStagedWorkout(stagedId);
        setStagedRecord(record);

        if (record?.parsed_workout) {
          const pw = record.parsed_workout;
          setWorkoutName(pw.name || "Workout");
          setWorkoutNotes(pw.notes || "");

          if (pw.workout_timestamp) {
            try {
              setWorkoutDate(new Date(pw.workout_timestamp));
            } catch (e) {
              setWorkoutDate(new Date());
            }
          }

          setExercises(pw.exercises || []);
        }
      } catch (err: any) {
        console.error("[StageReview] Failed to load staged record:", err);
        Toast.show({
          type: "error",
          text1: "Error Loading Staged Workout",
          text2: err?.message || "Could not retrieve parsed workout data.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadStaged();
  }, [stagedId]);

  // Exercise manipulation handlers
  const handleUpdateExerciseName = (index: number, newName: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], exercise_name: newName };
      return updated;
    });
  };

  const handleRemoveExercise = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercises((prev) => [
      ...prev,
      {
        exercise_name: "New Exercise",
        definition_id: null,
        matched_canonical_name: null,
        order_index: prev.length,
        notes: null,
        sets: [
          {
            set_number: 1,
            weight: null,
            reps: 10,
            rpe: null,
            duration: null,
            distance: null,
          },
        ],
      },
    ]);
  };

  // Set manipulation handlers
  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    field: keyof ParsedSetData,
    value: any
  ) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      const updatedSets = [...targetEx.sets];
      updatedSets[setIdx] = {
        ...updatedSets[setIdx],
        [field]: value === "" ? null : isNaN(Number(value)) ? value : Number(value),
      };
      targetEx.sets = updatedSets;
      updated[exIdx] = targetEx;
      return updated;
    });
  };

  const handleAddSet = (exIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercises((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      const lastSet = targetEx.sets[targetEx.sets.length - 1];

      const newSet: ParsedSetData = {
        set_number: targetEx.sets.length + 1,
        weight: lastSet ? lastSet.weight : null,
        reps: lastSet ? lastSet.reps : 10,
        rpe: lastSet ? lastSet.rpe : null,
        duration: null,
        distance: null,
      };

      targetEx.sets = [...targetEx.sets, newSet];
      updated[exIdx] = targetEx;
      return updated;
    });
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercises((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      if (targetEx.sets.length <= 1) {
        return prev;
      }
      const filtered = targetEx.sets
        .filter((_, idx) => idx !== setIdx)
        .map((s, idx) => ({ ...s, set_number: idx + 1 }));
      targetEx.sets = filtered;
      updated[exIdx] = targetEx;
      return updated;
    });
  };

  // Save handler: commits to production workouts
  const handleConfirmSave = async () => {
    if (exercises.length === 0) {
      Alert.alert("Empty Workout", "Please add at least one exercise before saving.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsSaving(true);
      const workoutId = uuidv4();
      const userId =
        userProfile?.auth_user_uuid || userProfile?.user_id?.toString() || "";
      const createdIso = workoutDate.toISOString();
      const nowIso = new Date().toISOString();

      const completeWorkout: CompleteWorkout = {
        id: workoutId,
        user_id: userId,
        name: workoutName.trim() || "Workout",
        notes: workoutNotes.trim(),
        created_at: createdIso,
        updated_at: nowIso,
        is_template: false,
        workout_exercises: exercises.map((ex, exIdx) => {
          const exerciseId = uuidv4();
          return {
            id: exerciseId,
            definition_id: ex.definition_id || undefined,
            workout_id: workoutId,
            name: ex.exercise_name,
            order_index: exIdx,
            notes: ex.notes || undefined,
            created_at: createdIso,
            updated_at: nowIso,
            workout_exercise_sets: ex.sets.map((s, setIdx) => {
              let metricWeight: number | null = null;
              if (s.weight != null && !isNaN(Number(s.weight))) {
                metricWeight = roundWeight(
                  toMetricWeight(Number(s.weight), isImperial)
                );
              }

              return {
                id: uuidv4(),
                exercise_id: exerciseId,
                set_number: setIdx + 1,
                weight: metricWeight,
                reps: s.reps != null ? Number(s.reps) : null,
                rpe: s.rpe != null ? Number(s.rpe) : null,
                duration: s.duration != null ? String(s.duration) : null,
                distance: s.distance != null ? Number(s.distance) : null,
                is_completed: true,
                created_at: createdIso,
                updated_at: nowIso,
              };
            }),
          };
        }),
      };

      // 1. Commit to production workout store
      await useWorkoutStore.getState().createWorkout(completeWorkout);

      // 2. Mark staging record confirmed if stagedId exists
      if (stagedId) {
        stagingService
          .updateStagedWorkout(stagedId, {
            status: "confirmed",
            parsed_workout: {
              name: workoutName,
              workout_timestamp: createdIso,
              notes: workoutNotes,
              exercises,
            },
          })
          .catch((e) => console.warn("[StageReview] Staging status update warning:", e));
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Workout Saved! 🎉",
        text2: `${completeWorkout.name} logged successfully.`,
      });

      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("[StageReview] Failed to confirm workout:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: err?.message || "Could not save workout to production.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Discard handler
  const handleDiscard = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Discard Workout",
      "Are you sure you want to discard this staged workout?",
      [
        { text: "Keep Reviewing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            if (stagedId) {
              stagingService
                .updateStagedWorkout(stagedId, { status: "discarded" })
                .catch(() => {});
            }
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background.val,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#f84f3e" />
        <Text size="medium" color="$textMuted" marginTop="$3">
          Loading staged workout...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Glassmorphic Navigation Bar */}
      <View style={[styles.navBar, { paddingTop: Math.max(12, insets.top) }]}>
        <BlurView
          intensity={50}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal="$4"
          paddingBottom="$3"
          paddingTop="$2"
        >
          {/* Back / Discard Button */}
          <TouchableOpacity
            onPress={handleDiscard}
            activeOpacity={0.7}
            style={styles.circleButton}
          >
            <AppIcon name="X" size={18} color="$textMuted" />
          </TouchableOpacity>

          {/* Title with Subtitle Badge */}
          <YStack alignItems="center">
            <Text size="medium" fontWeight="700" color="$text">
              Review Workout
            </Text>
            <Text size="xs" color="$accentColor" fontWeight="600">
              {exercises.length} {exercises.length === 1 ? "Exercise" : "Exercises"} Extracted
            </Text>
          </YStack>

          {/* Discard text action */}
          <TouchableOpacity onPress={handleDiscard} activeOpacity={0.7}>
            <Text size="small" color="$red10" fontWeight="600">
              Discard
            </Text>
          </TouchableOpacity>
        </XStack>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Info Card */}
        <YStack
          backgroundColor="$backgroundSoft"
          borderRadius="$4"
          padding="$4"
          borderWidth={1}
          borderColor={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
          marginBottom="$3.5"
          gap="$3"
          position="relative"
          overflow="hidden"
        >
          {/* Volc Orange accent marker */}
          <View style={styles.accentLine} />

          <YStack gap="$1.5">
            <XStack justifyContent="space-between" alignItems="center">
              <Text size="xs" color="$textMuted" fontWeight="700" letterSpacing={0.5}>
                WORKOUT TITLE
              </Text>
              <AppIcon name="Edit" size={14} color="$textMuted" />
            </XStack>
            <TextInput
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="e.g. Chest & Triceps"
              placeholderTextColor="#777777"
              style={[
                styles.titleInput,
                { color: theme.color.val },
              ]}
            />
          </YStack>

          {/* Date, Time & Units Row */}
          <XStack justifyContent="space-between" alignItems="center" paddingTop="$1">
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateTimePill}
              activeOpacity={0.7}
            >
              <AppIcon name="Clock" size={14} color="$accentColor" />
              <Text size="small" color="$text" fontWeight="600" marginLeft="$1.5">
                {workoutDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <AppIcon name="ChevronDown" size={12} color="$textMuted" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <View style={styles.unitPill}>
              <Text size="xs" color="$accentColor" fontWeight="700">
                {unitLabel.toUpperCase()}
              </Text>
            </View>
          </XStack>

          {showDatePicker && (
            <DateTimePicker
              value={workoutDate}
              mode="datetime"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) setWorkoutDate(selectedDate);
              }}
            />
          )}

          {/* Original Shared Notes Accordion */}
          {stagedRecord?.raw_text && (
            <YStack marginTop="$1">
              <TouchableOpacity
                onPress={() => setShowOriginalNotes(!showOriginalNotes)}
                style={styles.notesToggle}
                activeOpacity={0.7}
              >
                <XStack alignItems="center" gap="$1.5">
                  <AppIcon name="FileText" size={13} color="$textMuted" />
                  <Text size="xs" color="$textMuted" fontWeight="600">
                    {showOriginalNotes ? "Hide Original Notes" : "View Original Notes"}
                  </Text>
                </XStack>
                <AppIcon
                  name={showOriginalNotes ? "ChevronUp" : "ChevronDown"}
                  size={14}
                  color="$textMuted"
                />
              </TouchableOpacity>

              {showOriginalNotes && (
                <YStack
                  backgroundColor={isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)"}
                  padding="$3"
                  borderRadius="$3"
                  marginTop="$2"
                  borderLeftWidth={2}
                  borderLeftColor="$accentColor"
                >
                  <Text size="xs" color="$textMuted" fontStyle="italic" lineHeight={18}>
                    {stagedRecord.raw_text}
                  </Text>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>

        {/* Exercises Section Header */}
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$2.5" marginTop="$1">
          <Text size="medium" fontWeight="700" color="$text">
            Exercises
          </Text>
          <TouchableOpacity
            onPress={handleAddExercise}
            style={styles.addExerciseHeaderBtn}
            activeOpacity={0.7}
          >
            <AppIcon name="Plus" size={14} color="#f84f3e" />
            <Text size="xs" fontWeight="700" color="#f84f3e">
              Add Exercise
            </Text>
          </TouchableOpacity>
        </XStack>

        {/* Exercise Cards */}
        {exercises.map((exercise, exIdx) => {
          const isMatched = Boolean(exercise.definition_id);

          return (
            <YStack
              key={exIdx}
              backgroundColor="$backgroundSoft"
              borderRadius="$4"
              padding="$3.5"
              borderWidth={1}
              borderColor={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
              marginBottom="$3"
              gap="$2.5"
            >
              {/* Exercise Header */}
              <XStack justifyContent="space-between" alignItems="flex-start">
                <YStack flex={1} marginRight="$2">
                  <TextInput
                    value={exercise.exercise_name}
                    onChangeText={(text) => handleUpdateExerciseName(exIdx, text)}
                    placeholder="Exercise Name"
                    placeholderTextColor="#777777"
                    style={[
                      styles.exerciseTitleInput,
                      { color: theme.color.val },
                    ]}
                  />

                  {/* Canonical Match Pill */}
                  <XStack alignItems="center" gap="$1" marginTop="$1.5">
                    <View
                      style={[
                        styles.badgePill,
                        {
                          backgroundColor: isMatched
                            ? "rgba(52, 199, 89, 0.15)"
                            : "rgba(255, 149, 0, 0.15)",
                        },
                      ]}
                    >
                      <AppIcon
                        name={isMatched ? "Check" : "AlertCircle"}
                        size={11}
                        color={isMatched ? "#34C759" : "#FF9500"}
                      />
                      <Text
                        size="xs"
                        fontWeight="600"
                        color={isMatched ? "#34C759" : "#FF9500"}
                        numberOfLines={1}
                      >
                        {isMatched
                          ? `Matched: ${exercise.matched_canonical_name || exercise.exercise_name}`
                          : "Custom Exercise"}
                      </Text>
                    </View>
                  </XStack>
                </YStack>

                <TouchableOpacity
                  onPress={() => handleRemoveExercise(exIdx)}
                  style={styles.deleteIconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppIcon name="Trash2" size={16} color="$textMuted" />
                </TouchableOpacity>
              </XStack>

              {/* Table Column Headers */}
              <XStack
                paddingHorizontal="$2"
                paddingVertical="$1"
                marginTop="$1"
                borderBottomWidth={1}
                borderBottomColor={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              >
                <Text size="xs" color="$textMuted" fontWeight="700" width={36} textAlign="center">
                  SET
                </Text>
                <Text
                  size="xs"
                  color="$textMuted"
                  fontWeight="700"
                  flex={1}
                  textAlign="center"
                >
                  WEIGHT ({unitLabel.toUpperCase()})
                </Text>
                <Text
                  size="xs"
                  color="$textMuted"
                  fontWeight="700"
                  flex={1}
                  textAlign="center"
                >
                  REPS
                </Text>
                <Text
                  size="xs"
                  color="$textMuted"
                  fontWeight="700"
                  width={46}
                  textAlign="center"
                >
                  RPE
                </Text>
                <Stack width={26} />
              </XStack>

              {/* Set Rows */}
              {exercise.sets.map((set, setIdx) => (
                <XStack
                  key={setIdx}
                  alignItems="center"
                  paddingVertical="$1.5"
                  gap="$2"
                >
                  {/* Set Number Pill */}
                  <View style={styles.setNumberBadge}>
                    <Text size="small" fontWeight="700" color="$textMuted">
                      {setIdx + 1}
                    </Text>
                  </View>

                  {/* Weight Input Capsule */}
                  <TextInput
                    value={set.weight != null ? String(set.weight) : ""}
                    onChangeText={(val) => handleUpdateSet(exIdx, setIdx, "weight", val)}
                    placeholder="—"
                    placeholderTextColor="#555"
                    keyboardType="numeric"
                    style={[
                      styles.inputCapsule,
                      {
                        flex: 1,
                        color: theme.color.val,
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.04)",
                      },
                    ]}
                  />

                  {/* Reps Input Capsule */}
                  <TextInput
                    value={set.reps != null ? String(set.reps) : ""}
                    onChangeText={(val) => handleUpdateSet(exIdx, setIdx, "reps", val)}
                    placeholder="—"
                    placeholderTextColor="#555"
                    keyboardType="numeric"
                    style={[
                      styles.inputCapsule,
                      {
                        flex: 1,
                        color: theme.color.val,
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.04)",
                      },
                    ]}
                  />

                  {/* RPE Input Capsule */}
                  <TextInput
                    value={set.rpe != null ? String(set.rpe) : ""}
                    onChangeText={(val) => handleUpdateSet(exIdx, setIdx, "rpe", val)}
                    placeholder="—"
                    placeholderTextColor="#555"
                    keyboardType="numeric"
                    style={[
                      styles.inputCapsule,
                      {
                        width: 46,
                        color: theme.color.val,
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.04)",
                      },
                    ]}
                  />

                  {/* Delete Set */}
                  <TouchableOpacity
                    onPress={() => handleRemoveSet(exIdx, setIdx)}
                    style={{ width: 26, alignItems: "center" }}
                    disabled={exercise.sets.length <= 1}
                  >
                    <AppIcon
                      name="X"
                      size={15}
                      color={exercise.sets.length <= 1 ? "transparent" : "$textMuted"}
                    />
                  </TouchableOpacity>
                </XStack>
              ))}

              {/* Add Set Button */}
              <TouchableOpacity
                onPress={() => handleAddSet(exIdx)}
                style={styles.addSetRowBtn}
                activeOpacity={0.7}
              >
                <AppIcon name="Plus" size={13} color="#f84f3e" />
                <Text size="xs" fontWeight="700" color="#f84f3e">
                  Add Set
                </Text>
              </TouchableOpacity>
            </YStack>
          );
        })}

        {/* Append Exercise Button */}
        <TouchableOpacity
          onPress={handleAddExercise}
          style={styles.addExerciseCardBtn}
          activeOpacity={0.7}
        >
          <XStack alignItems="center" gap="$2">
            <AppIcon name="PlusCircle" size={18} color="#f84f3e" />
            <Text size="small" fontWeight="700" color="#f84f3e">
              Add Another Exercise
            </Text>
          </XStack>
        </TouchableOpacity>

        {/* Workout Notes */}
        <YStack
          backgroundColor="$backgroundSoft"
          borderRadius="$4"
          padding="$4"
          borderWidth={1}
          borderColor={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
          marginTop="$3"
          gap="$2"
        >
          <Text size="xs" color="$textMuted" fontWeight="700" letterSpacing={0.5}>
            SESSION NOTES
          </Text>
          <TextInput
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
            placeholder="Add general workout notes..."
            placeholderTextColor="#777777"
            multiline
            numberOfLines={3}
            style={{
              fontSize: 14,
              color: theme.color.val,
              paddingVertical: 4,
              minHeight: 56,
              textAlignVertical: "top",
            }}
          />
        </YStack>
      </ScrollView>

      {/* Floating Bottom Bar: Glassmorphic Volc Gradient Confirm Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <BlurView
          intensity={60}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            isDark
              ? ["rgba(35, 31, 32, 0.4)", "rgba(35, 31, 32, 0.95)"]
              : ["rgba(255, 255, 255, 0.4)", "rgba(255, 255, 255, 0.95)"]
          }
          style={StyleSheet.absoluteFill}
        />

        <TouchableOpacity
          onPress={handleConfirmSave}
          disabled={isSaving}
          activeOpacity={0.85}
          style={[
            styles.confirmBtn,
            { opacity: isSaving || exercises.length === 0 ? 0.6 : 1 },
          ]}
        >
          <LinearGradient
            colors={["#f84f3e", "#f97316"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {isSaving ? (
            <XStack alignItems="center" gap="$2">
              <ActivityIndicator size="small" color="#ffffff" />
              <Text size="medium" fontWeight="700" color="#ffffff">
                Saving to Volc...
              </Text>
            </XStack>
          ) : (
            <XStack alignItems="center" gap="$2">
              <AppIcon name="Check" size={18} color="#ffffff" />
              <Text size="medium" fontWeight="700" color="#ffffff">
                Confirm & Log Workout
              </Text>
            </XStack>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#231f20",
  },
  navBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  circleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  accentLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#f84f3e",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: "700",
    paddingVertical: 2,
  },
  dateTimePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  unitPill: {
    backgroundColor: "rgba(248, 79, 62, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(248, 79, 62, 0.3)",
  },
  notesToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  addExerciseHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exerciseTitleInput: {
    fontSize: 17,
    fontWeight: "700",
    paddingVertical: 2,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deleteIconBtn: {
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
  },
  setNumberBadge: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  inputCapsule: {
    height: 38,
    textAlign: "center",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: "600",
  },
  addSetRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  addExerciseCardBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(248, 79, 62, 0.4)",
    backgroundColor: "rgba(248, 79, 62, 0.05)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    zIndex: 20,
  },
  confirmBtn: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#f84f3e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
