import React, { useState } from 'react';
import { View, Modal, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { WelcomeStep } from './WelcomeStepContent';
import { UserInfoStep } from './UserInfoStepContent';
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
    if (currentStep === ModalStep.Welcome) {
      setCurrentStep(ModalStep.UserInfo);
    } else {
      handleUserInfoSubmit(userInfo);
    }
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.titleSection}>
          </View>
          <ScrollView contentContainerStyle={styles.contentSection}>
            {currentStep === ModalStep.Welcome && (
              <WelcomeStep onNext={handleNext} />
            )}
            {currentStep === ModalStep.UserInfo && (
              <UserInfoStep onNext={handleUserInfoSubmit} initialData={userInfo} />
            )}
          </ScrollView>
          <View style={styles.buttonSection}>
            <View style={styles.buttonContainer}>
              {currentStep !== ModalStep.Welcome && (
                <Button 
                  onPress={handleBack}                          style={styles.button}
                >Back</Button>
              )}
              <Button 
                onPress={handleNext} 
          
                style={styles.button}
              >{currentStep === ModalStep.Welcome ? "Next" : "Finish"}</Button>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%', // Set a maximum height
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  titleSection: {
    paddingVertical: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  contentSection: {
    padding: 20,
  },
  buttonSection: {
    paddingVertical: 15,
    borderTopWidth: 0,
    borderTopColor: '#ccc',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  button: {
    width: '48%', // Adjust this value to control button width
  },
});