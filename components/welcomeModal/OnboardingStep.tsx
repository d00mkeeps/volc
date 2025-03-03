import { useMessage } from "@/context/MessageContext";
import { UserProfileService } from "@/services/supabase/onboarding";
import { ConversationService } from "@/services/supabase/conversation";
import { authService } from "@/services/supabase/auth";
import { OnboardingStepProps } from "@/types/welcomeModal";
import { useRef, useEffect, useCallback, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { ChatUI } from "../conversation/organisms/ChatUI";
import { Button } from "react-native-paper";

interface ExtendedOnboardingStepProps extends OnboardingStepProps {
  sessionId: string;
}

export const OnboardingConversationStep: React.FC<ExtendedOnboardingStepProps> = ({ 
  wizardRef,
  sessionId 
}) => {
  const userProfileService = new UserProfileService();
  const conversationService = new ConversationService();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadConversation } = useMessage();

  useEffect(() => {
    const initializeConversation = async () => {
      try {
        setIsLoading(true);
        const session = await authService.getSession();
        
        if (!session?.user?.id) {
          throw new Error("User not authenticated");
        }
        
        // Create the conversation record with our specific UUID
        await conversationService.createOnboardingConversation({
          userId: session.user.id,
          sessionId: sessionId,
          configName: "onboarding" 
        });
        
        await conversationService.saveMessage({
          conversationId: sessionId,
          content: "Hello! I'm a new user hoping to make a friend and achieve fitness goals with you!",
          sender: 'user'
        });
        
        await loadConversation(sessionId);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize onboarding conversation:", error);
        setError("Failed to start onboarding. Please try again.");
        setIsLoading(false);
      }
    };
    
    initializeConversation();
  }, [sessionId]);

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
 
  // Show loading state or error if needed
  if (isLoading) {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.loadingText}>Preparing your workout coach...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={() => wizardRef?.current?.prev()}>Go Back</Button>
      </View>
    );
  }

  return (
    <View style={styles.stepContainer}>
      <ChatUI 
        configName="onboarding"
        conversationId={sessionId}
        title="Let's Get to Know You"
        subtitle="Send a message to meet the TrainSmart coach!"
        onSignal={handleSignal}
        showSidebar={false}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8cd884',
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  }
});