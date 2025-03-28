import { uuidv4 } from "@/utils/uuid";
import { MessageProvider } from "@/context/MessageContext";
import { DataProvider } from "@/context/DataContext";
import { WelcomeModalProps, ActualWizardProps } from "@/types/welcomeModal";
import { useRef, useState } from "react";
import {
  Modal,
  SafeAreaView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import Wizard, { WizardRef } from "react-native-wizard";
import { WelcomeStep } from "./WelcomeStep";
import { FinishStep } from "./FinishStep";
import { OnboardingConversationStep } from "./OnboardingStep";
import React from "react";
import { Button } from "../public/atoms";

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isVisible, onClose }) => {
  const wizardRef = useRef<WizardRef>(null);
  const [isFirstStep, setIsFirstStep] = useState(true);
  const [isLastStep, setIsLastStep] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // Generate a UUID for this onboarding session
  const [sessionId] = useState(() => uuidv4());

  const showNotification = (message: string) => {
    Toast.show({
      type: "success",
      text1: "Success",
      text2: message,
    });
  };

  const getWizardContainerStyle = (step: number) => {
    const baseStyle = {
      backgroundColor: "#1f281f",
      borderRadius: 20,
      width: "90%" as any,
      paddingHorizontal: 6,
      paddingVertical: 10,
    };

    switch (step) {
      case 0: // Welcome Step
        return {
          ...baseStyle,
          height: "30%" as any,
        };
      case 1: // Onboarding Conversation Step
        return {
          ...baseStyle,
          height: "80%" as any,
          marginVertical: 20, // Add some margin for better visibility
        };
      case 2: // Finish Step
        return {
          ...baseStyle,
          height: "30%" as any,
        };
      default:
        return baseStyle;
    }
  };

  const stepList = [
    {
      content: (
        <WelcomeStep
          onNext={() => {
            showNotification("Successfully started the setup process.");
            wizardRef.current?.next();
          }}
        />
      ),
    },
    {
      content: (
        <OnboardingConversationStep
          wizardRef={wizardRef}
          sessionId={sessionId}
        />
      ),
    },
    {
      content: <FinishStep />,
    },
  ];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <DataProvider conversationId={sessionId}>
        <MessageProvider>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View
                style={[
                  styles.wizardWrapper,
                  getWizardContainerStyle(currentStep),
                ]}
              >
                {React.createElement(
                  Wizard as unknown as React.ComponentType<ActualWizardProps>,
                  {
                    ref: wizardRef,
                    steps: stepList,
                    isFirstStep: (val) => setIsFirstStep(val),
                    isLastStep: (val) => setIsLastStep(val),
                    onNext: () => setCurrentStep((prev) => prev + 1),
                    onPrev: () => setCurrentStep((prev) => prev - 1),
                    currentStep: ({ currentStep }) => {
                      setCurrentStep(currentStep);
                    },
                  }
                )}
              </View>
              {currentStep !== 1 && (
                <View style={styles.buttonContainer}>
                  {!isFirstStep && !isLastStep && (
                    <Button
                      onPress={() => wizardRef.current?.prev()}
                      style={styles.button}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onPress={() => {
                      if (isLastStep) {
                        onClose();
                      } else {
                        wizardRef.current?.next();
                      }
                    }}
                    style={{
                      ...styles.button,
                      width: !isFirstStep && !isLastStep ? "48%" : "100%",
                    }}
                  >
                    {isLastStep ? "Finish" : "Next"}
                  </Button>
                </View>
              )}
            </SafeAreaView>
          </KeyboardAvoidingView>
          <Toast />
        </MessageProvider>
      </DataProvider>
    </Modal>
  );
};
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    width: "100%",
  },
  wizardWrapper: {
    width: "90%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 20,
    paddingHorizontal: 6,
  },
  button: {
    width: "48%",
  },
});

export default WelcomeModal;
