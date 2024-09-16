export { WelcomeStep } from './WelcomeStep';
export { UserInfoStep } from './UserInfoStep';

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