import React, { useState, useRef } from 'react';
import { View, Modal, StyleSheet, SafeAreaView } from 'react-native';
import Wizard from "react-native-wizard";
import { WelcomeStep } from './WelcomeStep';
import { UserInfoStep } from './UserInfoStep';
import { WorkoutHistoryStep } from './WorkoutHistoryStep';
import { FinishStep } from './FinishStep';
import { Button } from '../public/atoms';
import { UserInfoData } from './index';

type WelcomeModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isVisible, onClose }) => {
  const [userInfo, setUserInfo] = useState<UserInfoData>({
    displayName: '',
    firstName: '',
    lastName: '',
    isImperial: false,
  });

  const wizardRef = useRef(null);
  const [isFirstStep, setIsFirstStep] = useState(true);
  const [isLastStep, setIsLastStep] = useState(false);

  const stepList = [
    {
      content: <WelcomeStep />
    },
    {
      content: <UserInfoStep onNext={(data: UserInfoData) => setUserInfo(data)} initialData={userInfo} />
    },
    {
      content: <WorkoutHistoryStep />
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
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.wizardContainer}>
          <Wizard
            ref={wizardRef}
            steps={stepList}
            isFirstStep={(val) => setIsFirstStep(val)}
            isLastStep={(val) => setIsLastStep(val)}
            onNext={() => {
              console.log("Next Step");
            }}
            onPrev={() => {
              console.log("Previous Step");
            }}
            currentStep={({ currentStep, isLastStep, isFirstStep }) => {
              console.log("Current step: ", currentStep);
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
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
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
    width: '48%', // Adjust this value to control button width
  },
});