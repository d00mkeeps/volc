// OnboardingStep.tsx
import { useMessage } from "@/context/MessageContext";
import { UserProfileService } from "@/services/supabase/userProfile";
import { ConversationService } from "@/services/supabase/conversation";
import { authService } from "@/services/supabase/auth";
import { OnboardingStepProps } from "@/types/welcomeModal";
import { useEffect, useCallback, useState, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import { ChatUI } from "../conversation/organisms/ChatUI";
import { Button } from "react-native-paper";
import {
  releaseConnection,
  getWebSocketService,
  connectToConversation,
} from "@/services/websocket/GlobalWebsocketService";
import { WebSocketMessage } from "@/types/websocket";

interface ExtendedOnboardingStepProps extends OnboardingStepProps {
  sessionId: string;
}

export const OnboardingConversationStep: React.FC<
  ExtendedOnboardingStepProps
> = ({ wizardRef, sessionId }) => {
  const userProfileService = new UserProfileService();
  const conversationService = new ConversationService();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadConversation } = useMessage();

  // Add connection tracking
  const connectionRef = useRef({
    active: false,
    initializing: false,
  });
  const isMountedRef = useRef(true);

  // Add mount tracking
  useEffect(() => {
    isMountedRef.current = true;
    console.log("OnboardingStep: MOUNTED");

    return () => {
      isMountedRef.current = false;
      console.log("OnboardingStep: UNMOUNTED");
    };
  }, []);

  // Initialize conversation, but DON'T call loadConversation yet
  useEffect(() => {
    if (connectionRef.current.initializing) return;
    connectionRef.current.initializing = true;

    const initializeConversation = async () => {
      try {
        setIsLoading(true);
        const session = await authService.getSession();

        if (!session?.user?.id) {
          throw new Error("User not authenticated");
        }

        console.log("OnboardingStep: Creating conversation record", {
          userId: session.user.id,
          sessionId,
          configName: "onboarding",
        });

        // Create conversation record
        await conversationService.createOnboardingConversation({
          userId: session.user.id,
          sessionId: sessionId,
          configName: "onboarding",
        });

        await conversationService.saveMessage({
          conversationId: sessionId,
          content:
            "Hello! I'm a new user hoping to make a friend and achieve fitness goals with you!",
          sender: "user",
        });

        // ⚠️ REMOVED - Don't call loadConversation here!
        // await loadConversation(sessionId);

        // Add a delay before setting loading to false
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (isMountedRef.current) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize onboarding conversation:", error);

        if (isMountedRef.current) {
          setError("Failed to start onboarding. Please try again.");
          setIsLoading(false);
        }

        connectionRef.current.initializing = false;
      }
    };

    initializeConversation();
  }, [sessionId, conversationService]);

  // Signal handler for ChatUI
  const handleSignal = useCallback(
    async (type: string, data: any) => {
      console.log("OnboardingStep: Received signal:", type);

      if (type === "workout_history_approved") {
        try {
          console.log("OnboardingStep: Processing workout history", data);
          await userProfileService.saveUserProfile(data);

          if (isMountedRef.current && wizardRef?.current) {
            wizardRef.current.next();
          }
        } catch (error) {
          console.error("Failed to save profile:", error);
        }
      }
    },
    [wizardRef, userProfileService]
  );

  // Connection management - only run this when not loading
  useEffect(() => {
    if (isLoading || !sessionId) return;

    console.log("OnboardingStep: Setting up connection for session", sessionId);

    // Prevent duplicate connections
    if (connectionRef.current.active) {
      console.log("OnboardingStep: Connection already active, skipping setup");
      return;
    }

    const setupConnection = async () => {
      try {
        // Mark connection as active
        connectionRef.current.active = true;

        // Add delay to ensure stable connection
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!isMountedRef.current) {
          console.log("OnboardingStep: Component unmounted during setup");
          connectionRef.current.active = false;
          return;
        }

        // Try to load conversation with retries
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            console.log(
              `OnboardingStep: Loading conversation (attempt ${retryCount + 1})`
            );

            // Use loadConversation which handles WebSocket setup properly
            await loadConversation(sessionId);
            console.log("OnboardingStep: Connection successful");
            break;
          } catch (error) {
            retryCount++;
            console.error(
              `OnboardingStep: Connection attempt ${retryCount} failed:`,
              error
            );

            if (retryCount >= maxRetries) throw error;

            // Wait before retry with exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, 500 * Math.pow(2, retryCount - 1))
            );
          }
        }
      } catch (error) {
        console.error("OnboardingStep: All connection attempts failed:", error);
        connectionRef.current.active = false;

        if (isMountedRef.current) {
          setError("Failed to connect to onboarding. Please try again.");
        }
      }
    };

    setupConnection();

    // Delay disconnection on cleanup
    return () => {
      console.log("OnboardingStep: Preparing to clean up connection");

      // Delay disconnection to avoid rapid disconnect/reconnect cycles
      setTimeout(() => {
        // Only disconnect if component is unmounted
        if (!isMountedRef.current) {
          console.log("OnboardingStep: Releasing connection", sessionId);
          connectionRef.current.active = false;
          releaseConnection("onboarding", sessionId);
        }
      }, 1000);
    };
  }, [sessionId, isLoading, loadConversation]);

  // Render UI based on state
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
        <Button mode="contained" onPress={() => wizardRef?.current?.prev()}>
          Go Back
        </Button>
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
    width: "100%",
    height: "100%",
    backgroundColor: "#1f281f",
    minHeight: "100%",
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#8cd884",
    fontSize: 18,
    textAlign: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});
