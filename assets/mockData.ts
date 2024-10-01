import { Program, Workout, Exercise } from "@/types";

const createExercise = (id: string, name: string, description: string, sets?: number, reps?: number, duration?: string): Exercise => ({
  id,
  name,
  description,
  sets,
  reps,
  duration,
});

const createWorkout = (id: string, name: string, description: string, exercises: Exercise[]): Workout => ({
  id,
  name,
  description,
  exercises,
});

export const mockPrograms: Program[] = [
  {
    id: '1',
    name: 'Beginner Fitness Journey',
    description: 'A program designed for those new to fitness, focusing on building basic strength and endurance.',
    createdAt: '2024-09-27T10:00:00Z',
    workouts: [
      createWorkout('w1', 'Full Body Basics', 'Introduction to fundamental exercises targeting all major muscle groups.', [
        createExercise('e1', 'Bodyweight Squats', 'Stand with feet shoulder-width apart, lower your body as if sitting back into a chair.', 3, 10),
        createExercise('e2', 'Push-ups', 'Start in a plank position, lower your body until your chest nearly touches the floor, then push back up.', 3, 5),
        createExercise('e3', 'Lunges', 'Step forward with one leg, lowering your hips until both knees are bent at about 90-degree angles.', 3, 8),
        createExercise('e4', 'Plank', 'Hold a push-up position with your forearms on the ground.', 3, undefined, '30 seconds'),
        createExercise('e5', 'Mountain Climbers', 'Start in a push-up position, bring one knee toward your chest, then quickly switch legs.', 3, undefined, '30 seconds'),
      ]),
      createWorkout('w2', 'Cardio Starter', 'Low-impact cardio exercises to improve heart health and stamina.', [
        createExercise('e6', 'Jumping Jacks', 'Start standing, then jump your feet out while raising your arms overhead.', 3, undefined, '30 seconds'),
        createExercise('e7', 'High Knees', 'Jog in place, lifting your knees high towards your chest.', 3, undefined, '30 seconds'),
        createExercise('e8', 'Butt Kicks', 'Jog in place, kicking your heels up towards your buttocks.', 3, undefined, '30 seconds'),
        createExercise('e9', 'Jump Rope', 'Simulate jumping rope, or use an actual jump rope if available.', 3, undefined, '1 minute'),
        createExercise('e10', 'Step-Ups', 'Step up onto a sturdy elevated surface, alternating leading legs.', 3, 15),
      ]),
      createWorkout('w3', 'Flexibility Focus', 'Simple stretching routine to enhance overall flexibility and reduce muscle tension.', [
        createExercise('e11', 'Standing Hamstring Stretch', 'Bend forward at the hips, reaching towards your toes.', 3, undefined, '30 seconds per leg'),
        createExercise('e12', 'Shoulder Rolls', 'Roll your shoulders backwards in a circular motion.', 2, 10),
        createExercise('e13', 'Cat-Cow Stretch', 'On hands and knees, alternate between arching and rounding your back.', 3, 10),
        createExercise('e14', 'Seated Twist', 'Sit with legs extended, twist your torso to one side, then the other.', 2, undefined, '30 seconds per side'),
        createExercise('e15', 'Child\'s Pose', 'Kneel on the floor, sit back on your heels, and stretch your arms forward.', 1, undefined, '1 minute'),
      ]),
    ],
  },
  {
    id: '2',
    name: 'Intermediate Strength Builder',
    description: 'A program for those with some fitness experience, aimed at building strength and muscle definition.',
    createdAt: '2024-09-26T14:30:00Z',
    workouts: [
      createWorkout('w4', 'Upper Body Power', 'Challenging workout focusing on chest, back, and arms.', [
        createExercise('e16', 'Push-ups with Rotation', 'Perform a push-up, then rotate to a side plank position.', 3, 10),
        createExercise('e17', 'Dumbbell Rows', 'Bend over with a dumbbell in each hand, pull them up towards your chest.', 3, 12),
        createExercise('e18', 'Tricep Dips', 'Using a chair or bench, lower your body by bending your elbows.', 3, 15),
        createExercise('e19', 'Shoulder Press', 'Press dumbbells overhead from shoulder height.', 3, 10),
        createExercise('e20', 'Plank to Downward Dog', 'Alternate between plank position and downward dog yoga pose.', 3, 10),
      ]),
      createWorkout('w5', 'Lower Body Blast', 'Intense leg and glute exercises for building lower body strength.', [
        createExercise('e21', 'Goblet Squats', 'Hold a dumbbell or kettlebell close to your chest while performing squats.', 3, 12),
        createExercise('e22', 'Romanian Deadlifts', 'Hinge at the hips while holding dumbbells, lowering them along your legs.', 3, 10),
        createExercise('e23', 'Reverse Lunges', 'Step backwards into a lunge, alternating legs.', 3, 12),
        createExercise('e24', 'Calf Raises', 'Stand on the edge of a step, raise your heels up and down.', 3, 15),
        createExercise('e25', 'Glute Bridges', 'Lie on your back, lift your hips up towards the ceiling.', 3, 15),
      ]),
      createWorkout('w6', 'Core Crusher', 'Targeted ab and core workout for improved stability and definition.', [
        createExercise('e26', 'Russian Twists', 'Sit with knees bent, feet off the ground, twist torso side to side.', 3, 20),
        createExercise('e27', 'Bicycle Crunches', 'Lie on your back, alternate bringing opposite elbow to knee.', 3, 20),
        createExercise('e28', 'Plank Hold', 'Hold a forearm plank position.', 3, undefined, '45 seconds'),
        createExercise('e29', 'Leg Raises', 'Lie on your back, raise your legs up towards the ceiling.', 3, 12),
        createExercise('e30', 'Side Plank with Hip Dips', 'In side plank position, lower and raise your hip.', 3, 10),
      ]),
    ],
  },
];


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

export const mockMessages: Message[] = [
  { id: '1', role: 'user', content: "Hello, how are you?" },
  { id: '2', role: 'assistant', content: "I'm doing well, thank you! How can I assist you today?" },
  { id: '3', role: 'user', content: "I'm looking for some advice on improving my diet." },
  { id: '4', role: 'assistant', content: "Let's start by discussing your current eating habits and your goals. What specific areas of your diet would you like to improve?" },
];

