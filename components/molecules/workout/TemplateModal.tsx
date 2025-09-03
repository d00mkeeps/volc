import React, { useState, useMemo, useEffect } from "react";
import { YStack, XStack, Text, Input, ScrollView, Button } from "tamagui";
import { View } from "react-native";
import { X } from '@/assets/icons/IconMap';import { CompleteWorkout } from "@/types/workout";
import { useWorkoutStore } from "@/stores/workout/WorkoutStore";
import TemplateItem from "../../atoms/TemplateItem";
import BaseModal from "../../atoms/BaseModal";

interface TemplateSelectorProps {
  isVisible: boolean;
  selectedTemplateId: string | null;
  onSelectTemplate: (template: CompleteWorkout) => void;
  onClose: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isVisible,
  selectedTemplateId,
  onSelectTemplate,
  onClose,
}) => {
  const { workouts, loading: workoutsLoading, initialized } = useWorkoutStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [availableTemplates, setAvailableTemplates] = useState<
    CompleteWorkout[]
  >([]);
  const [processingTemplates, setProcessingTemplates] = useState(false);

  // When modal opens, prepare templates with proper deduplication
  useEffect(() => {
    if (!isVisible || !initialized || workoutsLoading) return;

    const prepareTemplates = async () => {
      setProcessingTemplates(true);

      console.log("[TemplateSelector] Processing", workouts.length, "workouts");

      // Get workouts with exercises
      const workoutsWithExercises = workouts.filter(
        (workout: CompleteWorkout) =>
          workout.workout_exercises && workout.workout_exercises.length > 0
      );

      console.log(
        "[TemplateSelector] Found",
        workoutsWithExercises.length,
        "workouts with exercises"
      );

      // Group by definition ID sets
      const groups = new Map<string, CompleteWorkout[]>();

      workoutsWithExercises.forEach((workout) => {
        // Get sorted definition IDs for this workout
        const definitionIds = workout.workout_exercises
          .map((ex: any) => ex.definition_id)
          .filter(Boolean)
          .sort(); // Sort for consistent grouping

        const key = definitionIds.join(",");

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(workout);
      });

      console.log(
        "[TemplateSelector] Found",
        groups.size,
        "unique exercise combinations"
      );

      // From each group, keep only the newest workout
      const deduplicatedTemplates: CompleteWorkout[] = [];

      for (const [definitionKey, groupWorkouts] of groups) {
        // Sort by creation date, newest first
        const sortedGroup = groupWorkouts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Keep the newest (first after sorting)
        const newest = sortedGroup[0];
        deduplicatedTemplates.push(newest);

        if (sortedGroup.length > 1) {
          console.log(
            `[TemplateSelector] Deduplicated ${sortedGroup.length} workouts, keeping: "${newest.name}"`
          );
        }
      }

      // Sort final templates by creation date (newest first)
      const finalTemplates = deduplicatedTemplates.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Create empty workout template - always at the top
      const emptyWorkout: CompleteWorkout = {
        id: "empty-workout-template",
        user_id: "", // Will be set when selected
        name: "Start Fresh",
        notes: "Create a new workout from scratch",
        is_template: true,
        workout_exercises: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Put empty workout at the front
      const templatesWithEmpty = [emptyWorkout, ...finalTemplates];

      console.log(
        "[TemplateSelector] Final template count (with empty):",
        templatesWithEmpty.length
      );
      setAvailableTemplates(templatesWithEmpty);
      setProcessingTemplates(false);
    };

    prepareTemplates();
  }, [isVisible, workouts, initialized, workoutsLoading]);

  const filteredTemplates = useMemo(() => {
    let templates = availableTemplates;

    // If searching, filter but always keep empty workout if it matches
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = availableTemplates.filter((template) => {
        // Always include empty workout, or check if name matches search
        return (
          template.id === "empty-workout-template" ||
          template.name.toLowerCase().includes(searchLower)
        );
      });
      templates = filtered;
    }

    return templates.slice(0, 6); // Increase to 6 to account for empty workout
  }, [availableTemplates, searchQuery]);

  // Show loading if workouts are still loading OR we're processing templates
  const isLoading = workoutsLoading || !initialized || processingTemplates;

  return (
    <BaseModal isVisible={isVisible} onClose={onClose}>
      {/* Header */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal="$4"
        paddingVertical="$4"
        borderBottomWidth={1}
        borderBottomColor="$borderSoft"
      >
        <Text fontSize="$4" fontWeight="600" color="$color">
          Select Template
        </Text>
        <Button
          size="$3"
          circular
          backgroundColor="transparent"
          onPress={onClose}
          pressStyle={{ backgroundColor: "$backgroundPress" }}
        >
          <X size={20} color="$textSoft" />
        </Button>
      </XStack>

      {/* Search */}
      <View style={{ padding: 16, paddingBottom: 12 }}>
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          backgroundColor="$backgroundSoft"
          borderColor="$borderSoft"
          size="$4"
          disabled={isLoading}
        />
      </View>

      {/* Templates List */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
        {isLoading ? (
          <YStack flex={1} justifyContent="center" alignItems="center" gap="$3">
            <Text fontSize="$4" color="$textSoft" fontWeight="500">
              Loading templates...
            </Text>
            <Text fontSize="$4" color="$textMuted" textAlign="center">
              Finding your workout patterns and removing duplicates
            </Text>
          </YStack>
        ) : filteredTemplates.length === 0 ? (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            gap="$3"
            backgroundColor="$backgroundSoft"
            borderRadius="$4"
          >
            <Text
              fontSize="$4"
              color="$textSoft"
              textAlign="center"
              fontWeight="500"
            >
              {searchQuery ? "No matching templates" : "No templates available"}
            </Text>
            <Text
              fontSize="$4"
              color="$textMuted"
              textAlign="center"
              lineHeight="$1"
            >
              {searchQuery
                ? "Try adjusting your search terms"
                : "Complete your first workout to create templates"}
            </Text>
          </YStack>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <YStack gap="$2">
              {filteredTemplates.map((template) => {
                // Special styling for empty workout
                if (template.id === "empty-workout-template") {
                  return (
                    <Button
                      key={template.id}
                      marginBottom="$2"
                      size="$4"
                      backgroundColor="#f5a623"
                      borderRadius="$3"
                      onPress={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      pressStyle={{ backgroundColor: "#e6951f" }}
                      borderWidth={selectedTemplateId === template.id ? 2 : 0}
                      borderColor={
                        selectedTemplateId === template.id
                          ? "#d4851b"
                          : "transparent"
                      }
                    >
                      <YStack alignItems="center" padding="$3" width="100%">
                        <XStack alignItems="center" gap="$2">
                          <Text fontSize="$4">🎯</Text>
                          <Text fontSize="$4" fontWeight="600" color="#111">
                            Fresh Start
                          </Text>
                        </XStack>
                        <Text
                          fontSize="$4"
                          color="#111"
                          opacity={0.9}
                          textAlign="center"
                        >
                          Create a new workout now!
                        </Text>
                      </YStack>
                    </Button>
                  );
                }

                // Regular template
                return (
                  <TemplateItem
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplateId === template.id}
                    onSelect={(t) => {
                      onSelectTemplate(t);
                      onClose();
                    }}
                  />
                );
              })}
            </YStack>
          </ScrollView>
        )}
      </View>
    </BaseModal>
  );
};

export default TemplateSelector;
