export interface OnboardingFormData {
  isImperial: boolean;
  dob: Date;
  experienceLevel: string; // 0-10
  trainingLocation: string; // "gym", "home", or custom string
  height?: string;
  weight?: string;
}
