export { WelcomeStep } from './WelcomeStepContent';
export { UserInfoStep } from './UserInfoStepContent';

export enum ModalStep {
  Welcome,
  UserInfo,
  // Add other steps as needed
}

export type UserInfoData = {
  displayName: string;
  firstName: string;
  lastName: string;
  isImperial: boolean;
};