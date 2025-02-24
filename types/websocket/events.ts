export type WebSocketMessageType = 
  | 'content' 
  | 'done' 
  | 'workout_history_approved' 
  | 'error'
  | 'workout_approved'
  | 'loading_start'

export interface WebSocketMessage {
type?: any;
data?: string;
error?: string;
message: string,
generate_graph?: boolean
}

export type WebSocketEvents = {
  message: (message: WebSocketMessage) => void;
  error: (error: Error) => void;
  connect: () => void;
  disconnect: () => void;
};