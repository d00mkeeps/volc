import React, { memo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Message } from '@/types';
import { GraphImage } from '../../data/graph/atoms/GraphImage';
import { useAttachments } from '@/context/ChatAttachmentContext';
import { WorkoutDataBundle, WorkoutWithConversation, CompleteWorkout, SetInput } from '@/types/workout';
import { WorkoutDataModal } from '../../data/table/WorkoutDataModal';
import WorkoutDetailModal from '@/components/workout/organisms/WorkoutDetailModal';
import { convertToCompleteWorkout } from '@/utils/workout';

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  previousMessage?: Message;
}

const MessageItem: React.FC<MessageItemProps> = memo(({ 
  message, 
  isStreaming = false, 
  previousMessage
 }) => {
  const { getGraphBundlesByConversation, getWorkoutsByConversation } = useAttachments();
  const [matchingBundle, setMatchingBundle] = useState<WorkoutDataBundle | null>(null);
  const [matchingWorkout, setMatchingWorkout] = useState<WorkoutWithConversation | null>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [workoutDataModalVisible, setWorkoutDataModalVisible] = useState(false);
  const [workoutDetailModalVisible, setWorkoutDetailModalVisible] = useState(false);
  
  // Determine if this message has an associated graph or workout
  useEffect(() => {
    // Only assistant messages can have associated data and only if there's a previous user message
    if (message.sender === 'assistant' && previousMessage?.sender === 'user') {
      // Check for graph bundles
      const bundles = getGraphBundlesByConversation(message.conversation_id);
      
      if (bundles.length) {
        const match = bundles.find(bundle => 
          bundle.original_query && 
          previousMessage.content.includes(bundle.original_query)
        );
        
        if (match) {
          setMatchingBundle(match);
          setIsLoadingGraph(false);
        }
      }
      
      // Check for workouts - get the most recent workout for this conversation
      const workouts = getWorkoutsByConversation(message.conversation_id);
    
      if (workouts.length) {
        // Get the most recent workout (should be the first one given our sort)
        const recentWorkout = workouts[0];
        
        // Set as matching workout if it's within a reasonable time window of this message
        // Add null check for timestamp
        if (recentWorkout) {
          const workoutTime = new Date(recentWorkout.created_at).getTime();
          
          // Check if message has a valid timestamp
          if (message.timestamp && typeof message.timestamp.getTime === 'function') {
            const messageTime = message.timestamp.getTime();
            
            // If workout was created within 10 seconds of message
            if (Math.abs(workoutTime - messageTime) < 10000) {
              setMatchingWorkout(recentWorkout);
            }
          } else {
            // If no valid timestamp, match the most recent workout anyway
            setMatchingWorkout(recentWorkout);
          }
        }
      }
    }
  }, [message, previousMessage, getGraphBundlesByConversation, getWorkoutsByConversation]);
  

const completeWorkout = matchingWorkout ? convertToCompleteWorkout(matchingWorkout) : null;  const exerciseCount = completeWorkout?.workout_exercises.length || 0;
  
  return (
    <View style={styles.messageWrapper}>
      <View style={[
        styles.container,
        message.sender === 'user' ? styles.userMessage : styles.assistantMessage,
        isStreaming && styles.streamingMessage
      ]}>
        {/* Graph at the top of assistant message */}
        {message.sender === 'assistant' && matchingBundle?.chart_url && (
          <View style={styles.graphContainer}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setWorkoutDataModalVisible(true)}
            >
              <GraphImage 
                chartUrl={matchingBundle.chart_url}
                width={280}
                height={200}
                inert={true}
              />
              <View style={styles.graphOverlay}>
                <Text style={styles.graphOverlayText}>Tap for details</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Workout summary at the top of assistant message */}
        {message.sender === 'assistant' && matchingWorkout && (
          <View style={styles.workoutContainer}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setWorkoutDetailModalVisible(true)}
              style={styles.workoutSummary}
            >
              <Text style={styles.workoutTitle}>{matchingWorkout.name}</Text>
              <Text style={styles.workoutSubtitle}>
                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              </Text>
              <View style={styles.workoutOverlay}>
                <Text style={styles.workoutOverlayText}>Tap to view workout</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Message text content */}
        <Text style={[
          styles.text,
          message.sender === 'user' ? styles.userText : styles.assistantText
        ]}>
          {message.content}
          {isStreaming && '...'}
        </Text>
        
        {/* Loading indicator for graphs */}
        {isLoadingGraph && (
          <View style={styles.graphLoadingContainer}>
            <ActivityIndicator 
              color={message.sender === 'user' ? '#041402' : '#def7dc'} 
              size="small"
            />
            <Text style={[
              styles.graphLoadingText,
              message.sender === 'user' ? styles.userText : styles.assistantText
            ]}>
              Preparing workout visualization...
            </Text>
          </View>
        )}
      </View>
      
      {/* Workout data modal */}
      <WorkoutDataModal
        visible={workoutDataModalVisible}
        onClose={() => setWorkoutDataModalVisible(false)}
        bundle={matchingBundle}
      />
      
      {/* Workout detail modal */}
      {completeWorkout && (
        <WorkoutDetailModal
          isVisible={workoutDetailModalVisible}
          workout={completeWorkout}
          onClose={() => setWorkoutDetailModalVisible(false)}
          onSave={async () => Promise.resolve()} // Return a Promise that resolves immediately
        />
      )}
    </View>
  );
});
const styles = StyleSheet.create({
  messageWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  container: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#b2f7aa',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#041402',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#041402'
  },
  assistantText: {
    color: '#def7dc',
  },
  streamingMessage: {
    opacity: 0.7
  },
  graphContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  graphLoadingContainer: {
    marginTop: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  graphLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  graphOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
  },
  graphOverlayText: {
    color: '#fff',
    fontSize: 12,
  },
  // New styles for workout display
  workoutContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
  },
  workoutSummary: {
    backgroundColor: '#272d27',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8cd884',
    position: 'relative',
  },
  workoutTitle: {
    color: '#8cd884',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workoutSubtitle: {
    color: '#def7dc',
    fontSize: 14,
    marginTop: 4,
  },
  workoutOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  workoutOverlayText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default MessageItem;