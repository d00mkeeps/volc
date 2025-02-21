// In a constants file or similar
export const CHAT_CONFIGS = {
    'default': 'Workout Tracking',
    'workout-analysis': 'Workout Analysis'
  } as const;
  
  // Type for the config keys
  export type ChatConfigKey = keyof typeof CHAT_CONFIGS;