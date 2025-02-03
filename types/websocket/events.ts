export type WebSocketMessageType = 
  | 'content' 
  | 'done' 
  | 'workout_history_approved' 
  | 'error'
  | 'workout_approved'
  | 'loading_start'

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: any;
  error?: string;
}

export type WebSocketEvents = {
  message: (message: WebSocketMessage) => void;
  error: (error: Error) => void;
  connect: () => void;
  disconnect: () => void;
};