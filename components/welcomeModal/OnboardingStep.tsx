import { useMessage } from "@/context/MessageContext";
import { UserProfileService } from "@/services/supabase/onboarding";
import { useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { ChatUI } from "../conversation/organisms/ChatUI";
import { OnboardingStepProps } from "@/types/welcomeModal";

export const OnboardingConversationStep: React.FC<OnboardingStepProps> = ({ 
  wizardRef 
}) => {
  const { sendMessage, messages } = useMessage();
  const userProfileService = new UserProfileService();

  useEffect(() => {
    if (messages.length === 0) {
      sendMessage("Hi");
    }
  }, []);

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
    backgroundColor: '#1f281f',
  },
});