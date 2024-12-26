/*import { useCallback } from "react";
import {ChatUI} from "./ChatUI";
import type { UserOnboarding } from '@/types/onboarding';
import { OnboardingChatProps } from "@/types/chat";

export const OnboardingChat: React.FC<OnboardingChatProps> = ({
  onComplete
}) => {
  const handleSignal = useCallback((type: string, data: any) => {
    if (type === 'workout_history_approved' && data) {
      console.log('OnboardingChat: Received onboarding data', data);
      onComplete?.(data as UserOnboarding);
    }
  }, []);

  return (
    <ChatUI
      configName="onboarding"
      title="Let's Get to Know You"
      subtitle="Building your personalized fitness journey"
      onSignal={handleSignal}
    />
  );
};
*/