// Modified MessageItem.tsx
import React, { memo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Message } from '@/types';
import { GraphImage } from '../../data/graph/atoms/GraphImage';
import { useAttachments } from '@/context/ChatAttachmentContext';
import { WorkoutDataBundle } from '@/types/workout';
import { WorkoutDataModal } from '../../data/table/WorkoutDataModal';

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
  const { getGraphBundlesByConversation } = useAttachments();
  const [matchingBundle, setMatchingBundle] = useState<WorkoutDataBundle | null>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  
  // Determine if this message should show a graph based on previous message
  useEffect(() => {
    // Only assistant messages can have associated graphs and only if there's a previous user message
    if (message.sender === 'assistant' && previousMessage?.sender === 'user') {
      const bundles = getGraphBundlesByConversation(message.conversation_id);

      console.log(`Found ${bundles.length} bundles for conversation:`, message.conversation_id);
      
      // If no bundles exist yet, we don't need to do anything
      if (!bundles.length) return;
      
      // Find a bundle where the original query matches the previous message's content
      const match = bundles.find(bundle => 
        bundle.original_query && 
        previousMessage.content.includes(bundle.original_query)
      );
      
      if (match) {
        console.log('Found matching bundle:', match.bundle_id);
        console.log('Bundle structure:', match);
        console.log('workout_data type:', typeof match.workout_data);
        console.log('workout_data keys:', Object.keys(match.workout_data || {}));
        
        setMatchingBundle(match);
        setIsLoadingGraph(false);
      } 
    }
  }, [message, previousMessage, getGraphBundlesByConversation]);
  
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
              onPress={() => setWorkoutModalVisible(true)}
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
        visible={workoutModalVisible}
        onClose={() => setWorkoutModalVisible(false)}
        bundle={matchingBundle}
      />
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
  }
});

export default MessageItem;