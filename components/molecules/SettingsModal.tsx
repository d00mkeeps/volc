import React, { useState, useEffect } from "react";
import { YStack, XStack, ScrollView } from "tamagui";
import { Alert } from "react-native";
import BaseModal from "@/components/atoms/core/BaseModal";
import Button from "@/components/atoms/core/Button";
import Input from "@/components/atoms/core/Input";
import Text from "@/components/atoms/core/Text";
import { userService } from "@/services/api/userService";
import { useUserStore } from "@/stores/userProfileStore";
import { calculate1RM } from "@/utils/1rmCalc"; // Add this import

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmations, setConfirmations] = useState({
    understand_permanent: false,
    understand_data_loss: false,
    no_refund: false,
  });
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const { userProfile, updateProfile } = useUserStore();

  // Track local unit preference
  const [isImperial, setIsImperial] = useState<boolean>(false);
  const [hasUnitChanged, setHasUnitChanged] = useState(false);

  // 1RM Calculator state
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [oneRM, setOneRM] = useState<number | null>(null);

  // Initialize unit preference when modal opens
  useEffect(() => {
    if (visible && userProfile) {
      setIsImperial(userProfile.is_imperial);
      setHasUnitChanged(false);
    }
  }, [visible, userProfile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const weightNum = parseFloat(weight);
      const repsNum = parseInt(reps, 10);

      if (weight && reps && !isNaN(weightNum) && !isNaN(repsNum)) {
        const result = calculate1RM(weightNum, repsNum);
        setOneRM(result);
      } else {
        setOneRM(null);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [weight, reps]);

  const resetDeleteState = () => {
    console.log("🔴 resetDeleteState called");
    setConfirmations({
      understand_permanent: false,
      understand_data_loss: false,
      no_refund: false,
    });
    setTypedConfirmation("");
    setLoading(false);
    setShowDeleteConfirm(false);
  };

  const isReadyToDelete = () => {
    return (
      Object.values(confirmations).every((v) => v) &&
      typedConfirmation === "DELETE MY ACCOUNT"
    );
  };

  const handleDeleteAccount = async () => {
    console.log("🔴 handleDeleteAccount called");
    if (!isReadyToDelete()) return;

    setLoading(true);
    try {
      await userService.deleteAccount({
        confirmed: true,
        typed_confirmation: typedConfirmation,
      });

      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted.",
        [{ text: "OK", onPress: onClose }]
      );
    } catch (error) {
      console.error("🔴 Delete account error:", error);
      Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnitToggle = (imperial: boolean) => {
    setIsImperial(imperial);
    setHasUnitChanged(userProfile?.is_imperial !== imperial);
  };

  const handleCalculate1RM = () => {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps, 10);

    const result = calculate1RM(weightNum, repsNum);
    setOneRM(result);
  };

  const handleClose = async () => {
    // Save unit preference if changed
    if (hasUnitChanged) {
      setLoading(true);
      try {
        await updateProfile({ is_imperial: isImperial });
      } catch (error) {
        console.error("Failed to update units:", error);
        Alert.alert(
          "Error",
          "Failed to save unit preference. Please try again."
        );
        setLoading(false);
        return; // Don't close modal if save failed
      }
      setLoading(false);
    }

    // Reset 1RM calculator
    setWeight("");
    setReps("");
    setOneRM(null);

    resetDeleteState();
    onClose();
  };

  const ConfirmationCheckbox = ({
    checked,
    onToggle,
    text,
  }: {
    checked: boolean;
    onToggle: () => void;
    text: string;
  }) => (
    <Button
      backgroundColor="transparent"
      justifyContent="flex-start"
      alignSelf="stretch"
      maxWidth="100%"
      padding="$0"
      marginBottom="$3"
      onPress={onToggle}
    >
      <XStack alignItems="center" gap="$2">
        <YStack
          width={20}
          height={20}
          borderWidth={2}
          borderColor={checked ? "$red9" : "$borderSoft"}
          backgroundColor={checked ? "$red9" : "transparent"}
          borderRadius="$1"
          justifyContent="center"
          alignItems="center"
        >
          {checked && (
            <Text size="small" color="$white" fontWeight="600">
              ✓
            </Text>
          )}
        </YStack>
        <Text size="medium" flex={1}>
          {text}
        </Text>
      </XStack>
    </Button>
  );

  return (
    <BaseModal
      isVisible={visible}
      onClose={handleClose}
      widthPercent={90}
      heightPercent={70}
    >
      <YStack flex={1} padding="$4">
        {!showDeleteConfirm ? (
          <>
            {/* Settings Content */}
            <XStack
              justifyContent="space-between"
              alignItems="center"
              marginBottom="$6"
            >
              <Text size="xl" fontWeight="600">
                Settings
              </Text>
              <Button
                size="medium"
                backgroundColor="transparent"
                color="$primary"
                onPress={handleClose}
                disabled={loading}
              >
                {loading ? "Saving..." : "Done"}
              </Button>
            </XStack>

            {/* Unit Preference Section */}
            <ScrollView flex={1}>
              <YStack gap="$4">
                <YStack gap="$3">
                  <Text size="large" fontWeight="600">
                    Unit Preference
                  </Text>
                  <XStack gap="$2">
                    <Button
                      flex={1}
                      backgroundColor={
                        !isImperial ? "$primary" : "$backgroundSoft"
                      }
                      color={!isImperial ? "$white" : "$text"}
                      onPress={() => handleUnitToggle(false)}
                    >
                      Metric (kg)
                    </Button>
                    <Button
                      flex={1}
                      backgroundColor={
                        isImperial ? "$primary" : "$backgroundSoft"
                      }
                      color={isImperial ? "$white" : "$text"}
                      onPress={() => handleUnitToggle(true)}
                    >
                      Imperial (lbs)
                    </Button>
                  </XStack>
                  {hasUnitChanged && (
                    <Text size="small" color="$textSoft" fontStyle="italic">
                      Changes will be saved when you close settings
                    </Text>
                  )}
                </YStack>

                {/* 1RM Calculator Section */}
                <YStack
                  gap="$3"
                  marginTop="$4"
                  paddingTop="$4"
                  borderTopWidth={1}
                  borderTopColor="$borderSoft"
                >
                  <Text size="large" fontWeight="600">
                    1RM Calculator
                  </Text>
                  <XStack gap="$2">
                    <YStack flex={1} gap="$2">
                      <Text size="small" color="$textSoft">
                        Weight ({isImperial ? "lbs" : "kg"})
                      </Text>
                      <Input
                        value={weight}
                        onChangeText={setWeight}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        alignSelf="stretch"
                      />
                    </YStack>
                    <YStack flex={1} gap="$2">
                      <Text size="small" color="$textSoft">
                        Reps
                      </Text>
                      <Input
                        value={reps}
                        onChangeText={setReps}
                        placeholder="0"
                        keyboardType="number-pad"
                        alignSelf="stretch"
                      />
                    </YStack>
                  </XStack>
                  {oneRM !== null && (
                    <YStack
                      backgroundColor="$backgroundSoft"
                      padding="$3"
                      borderRadius="$3"
                      alignItems="center"
                    >
                      <Text size="small" color="$textSoft" marginBottom="$1">
                        Estimated 1RM
                      </Text>
                      <Text size="xl" fontWeight="700" color="$primary">
                        {oneRM} {isImperial ? "lbs" : "kg"}
                      </Text>
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </ScrollView>
            {/* Danger Zone */}
            <YStack
              marginTop="$4"
              paddingTop="$4"
              borderTopWidth={1}
              borderTopColor="$borderSoft"
            >
              <Text
                size="large"
                fontWeight="600"
                color="$red9"
                marginBottom="$3"
              >
                Danger Zone
              </Text>
              <Button
                backgroundColor="$red9"
                color="$white"
                alignSelf="stretch"
                onPress={() => {
                  console.log("🔴 Delete Account button pressed!");
                  setShowDeleteConfirm(true);
                }}
              >
                Delete Account
              </Button>
            </YStack>
          </>
        ) : (
          <>
            {/* Delete Account Confirmation Content */}
            <ScrollView flex={1}>
              <YStack gap="$4">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text size="xl" fontWeight="600" color="$red9">
                    Delete Account
                  </Text>
                  <Button
                    size="medium"
                    backgroundColor="transparent"
                    color="$primary"
                    onPress={() => {
                      console.log("🔴 Back button pressed");
                      setShowDeleteConfirm(false);
                    }}
                  >
                    Back
                  </Button>
                </XStack>

                <Text size="medium" lineHeight={24}>
                  This action will permanently delete your account and all
                  associated data. This cannot be undone.
                </Text>

                <Text size="large" fontWeight="600">
                  Please confirm you understand:
                </Text>

                <YStack gap="$2">
                  <ConfirmationCheckbox
                    checked={confirmations.understand_permanent}
                    onToggle={() => {
                      console.log("🔴 Toggling understand_permanent");
                      setConfirmations((prev) => ({
                        ...prev,
                        understand_permanent: !prev.understand_permanent,
                      }));
                    }}
                    text="I understand this action is permanent and cannot be undone"
                  />
                  <ConfirmationCheckbox
                    checked={confirmations.understand_data_loss}
                    onToggle={() => {
                      console.log("🔴 Toggling understand_data_loss");
                      setConfirmations((prev) => ({
                        ...prev,
                        understand_data_loss: !prev.understand_data_loss,
                      }));
                    }}
                    text="I understand I will lose all my workouts, conversations, and data"
                  />
                  <ConfirmationCheckbox
                    checked={confirmations.no_refund}
                    onToggle={() => {
                      console.log("🔴 Toggling no_refund");
                      setConfirmations((prev) => ({
                        ...prev,
                        no_refund: !prev.no_refund,
                      }));
                    }}
                    text="I understand this does not entitle me to any refunds"
                  />
                </YStack>

                <YStack gap="$2">
                  <Text size="medium">
                    Type{" "}
                    <Text fontWeight="600" color="$red9">
                      DELETE MY ACCOUNT
                    </Text>{" "}
                    to confirm:
                  </Text>
                  <Input
                    value={typedConfirmation}
                    onChangeText={(text) => {
                      console.log("🔴 Input changed to:", text);
                      setTypedConfirmation(text);
                    }}
                    placeholder="DELETE MY ACCOUNT"
                    autoCapitalize="characters"
                    alignSelf="stretch"
                    maxWidth="100%"
                  />
                </YStack>

                <Button
                  backgroundColor={
                    isReadyToDelete() ? "$red9" : "$backgroundMuted"
                  }
                  color="$white"
                  disabled={!isReadyToDelete() || loading}
                  opacity={loading ? 0.7 : 1}
                  alignSelf="stretch"
                  maxWidth="100%"
                  onPress={() => {
                    console.log("🔴 Final DELETE MY ACCOUNT button pressed");
                    handleDeleteAccount();
                  }}
                >
                  {loading ? "Deleting Account..." : "DELETE MY ACCOUNT"}
                </Button>
              </YStack>
            </ScrollView>
          </>
        )}
      </YStack>
    </BaseModal>
  );
};
