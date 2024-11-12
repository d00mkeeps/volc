export type ChatConfigName = 
  | 'workout-history'
  | 'default'
  /* example of new config 
  | 'workout-planner'
  */

export interface ChatUIProps {
  configName: ChatConfigName;
  title?: string;
  subtitle?: string;
  signalHandler?: (type: string, data: any) => void;
}