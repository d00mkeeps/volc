// components/molecules/TemplateSelector.tsx
import React, { useState, useMemo } from "react";
import { YStack, XStack, Text, Input, ScrollView, Button } from "tamagui";
import { Modal, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CompleteWorkout } from "@/types/workout";
import TemplateItem from "../atoms/TemplateItem";

interface TemplateSelectorProps {
  isVisible: boolean;
  templates: CompleteWorkout[];
  selectedTemplateId: string | null;
  onSelectTemplate: (template: CompleteWorkout) => void;
  onClose: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isVisible,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) {
      return templates.slice(0, 5);
    }

    const filtered = templates.filter((template) => {
      const searchLower = searchQuery.toLowerCase();
      return template.name.toLowerCase().includes(searchLower);
    });

    return filtered.slice(0, 5);
  }, [templates, searchQuery]);

  return (
    <Modal
      visible={isVisible}
      animationType="fade" // Changed to fade
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Centered Modal Card */}
        <TouchableOpacity
          style={{
            width: "90%",
            height: "55%",
            backgroundColor: "#231f20", // Your background color
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
          activeOpacity={1} // Prevent closing when tapping inside modal
          onPress={() => {}} // Prevent event bubbling
        >
          {/* Header */}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal="$4"
            paddingVertical="$4"
            borderBottomWidth={1}
            borderBottomColor="$borderSoft"
          >
            <Text fontSize="$6" fontWeight="600" color="$color">
              Select Template
            </Text>
            <Button
              size="$3"
              circular
              backgroundColor="transparent"
              onPress={onClose}
              pressStyle={{
                backgroundColor: "$backgroundPress",
              }}
            >
              <Ionicons name="close" size={20} color="$textSoft" />
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
            />
          </View>

          {/* Templates List */}
          <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
            {filteredTemplates.length === 0 ? (
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
                  {searchQuery
                    ? "No matching templates"
                    : "No templates available"}
                </Text>
                <Text
                  fontSize="$3"
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
                  {filteredTemplates.map((template) => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplateId === template.id}
                      onSelect={(t) => {
                        onSelectTemplate(t);
                        onClose();
                      }}
                    />
                  ))}
                </YStack>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default TemplateSelector;
