import { Message } from "@/types";

export type WebSocketMessageType = 
  | 'content' 
  | 'done' 
  | 'workout_history_approved' 
  | 'error'
  | 'workout_approved'
  | 'loading_start'

export interface WebSocketMessage {
type?: any;
data?: string | Message[];
error?: string;
message?: string,
generate_graph?: boolean,
timestamp?: string
}

export type WebSocketEvents = {
  error: (error: Error) => void;
  connect: () => void;
  disconnect: () => void;
  message: (message: any) => void;
  messageSent: (message: WebSocketMessage) => void;
  connecting: () => void; 

};