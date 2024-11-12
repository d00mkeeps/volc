import { ConnectionState } from '@/types/states';

export const messageStates = {
  disconnected: (): ConnectionState => ({
    type: 'DISCONNECTED',
    canSendMessage: false,
    canConnect: true,
    isLoading: false
  }),

  connecting: (): ConnectionState => ({
    type: 'CONNECTING',
    canSendMessage: false,
    canConnect: false,
    isLoading: true
  }),

  connected: (): ConnectionState => ({
    type: 'CONNECTED',
    canSendMessage: true,
    canConnect: false,
    isLoading: false
  }),

  streaming: (): ConnectionState => ({
    type: 'STREAMING',
    canSendMessage: true,
    canConnect: false,
    isLoading: false
  }),

  error: (error: Error): ConnectionState => ({
    type: 'ERROR',
    error,
    canSendMessage: false,
    canConnect: true,
    isLoading: false
  })
} as const;