import React, { useState } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { WelcomeStep } from './WelcomeStep';
import { UserInfoStep } from './UserInfoStep';
import { Button } from '../public/atoms';
import { ModalStep, UserInfoData } from './index';

type WelcomeModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isVisible, onClose }) => {
  const [currentStep, setCurrentStep] = useState<ModalStep>(ModalStep.Welcome);
  const [userInfo, setUserInfo] = useState<UserInfoData>({
    displayName: '',
    firstName: '',
    lastName: '',
    isImperial: false,
  });

  const handleNext = () => {
    setCurrentStep(ModalStep.UserInfo);
  };

  const handleBack = () => {
    if (currentStep === ModalStep.UserInfo) {
      setCurrentStep(ModalStep.Welcome);
    }
    // Add more conditions here as you add more steps
  };

  const handleUserInfoSubmit = (data: UserInfoData) => {
    setUserInfo(data);
    onClose(); // For now, we'll just close the modal. Later, you can add more steps or handle the data as needed.
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {currentStep !== ModalStep.Welcome && (
            <Button
              onPress={handleBack}
              variant="tertiary"
              size="small"
              style={styles.backButton}
            >
              Back
            </Button>
          )}
          {currentStep === ModalStep.Welcome && (
            <WelcomeStep onNext={handleNext} />
          )}
          {currentStep === ModalStep.UserInfo && (
            <UserInfoStep onNext={handleUserInfoSubmit} initialData={userInfo} />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
});