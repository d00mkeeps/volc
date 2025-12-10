import { useMemo, useState, useEffect } from 'react';
import { useUserStore } from '@/stores/userProfileStore';
import { analysisBundleService } from '@/services/db/analysis';
import { UserContextBundle } from '@/types';

/**
 * Hook to generate fresh greeting messages for new conversations
 * 
 * Uses UserContextBundle (AI Memory) for personalized greetings.
 * Falls back to time-based greeting if no memory exists.
 */
export function useFreshGreeting(): string {
  const userProfile = useUserStore(state => state.userProfile);
  const [contextBundle, setContextBundle] = useState<UserContextBundle | null>(null);
  const [greeting, setGreeting] = useState<string>('');

  // Fetch latest context bundle on mount
  useEffect(() => {
    const fetchContext = async () => {
      if (userProfile?.user_id) {
        try {
          const bundle = await analysisBundleService.getLatestUserContextBundle(userProfile.user_id.toString());
          setContextBundle(bundle);
        } catch (e) {
          console.warn("Failed to fetch user context bundle", e);
        }
      }
    };
    
    fetchContext();
  }, [userProfile?.user_id]);
  
  // Extract first name if available
  const firstName = useMemo(() => {
    if (userProfile?.first_name) return userProfile.first_name;
    return '';
  }, [userProfile?.first_name]);

  // Generate greeting when dependencies change
  useEffect(() => {
    const hour = new Date().getHours();
    let selectedGreeting = "";
    
    // Check for AI Memory first
    const memory = contextBundle?.ai_memory;
    const hasMemory = memory && (memory.facts?.length > 0 || memory.summary);
    
    if (hasMemory) {
        // Returning User with Context
        // Ideally we would use the summary to generate something, but for now we use a "Welcome back" style
        // In the future this could be much smarter
        const memoryOptions = [
            firstName ? `Welcome back, ${firstName}. Ready to pick up where we left off?` : "Welcome back. Ready to pick up where we left off?",
            firstName ? `Good to see you, ${firstName}. Let's keep the momentum going.` : "Good to see you. Let's keep the momentum going.",
            "Ready to hit those goals?"
        ];
        selectedGreeting = memoryOptions[Math.floor(Math.random() * memoryOptions.length)];
    } else if (!contextBundle && userProfile) { 
        // Likely a New User (No bundle yet)
        selectedGreeting = firstName 
            ? `Welcome to Volc, ${firstName}! To start, what's one of your main fitness goals?`
            : "Welcome to Volc! To start, what's one of your main fitness goals?";
    } else {
        // Fallback Time-based Greeting
        let options: string[] = [];

        // Morning (5AM - 12PM)
        if (hour >= 5 && hour < 12) {
        options = [
            firstName ? `Good morning, ${firstName}!` : "Good morning!",
            "Ready to start the day strong?",
            "Morning workout?"
        ];
        }
        // Afternoon (12PM - 5PM)
        else if (hour >= 12 && hour < 17) {
        options = [
            firstName ? `Good afternoon, ${firstName}` : "Good afternoon",
            "Fancy a lunch workout today?",
            "Keeping the momentum going?"
        ];
        }
        // Evening/Night (5PM - 5AM)
        else {
        options = [
            firstName ? `How's it going, ${firstName}?` : "How's it going?",
            "Evening workout?",
            "Winding down with a session?"
        ];
        }
        selectedGreeting = options[Math.floor(Math.random() * options.length)];
    }
    
    setGreeting(selectedGreeting);

  }, [firstName, contextBundle, userProfile]);

  return greeting || "How can I help you regarding your fitness today?";
}
