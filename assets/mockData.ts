import { Program } from "@/types";

export const shortConversation = [
  { id: '1', sender: 'user', text: "I've been feeling overwhelmed lately. Any tips?" },
  { id: '2', sender: 'coach', text: "I'm sorry to hear that. Let's start with deep breathing exercises. Try inhaling for 4 counts, holding for 4, then exhaling for 4." },
  { id: '3', sender: 'user', text: "Thanks, I'll give that a try. It sounds simple but effective." },
];

export const mediumConversation = [
  { id: '1', sender: 'user', text: "I want to start a new exercise routine, but I'm not sure where to begin." },
  { id: '2', sender: 'coach', text: "That's great that you want to get more active! What types of activities do you enjoy?" },
  { id: '3', sender: 'user', text: "I like being outdoors, maybe hiking or cycling?" },
  { id: '4', sender: 'coach', text: "Excellent choices! Starting with 30-minute sessions twice a week would be a good goal. Remember to warm up and stay hydrated." },
  { id: '5', sender: 'user', text: "That sounds doable. Should I be concerned about any potential injuries?" },
  { id: '6', sender: 'coach', text: "Good question. Listen to your body and start slowly. Proper footwear is crucial for hiking, and a well-fitted helmet is essential for cycling. We can discuss specific safety tips in our next session." },
];

const longerConversation = [
  { id: '1', sender: 'user', text: "I've been having trouble sleeping lately. It's affecting my work performance." },
  { id: '2', sender: 'coach', text: "I'm sorry to hear that. Sleep issues can indeed impact many areas of life. Let's start by looking at your bedtime routine. What do you typically do in the hour before bed?" },
  { id: '3', sender: 'user', text: "I usually watch TV or scroll through social media on my phone." },
  { id: '4', sender: 'coach', text: "The blue light from screens can interfere with your sleep cycle. Try establishing a new routine without screens for an hour before bed. Perhaps reading a book or gentle stretching instead?" },
  { id: '5', sender: 'user', text: "That makes sense. I'll give it a try. Any other suggestions?" },
  { id: '6', sender: 'coach', text: "Yes, consistency is key. Try to go to bed and wake up at the same time every day, even on weekends. Also, make sure your bedroom is cool, dark, and quiet." },
  { id: '7', sender: 'user', text: "Okay, I'll work on that. What about diet? Does that affect sleep?" },
  { id: '8', sender: 'coach', text: "Absolutely! Avoid caffeine in the afternoon and evening. Also, try not to eat heavy meals close to bedtime. A light snack if you're hungry is fine." },
  { id: '9', sender: 'user', text: "Got it. This is really helpful, thanks. I'll start implementing these changes tonight." },
  { id: '10', sender: 'coach', text: "That's great! Remember, it might take a few weeks to see significant changes. Keep track of your progress, and we'll review in our next session. Sweet dreams!" },
];

const extendedConversation = [
  { id: '1', sender: 'user', text: "I've been feeling stuck in my career lately. I want to make a change but I'm not sure how." },
  { id: '2', sender: 'coach', text: "It's common to feel that way. Let's explore this. What aspects of your current job do you enjoy, and what would you like to change?" },
  { id: '3', sender: 'user', text: "I enjoy problem-solving and working with data, but I feel like I'm not growing or being challenged enough." },
  { id: '4', sender: 'coach', text: "That's a great starting point. Have you considered roles that might offer more challenges in data analysis or problem-solving?" },
  { id: '5', sender: 'user', text: "I've thought about data science, but I'm not sure if I have the right skills." },
  { id: '6', sender: 'coach', text: "Data science is an exciting field. Let's break this down. What skills do you think you'd need, and which do you already have?" },
  { id: '7', sender: 'user', text: "I'm good with Excel and basic statistics, but I'd need to learn programming languages like Python or R." },
  { id: '8', sender: 'coach', text: "That's a solid foundation. Many online courses can help you learn Python or R. Would you be interested in starting with one of those?" },
  { id: '9', sender: 'user', text: "Yes, that sounds like a good first step. But how do I balance learning with my current job?" },
  { id: '10', sender: 'coach', text: "Great question. Start small - maybe dedicate 30 minutes a day to learning. Consistency is key. Can you think of a time in your day when you could do this?" },
  { id: '11', sender: 'user', text: "I could probably do it during my lunch break or in the evening after dinner." },
  { id: '12', sender: 'coach', text: "Perfect. Let's set a goal. How about starting a Python course next week, studying for 30 minutes each weekday?" },
  { id: '13', sender: 'user', text: "That sounds achievable. Should I start looking for new jobs right away?" },
  { id: '14', sender: 'coach', text: "I'd suggest focusing on learning for a month or two first. This will build your confidence and skills. We can then work on updating your resume and job search strategies." },
  { id: '15', sender: 'user', text: "That makes sense. Thanks for helping me break this down into manageable steps. I'm feeling more optimistic already!" },
];


