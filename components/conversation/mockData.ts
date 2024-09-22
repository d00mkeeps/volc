export const mockMessages = [
    { id: 1, role: 'user' as const, content: "Hello, how are you?" },
    { id: 2, role: 'assistant' as const, content: "I'm doing well, thank you! How can I assist you today?" },
    { id: 3, role: 'user' as const, content: "This is not a real message." },
    { id: 4, role: 'assistant' as const, content: "This isn't a real answer! You need to build a backend." },
  ];

  // components/conversation/mockData.ts

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

export const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Workout Plan',
    lastMessage: "Here's your personalized workout plan for this week.",
    timestamp: '2023-09-21T14:30:00Z',
  },
  {
    id: '2',
    title: 'Nutrition Advice',
    lastMessage: "Remember to increase your protein intake as discussed.",
    timestamp: '2023-09-20T10:15:00Z',
  },
  {
    id: '3',
    title: 'Progress Tracking',
    lastMessage: "Great job! You've made significant progress in the last month.",
    timestamp: '2023-09-19T18:45:00Z',
  },
];