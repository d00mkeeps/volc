import React, { useState, useRef } from 'react';
import { View, Modal, StyleSheet, SafeAreaView } from 'react-native';
import Wizard, {WizardRef} from "react-native-wizard";
import { WelcomeStep } from './WelcomeStep';
import {OnboardingConversationStep} from './OnboardingStep';
import { FinishStep } from './FinishStep';
import { Button } from '../public/atoms';
import Toast from 'react-native-toast-message';
import { MessageProvider } from '@/context/MessageContext';
import { ActualWizardProps, WelcomeModalProps } from '@/types/welcomeModal';


export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isVisible, onClose }) => {

  


  const wizardRef = useRef<WizardRef>(null);
  const [isFirstStep, setIsFirstStep] = useState(true);
  const [isLastStep, setIsLastStep] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const showNotification = (message: string) => {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: message,
    });
  };
  const stepList = [
    {
      content: <WelcomeStep onNext={() => {
        showNotification('Successfully started the setup process.');
        wizardRef.current?.next();
      } } />
    },
    {
      content: <OnboardingConversationStep wizardRef={wizardRef}/>
    },
    {
      content: <FinishStep />
    }
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <MessageProvider>
     <SafeAreaView style={styles.modalContainer}>
        <View style={styles.wizardContainer}>
          {React.createElement(Wizard as unknown as React.ComponentType<ActualWizardProps>, {
            ref: wizardRef,
            steps: stepList,
            isFirstStep: (val) => setIsFirstStep(val),
            isLastStep: (val) => setIsLastStep(val),
            onNext: (step) => {
              
            },
            onPrev: (step) => {
              console.log("Previous Step", step);
            },
            currentStep: ({ currentStep, isLastStep, isFirstStep }) => {
              console.log("Current step: ", currentStep);
            }
          })}
        </View>
        <View style={styles.buttonContainer}>
          {!isFirstStep && (
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
            style={styles.button}
          >
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </View>
      </SafeAreaView>
      </MessageProvider>
      <Toast/>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
  },
  wizardContainer: {
    backgroundColor: '#1f281f',
    borderRadius: 20,
    width: '90%',
    height: '80%',
    paddingHorizontal: 6, 
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 20,
  },
  button: {
    width: '48%',
  },
});