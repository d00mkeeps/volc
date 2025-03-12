import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import WelcomeModal from '@/components/welcomeModal/WelcomeModal';
import Toast from 'react-native-toast-message';
import ConversationList from '@/components/conversation/organisms/ConversationList';
import {useMessage} from '@/context/MessageContext'
import { ChatConfigKey } from '@/constants/ChatConfigMaps';
import { Ionicons } from '@expo/vector-icons';
import WorkoutCreateModal from '@/components/workout/organisms/WorkoutCreateModal';
import { useWorkout } from '@/context/WorkoutContext';
import { CompleteWorkout, WorkoutInput } from '@/types/workout';
import { useAuth } from '@/context/AuthContext';
export default function HomeScreen() {
  const { user } = useAuth(); // Get authenticated user
  const { workouts, createWorkout } = useWorkout();
  const { startNewConversation, currentConversationId } = useMessage();
  const [openWelcomeModal, setOpenWelcomeModal] = useState(false);
  const [openWorkoutModal, setOpenWorkoutModal] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams<{ openWelcomeModal?: string }>();
  
  useEffect(() => {
    if (params.openWelcomeModal === 'true') {
      setOpenWelcomeModal(true);
      // Reset the parameter after opening the modal
      router.setParams({ openWelcomeModal: undefined });
    }
  }, [params.openWelcomeModal]);

  const handleWorkoutPress = () => {
    setOpenWorkoutModal(true);
  };

  const templates: CompleteWorkout[] = []
  const handleSaveWorkout = async (workout: CompleteWorkout) => {
    const workoutInput: WorkoutInput = {
      name: workout.name,
      description: workout.notes,
      exercises: workout.workout_exercises.map(exercise => ({
        exercise_name: exercise.name,
        order_in_workout: exercise.order_index,
        weight_unit: exercise.weight_unit || 'kg',
        distance_unit: exercise.distance_unit || 'm',
        set_data: {
          sets: exercise.workout_exercise_sets.map(set => ({
            weight: set.weight || undefined,
            reps: set.reps || undefined,
            rpe: set.rpe || undefined,
            distance: set.distance || undefined,
            duration: set.duration ? parseInt(set.duration) : undefined,
          }))
        }
      }))
    };

    if (!user?.id) {
      Toast.show({
        type: 'error',
        text1: 'Authentication required',
        text2: 'Please sign in to create a workout'
      });
      return;
    }
    
    await createWorkout(user.id, workoutInput);

    
  };

  const handleAnalysisPress = () => {
    console.log("Not yet implemented! Think about starting a workout analysis conversation here.");
  };
  

  const handleConversationPress = (id: string) => {
    console.log(`Routing to conversation ${id}`);
    router.push({
      pathname: "/conversation/[id]",
      params: { id }
    });
  };
  
  const handleNewMessage = async (message: string, config: ChatConfigKey) => {
    console.log('📮 handleNewMessage called:', { message });
    
    if (isCreatingConversation) {
      console.log('⚠️ Already creating conversation, returning');
      return;
    }
    
    try {
      setIsCreatingConversation(true)
      const newConversationId = await startNewConversation(message, config);
      console.log('🚗 Routing to new conversation:', newConversationId);

      router.push({
        pathname: "/conversation/[id]",
        params: { 
          id: newConversationId, 
        }
      });
      
    } catch (error) {
      console.error('❌ handleNewMessage failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to start conversation',
        text2: 'Please try again'
      });
    } finally {
      setTimeout(() => {
        setIsCreatingConversation(false);
      }, 2000); // Prevent rapid re-submissions
    }
  };
  
   
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Chats</Text>
      <Text style={styles.subtitle}>Send a message to start a new conversation</Text>
      <View style={styles.conversationContainer}>
        <ConversationList onConversationPress={handleConversationPress} />
      </View>
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={handleWorkoutPress}
        >
          <Ionicons name="fitness-outline" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Workout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={handleAnalysisPress}
        >
          <Ionicons name="bar-chart-outline" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Analysis</Text>
        </TouchableOpacity>
      </View>
      {/* Modals */}
      <WelcomeModal 
        isVisible={openWelcomeModal} 
        onClose={() => setOpenWelcomeModal(false)} 
      />
      
      <WorkoutCreateModal
        isVisible={openWorkoutModal}
        onClose={() => setOpenWorkoutModal(false)}
        templates={templates}
        onSave={handleSaveWorkout}
      />
      
      <Toast />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#ddd',
    paddingLeft: 18,
    paddingBottom: 4
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  conversationContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "light",
    paddingLeft: 18,
    paddingBottom: 10,
    color: '#ddd'
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopColor: '#446044',
    borderTopWidth: 2
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a854a',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    flexDirection: 'row',
  },
  navButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});