export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  lastMessageTime: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
// Convert the conversation arrays to use the Message type
const convertToMessages = (conversation: any[]): Message[] => {
  return conversation.map(msg => ({
    id: msg.id,
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));
};

// Convert each conversation
const shortConversationMessages = convertToMessages(shortConversation);
const mediumConversationMessages = convertToMessages(mediumConversation);
const longerConversationMessages = convertToMessages(longerConversation);
const extendedConversationMessages = convertToMessages(extendedConversation);

// Create the mockConversations array
export const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Stress Management',
    lastMessage: "Thanks, I'll give that a...",
    timestamp: '2023-09-21T14:30:00Z',
    lastMessageTime: '3 minutes ago',
    messages: shortConversationMessages
  },
  {
    id: '2',
    title: 'Exercise Routine',
    lastMessage: "That sounds doable. Should I...",
    timestamp: '2023-09-20T10:15:00Z',
    lastMessageTime: '6 hours ago',
    messages: mediumConversationMessages
  },
  {
    id: '3',
    title: 'Sleep Improvement',
    lastMessage: "Got it. This is really help...",
    timestamp: '2023-09-19T18:45:00Z',
    lastMessageTime: 'Yesterday',
    messages: longerConversationMessages
  },
  {
    id: '4',
    title: 'Career Development',
    lastMessage: "That makes sense. Thanks for...",
    timestamp: '2023-09-18T09:00:00Z',
    lastMessageTime: 'Last week',
    messages: extendedConversationMessages
  }
];
// The mockMessages array remains the same as you provided
export const mockMessages: Message[] = [
  { id: '1', role: 'user', content: "Hello, how are you?" },
  { id: '2', role: 'assistant', content: "I'm doing well, thank you! How can I assist you today?" },
  { id: '3', role: 'user', content: "I'm looking for some advice on improving my diet." },
  { id: '4', role: 'assistant', content: "Let's start by discussing your current eating habits and your goals. What specific areas of your diet would you like to improve?" },
];


export const mockPrograms: Program[] = [
  {
    id: '1',
    name: 'Beginner Workout',
    description: 'A program designed for those new to fitness, focusing on building basic strength and endurance.',
    createdAt: '2024-09-27T10:00:00Z',
  },
  {
    id: '2',
    name: 'Advanced Strength Training',
    description: 'An intensive program for experienced lifters, aimed at maximizing muscle growth and strength gains.',
    createdAt: '2024-09-26T14:30:00Z',
  },
  {
    id: '3',
    name: 'Cardio Blast',
    description: 'High-intensity cardio workouts to improve cardiovascular health and burn calories.',
    createdAt: '2024-09-25T09:15:00Z',
  },
  {
    id: '4',
    name: 'Yoga for Flexibility',
    description: 'A series of yoga sessions focused on improving flexibility and reducing stress.',
    createdAt: '2024-09-24T16:45:00Z',
  },
];
