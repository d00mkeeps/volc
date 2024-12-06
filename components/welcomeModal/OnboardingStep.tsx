import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { OnboardingChat } from '@/components/conversation/organisms/OnboardingChat';
import { UserOnboarding } from '@/types/onboarding';
import { useMessage } from '@/context/MessageContext';
import { UserProfileService } from '@/services/supabase/onboarding';

interface OnboardingStepProps {
  wizardRef?: React.RefObject<any>;
}

const userProfileService = new UserProfileService();

export const OnboardingConversationStep: React.FC<OnboardingStepProps> = ({ 
  wizardRef 
}) => {
  const { sendMessage, messages } = useMessage();

  useEffect(() => {
    if (messages.length === 0) {
      sendMessage("Hi");
    }
  }, []);

  const handleComplete = useCallback(async (onboardingData: UserOnboarding) => {
    try {
      await userProfileService.saveUserProfile(onboardingData);
      wizardRef?.current?.next();
    } catch (error) {
      console.error('Failed to save profile:', error);
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
