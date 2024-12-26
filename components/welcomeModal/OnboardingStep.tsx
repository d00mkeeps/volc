import { useMessage } from "@/context/MessageContext";
import { UserProfileService } from "@/services/supabase/onboarding";
import { OnboardingStepProps } from "@/types/welcomeModal";
import { useRef, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { ChatUI } from "../conversation/organisms/ChatUI";

export const OnboardingConversationStep: React.FC<OnboardingStepProps> = ({ 
  wizardRef 
}) => {
  const userProfileService = new UserProfileService();

  const handleSignal = useCallback(async (type: string, data: any) => {
    if (type === 'workout_history_approved') {
      try {
        await userProfileService.saveUserProfile(data);
        wizardRef?.current?.next();
      } catch (error) {
        console.error('Failed to save profile:', error);
      }
    }
  }, [wizardRef]);
 
  return (
    <View style={styles.stepContainer}>
      <ChatUI 
        configName="onboarding"
        title="Let's Get to Know You"
        subtitle="Building your personalized fitness journey"
        onSignal={handleSignal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1f281f',
    minHeight: '100%',
    alignSelf: 'stretch',
  },
});