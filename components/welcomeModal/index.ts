export { WelcomeStep } from './WelcomeStep';
export { UserInfoStep } from './UserInfoStep';
export { OnboardingConversationStep} from './OnboardingStep'
export {FinishStep} from './FinishStep'

export enum ModalStep {
  Welcome,
  UserInfo,
  WorkoutHistory,
  Finish
}

export type UserInfoData = {
  displayName: string;
  firstName: string;
  lastName: string;
  isImperial: boolean;
};