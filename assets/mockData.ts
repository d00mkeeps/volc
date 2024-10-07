import { Program, Workout, Exercise, Conversation, Message, UserProfile } from "@/types";

const createPrWoExercise = (id: string, name: string, description: string, sets?: number, reps?: number, duration?: string): Exercise => ({
  id,
  name,
  description,
  sets,
  reps,
  duration,
});

const createPrWorkout = (id: string, name: string, description: string, exercises: Exercise[]): Workout => ({
  id,
  name,
  description,
  exercises,
  createdAt: ""
});

export const mockPrograms: Program[] = [
  {
    id: '1',
    name: 'Beginner Fitness Journey',
    description: 'A program designed for those new to fitness, focusing on building basic strength and endurance.',
    createdAt: '2024-09-27T10:00:00Z',
    workouts: [
      createPrWorkout('w1', 'Full Body Basics', 'Introduction to fundamental exercises targeting all major muscle groups.', [
        createPrWoExercise('e1', 'Bodyweight Squats', 'Stand with feet shoulder-width apart, lower your body as if sitting back into a chair.', 3, 10),
        createPrWoExercise('e2', 'Push-ups', 'Start in a plank position, lower your body until your chest nearly touches the floor, then push back up.', 3, 5),
        createPrWoExercise('e3', 'Lunges', 'Step forward with one leg, lowering your hips until both knees are bent at about 90-degree angles.', 3, 8),
        createPrWoExercise('e4', 'Plank', 'Hold a push-up position with your forearms on the ground.', 3, undefined, '30 seconds'),
        createPrWoExercise('e5', 'Mountain Climbers', 'Start in a push-up position, bring one knee toward your chest, then quickly switch legs.', 3, undefined, '30 seconds'),
      ]),
      createPrWorkout('w2', 'Cardio Starter', 'Low-impact cardio exercises to improve heart health and stamina.', [
        createPrWoExercise('e6', 'Jumping Jacks', 'Start standing, then jump your feet out while raising your arms overhead.', 3, undefined, '30 seconds'),
        createPrWoExercise('e7', 'High Knees', 'Jog in place, lifting your knees high towards your chest.', 3, undefined, '30 seconds'),
        createPrWoExercise('e8', 'Butt Kicks', 'Jog in place, kicking your heels up towards your buttocks.', 3, undefined, '30 seconds'),
        createPrWoExercise('e9', 'Jump Rope', 'Simulate jumping rope, or use an actual jump rope if available.', 3, undefined, '1 minute'),
        createPrWoExercise('e10', 'Step-Ups', 'Step up onto a sturdy elevated surface, alternating leading legs.', 3, 15),
      ]),
      createPrWorkout('w3', 'Flexibility Focus', 'Simple stretching routine to enhance overall flexibility and reduce muscle tension.', [
        createPrWoExercise('e11', 'Standing Hamstring Stretch', 'Bend forward at the hips, reaching towards your toes.', 3, undefined, '30 seconds per leg'),
        createPrWoExercise('e12', 'Shoulder Rolls', 'Roll your shoulders backwards in a circular motion.', 2, 10),
        createPrWoExercise('e13', 'Cat-Cow Stretch', 'On hands and knees, alternate between arching and rounding your back.', 3, 10),
        createPrWoExercise('e14', 'Seated Twist', 'Sit with legs extended, twist your torso to one side, then the other.', 2, undefined, '30 seconds per side'),
        createPrWoExercise('e15', 'Child\'s Pose', 'Kneel on the floor, sit back on your heels, and stretch your arms forward.', 1, undefined, '1 minute'),
      ]),
    ],
  },
  {
    id: '2',
    name: 'Intermediate Strength Builder',
    description: 'A program for those with some fitness experience, aimed at building strength and muscle definition.',
    createdAt: '2024-09-26T14:30:00Z',
    workouts: [
      createPrWorkout('w4', 'Upper Body Power', 'Challenging workout focusing on chest, back, and arms.', [
        createPrWoExercise('e16', 'Push-ups with Rotation', 'Perform a push-up, then rotate to a side plank position.', 3, 10),
        createPrWoExercise('e17', 'Dumbbell Rows', 'Bend over with a dumbbell in each hand, pull them up towards your chest.', 3, 12),
        createPrWoExercise('e18', 'Tricep Dips', 'Using a chair or bench, lower your body by bending your elbows.', 3, 15),
        createPrWoExercise('e19', 'Shoulder Press', 'Press dumbbells overhead from shoulder height.', 3, 10),
        createPrWoExercise('e20', 'Plank to Downward Dog', 'Alternate between plank position and downward dog yoga pose.', 3, 10),
      ]),
      createPrWorkout('w5', 'Lower Body Blast', 'Intense leg and glute exercises for building lower body strength.', [
        createPrWoExercise('e21', 'Goblet Squats', 'Hold a dumbbell or kettlebell close to your chest while performing squats.', 3, 12),
        createPrWoExercise('e22', 'Romanian Deadlifts', 'Hinge at the hips while holding dumbbells, lowering them along your legs.', 3, 10),
        createPrWoExercise('e23', 'Reverse Lunges', 'Step backwards into a lunge, alternating legs.', 3, 12),
        createPrWoExercise('e24', 'Calf Raises', 'Stand on the edge of a step, raise your heels up and down.', 3, 15),
        createPrWoExercise('e25', 'Glute Bridges', 'Lie on your back, lift your hips up towards the ceiling.', 3, 15),
      ]),
      createPrWorkout('w6', 'Core Crusher', 'Targeted ab and core workout for improved stability and definition.', [
        createPrWoExercise('e26', 'Russian Twists', 'Sit with knees bent, feet off the ground, twist torso side to side.', 3, 20),
        createPrWoExercise('e27', 'Bicycle Crunches', 'Lie on your back, alternate bringing opposite elbow to knee.', 3, 20),
        createPrWoExercise('e28', 'Plank Hold', 'Hold a forearm plank position.', 3, undefined, '45 seconds'),
        createPrWoExercise('e29', 'Leg Raises', 'Lie on your back, raise your legs up towards the ceiling.', 3, 12),
        createPrWoExercise('e30', 'Side Plank with Hip Dips', 'In side plank position, lower and raise your hip.', 3, 10),
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

const convertToMessages = (conversation: any[]): Message[] => {
  return conversation.map(msg => ({
    id: msg.id,
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));
};

const shortConversationMessages = convertToMessages(shortConversation);
const mediumConversationMessages = convertToMessages(mediumConversation);
const longerConversationMessages = convertToMessages(longerConversation);
const extendedConversationMessages = convertToMessages(extendedConversation);

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
export const syntheticUserProfile: UserProfile = {
  user_id: 2,
  first_name: "Miles",
  last_name: "Hillary",
  is_imperial: false,
  display_name: "kingmiles",
  auth_user_uuid: "660f9511-f3a2-42d5-b7b7-557655441111",
  goals: "Build muscle and improve flexibility",
  training_history: {
    years_of_experience: 2,
    preferred_activities: ["weightlifting", "running", "powerlifting"]
  }
};



export const sampleWorkouts: Workout[] = [
  {
    id: "2c82488a-b7d4-48c4-8765-a2f7ad669f40",
    name: "Full Body Workout",
    description: "Compound movements for overall strength",
    createdAt: "2024-06-15T14:00:00Z",
    exercises: [
      {
        id: "d383f1b4-90ea-4f1c-be50-f3b770689263",
        name: "Squat",
        description: "Compound lower body exercise",
        setData: [
          { reps: 5, weight: 150 },
          { reps: 5, weight: 150 }
        ],
        orderInWorkout: 1
      },
      {
        id: "8829d3eb-248f-4a53-87a1-cc04c73ccb8d",
        name: "Bench Press",
        description: "Compound upper body exercise",
        setData: [
          { reps: 5, weight: 100 },
          { reps: 5, weight: 100 }
        ],
        orderInWorkout: 2
      }
    ]
  },
  {
    id: "3d93599c-cd1f-4ca7-9a6c-e4b9c271b236",
    name: "Upper Body Push",
    description: "Focus on chest, shoulders, and triceps",
    createdAt: "2024-06-17T10:30:00Z",
    exercises: [
      {
        id: "f4a7b3c2-1d8e-4f9a-b0c1-6d5e4f3a2b1c",
        name: "Incline Dumbbell Press",
        description: "Upper chest focused press",
        setData: [
          { reps: 8, weight: 60 },
          { reps: 8, weight: 60 },
          { reps: 8, weight: 60 }
        ],
        orderInWorkout: 1
      },
      {
        id: "a1b2c3d4-e5f6-4a3b-8c7d-9e0f1a2b3c4d",
        name: "Overhead Press",
        description: "Shoulder press with barbell",
        setData: [
          { reps: 6, weight: 95 },
          { reps: 6, weight: 95 },
          { reps: 6, weight: 95 }
        ],
        orderInWorkout: 2
      }
    ]
  },
  {
    id: "5e4d3c2b-1a9b-8c7d-6f5e-4d3c2b1a9b8c",
    name: "Lower Body Power",
    description: "Explosive movements for lower body strength",
    createdAt: "2024-06-19T16:45:00Z",
    exercises: [
      {
        id: "b2c3d4e5-f6a7-5b4c-3d2e-1f9a8b7c6d5e",
        name: "Deadlift",
        description: "Compound pull movement",
        setData: [
          { reps: 5, weight: 200 },
          { reps: 5, weight: 200 },
          { reps: 5, weight: 200 }
        ],
        orderInWorkout: 1
      },
      {
        id: "c4d5e6f7-a8b9-6c5d-4e3f-2a1b0c9d8e7f",
        name: "Box Jumps",
        description: "Explosive jump onto elevated platform",
        setData: [
          { reps: 8, weight: 0 },
          { reps: 8, weight: 0 },
          { reps: 8, weight: 0 }
        ],
        orderInWorkout: 2
      }
    ]
  },
  {
    id: "7f6e5d4c-3b2a-1c9d-8e7f-6a5b4c3d2e1f",
    name: "Core and Cardio",
    description: "High-intensity core workout with cardio intervals",
    createdAt: "2024-06-21T08:15:00Z",
    exercises: [
      {
        id: "d5e6f7a8-b9c0-7d6e-5f4g-3h2i1j0k9l8",
        name: "Plank Variations",
        description: "Series of plank holds and movements",
        setData: [
          { reps: 3, weight: 0 },
          { reps: 3, weight: 0 },
          { reps: 3, weight: 0 }
        ],
        orderInWorkout: 1
      },
      {
        id: "e6f7a8b9-c0d1-8e7f-6g5h-4i3j2k1l0m9",
        name: "Burpees",
        description: "Full body cardio movement",
        setData: [
          { reps: 15, weight: 0 },
          { reps: 15, weight: 0 },
          { reps: 15, weight: 0 }
        ],
        orderInWorkout: 2
      }
    ]
  },
  {
    id: "9a8b7c6d-5e4f-3g2h-1i0j-9k8l7m6n5o4p",
    name: "Back and Biceps",
    description: "Focus on pulling movements and arm work",
    createdAt: "2024-06-23T11:00:00Z",
    exercises: [
      {
        id: "f7e6d5c4-b3a2-1m0n-9o8p-7q6r5s4t3u2",
        name: "Pull-ups",
        description: "Bodyweight back exercise",
        setData: [
          { reps: 8, weight: 0 },
          { reps: 8, weight: 0 },
          { reps: 8, weight: 0 }
        ],
        orderInWorkout: 1
      },
      {
        id: "e5d4c3b2-a1f0-9m8n-7o6p-5q4r3s2t1u0",
        name: "Barbell Rows",
        description: "Compound back exercise",
        setData: [
          { reps: 8, weight: 135 },
          { reps: 8, weight: 135 },
          { reps: 8, weight: 135 }
        ],
        orderInWorkout: 2
      }
    ]
  },
  {
    id: "1b2c3d4e-5f6g-7h8i-9j0k-1l2m3n4o5p6q",
    name: "Leg Hypertrophy",
    description: "High volume leg workout for muscle growth",
    createdAt: "2024-06-25T15:30:00Z",
    exercises: [
      {
        id: "a9b8c7d6-e5f4-3g2h-1i0j-9k8l7m6n5o4",
        name: "Leg Press",
        description: "Machine-based leg exercise",
        setData: [
          { reps: 12, weight: 300 },
          { reps: 12, weight: 300 },
          { reps: 12, weight: 300 }
        ],
        orderInWorkout: 1
      },
      {
        id: "b0c1d2e3-f4g5-6h7i-8j9k-0l1m2n3o4p5",
        name: "Romanian Deadlift",
        description: "Hamstring-focused deadlift variation",
        setData: [
          { reps: 10, weight: 165 },
          { reps: 10, weight: 165 },
          { reps: 10, weight: 165 }
        ],
        orderInWorkout: 2
      }
    ]
  },
  {
    id: "2c3d4e5f-6g7h-8i9j-0k1l-2m3n4o5p6q7r",
    name: "Shoulder Sculpt",
    description: "Isolation exercises for shoulder development",
    createdAt: "2024-06-27T09:45:00Z",
    exercises: [
      {
        id: "d1e2f3g4-h5i6-7j8k-9l0m-1n2o3p4q5r6",
        name: "Lateral Raises",
        description: "Side deltoid isolation",
        setData: [
          { reps: 15, weight: 15 },
          { reps: 15, weight: 15 },
          { reps: 15, weight: 15 }
        ],
        orderInWorkout: 1
      },
      {
        id: "e2f3g4h5-i6j7-8k9l-0m1n-2o3p4q5r6s7",
        name: "Face Pulls",
        description: "Rear deltoid and upper back exercise",
        setData: [
          { reps: 12, weight: 50 },
          { reps: 12, weight: 50 },
          { reps: 12, weight: 50 }
        ],
        orderInWorkout: 2
      }
    ]
  },
  {
    id: "3d4e5f6g-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
    name: "HIIT Cardio",
    description: "High-intensity interval training for fat burn",
    createdAt: "2024-06-29T17:00:00Z",
    exercises: [
      {
        id: "f3g4h5i6-j7k8-9l0m-1n2o-3p4q5r6s7t8",
        name: "Mountain Climbers",
        description: "Cardio exercise engaging core and legs",
        setData: [
          { reps: 30, weight: 0 },
          { reps: 30, weight: 0 },
          { reps: 30, weight: 0 }
        ],
        orderInWorkout: 1
      },
      {
        id: "g4h5i6j7-k8l9-0m1n-2o3p-4q5r6s7t8u9",
        name: "Jump Rope",
        description: "High-intensity cardio exercise",
        setData: [
          { reps: 100, weight: 0 },
          { reps: 100, weight: 0 },
          { reps: 100, weight: 0 }
        ],
        orderInWorkout: 2
      }
    ]
  },
  {
    id: "4e5f6g7h-8i9j-0k1l-2m3n-4o5p6q7r8s9t",
    name: "Arm Blast",
    description: "Focused workout for biceps and triceps",
    createdAt: "2024-07-01T13:15:00Z",
    exercises: [
      {
        id: "h5i6j7k8-l9m0-1n2o-3p4q-5r6s7t8u9v0",
        name: "EZ Bar Curls",
        description: "Bicep isolation exercise",
        setData: [
          { reps: 10, weight: 70 },
          { reps: 10, weight: 70 },
          { reps: 10, weight: 70 }
        ],
        orderInWorkout: 1
      },
      {
        id: "i6j7k8l9-m0n1-2o3p-4q5r-6s7t8u9v0w1",
        name: "Tricep Pushdowns",
        description: "Tricep isolation using cable machine",
        setData: [
          { reps: 12, weight: 60 },
          { reps: 12, weight: 60 },
          { reps: 12, weight: 60 }
        ],
        orderInWorkout: 2
      }
    ]
  },
  {
    id: "5f6g7h8i-9j0k-1l2m-3n4o-5p6q7r8s9t0u",
    name: "Functional Fitness",
    description: "Compound movements for overall fitness and strength",
    createdAt: "2024-07-03T07:30:00Z",
    exercises: [
      {
        id: "j7k8l9m0-n1o2-3p4q-5r6s-7t8u9v0w1x2",
        name: "Kettlebell Swings",
        description: "Full-body exercise with emphasis on hips and core",
        setData: [
          { reps: 20, weight: 35 },
          { reps: 20, weight: 35 },
          { reps: 20, weight: 35 }
        ],
        orderInWorkout: 1
      },
      {
        id: "k8l9m0n1-o2p3-4q5r-6s7t-8u9v0w1x2y3",
        name: "Turkish Get-ups",
        description: "Complex full-body movement",
        setData: [
          { reps: 5, weight: 25 },
          { reps: 5, weight: 25 },
          { reps: 5, weight: 25 }
        ],
        orderInWorkout: 2
      }
    ]
  }
];

export { Message, Conversation };

