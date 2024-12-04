import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { OnboardingChat } from '@/components/conversation/organisms/OnboardingChat';
import type { UserOnboarding } from '@/types/onboarding';
import { useMessage } from '@/context/MessageContext';

interface OnboardingStepProps {
  wizardRef?: React.RefObject<any>;
}

export const OnboardingConversationStep: React.FC<OnboardingStepProps> = ({ 
  wizardRef 
}) => {
  const { sendMessage, messages } = useMessage();

  useEffect(() => {
    // Only send initial message if there are no messages yet
    if (messages.length === 0) {
      sendMessage("Hi");
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleComplete = useCallback((onboardingData: UserOnboarding) => {
    console.log('OnboardingStep: Collection complete');
    console.log('Onboarding Data:', onboardingData);
    
    if (wizardRef?.current) {
      console.log('OnboardingStep: Advancing wizard');
      wizardRef.current.next();
    } else {
      console.warn('OnboardingStep: wizardRef not available');
    }
  }, [wizardRef]);
 
  return (
    <View style={styles.container}>
      <OnboardingChat 
        onComplete={handleComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

export default OnboardingConversationStep