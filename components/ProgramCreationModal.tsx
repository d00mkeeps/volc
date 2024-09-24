import React, { useState, useRef } from 'react';
import { View, Modal, StyleSheet, SafeAreaView } from 'react-native';
import Wizard, { WizardRef } from "react-native-wizard";
import { Button } from './public/atoms';
import ConversationUI from './conversation/organisms/ChatUI';
import { Text } from '@/components/Themed';

type ProgramCreationModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

export const ProgramCreationModal: React.FC<ProgramCreationModalProps> = ({ isVisible, onClose }) => {
  const wizardRef = useRef<WizardRef>(null);
  const [isFirstStep, setIsFirstStep] = useState(true);
  const [isLastStep, setIsLastStep] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const stepList = [
    {
      content: (
        <ConversationUI 
          title="Program Goals"
          subtitle="Let's define your basic goal and create a SMART goal for your program." messages={[]} draftMessage={''} onSendMessage={function (message: string): void {
            throw new Error('Function not implemented.');
          } } onDraftMessageChange={function (draft: string): void {
            throw new Error('Function not implemented.');
          } }        />
      )
    },
    {
      content: (
        <ConversationUI 
          title="Intermediate Goals"
          subtitle="Let's discuss suitable intermediate goals and create your program." messages={[]} draftMessage={''} onSendMessage={function (message: string): void {
            throw new Error('Function not implemented.');
          } } onDraftMessageChange={function (draft: string): void {
            throw new Error('Function not implemented.');
          } }        />
      )
    },
    {
      content: (
        <View style={styles.finalStep}>
          <Text style={styles.finalStepText}>Great job! Your program has been created and uploaded to your profile.</Text>
        </View>
      )
    }
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.wizardContainer}>
          <Wizard
            ref={wizardRef}
            steps={stepList}
            isFirstStep={(val) => setIsFirstStep(val)}
            isLastStep={(val) => setIsLastStep(val)}
            currentStep={({ currentStep, isLastStep, isFirstStep }) => {
              setCurrentStep(currentStep);
              setIsFirstStep(isFirstStep);
              setIsLastStep(isLastStep);
              console.log(`Step ${currentStep + 1} of ${stepList.length}`);
            }}
          />
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
    </Modal>
  );
};
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  wizardContainer: {
    backgroundColor: '#1f281f',
    borderRadius: 20,
    width: '90%',
    height: '80%',
    padding: 20,
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
  finalStep: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalStepText: {
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
});