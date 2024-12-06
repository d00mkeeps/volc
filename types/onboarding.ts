export interface PersonalInfo {
    firstName: string;
    lastName: string;
    ageGroup: string;
    preferredUnits: 'metric' | 'imperial';
  }
  
  export interface FitnessBackground {
    trainingAge: string;
    exercisePreferences: string[];
    currentAbilities: string[];
    injuries: string[];
  }
  
  export interface UserOnboarding {
    personalInfo: PersonalInfo;
    goal: string;
    fitnessBackground: FitnessBackground;
  }