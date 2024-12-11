export type ChatConfigName = 
  | 'onboarding'
  | 'default'
  /* example of new config 
  | 'workout-planner'
  */

  interface SignalHandler {
    (type: string, data: any): void
  }
export interface ChatUIProps {
  configName: ChatConfigName;
  title?: string;
  subtitle?: string;
  signalHandler?: SignalHandler;
  conversationId?: string; 
}