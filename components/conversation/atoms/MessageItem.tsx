import React, { memo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Message } from '@/types';
import { GraphImage } from '../../data/graph/atoms/GraphImage';
import { useAttachments } from '@/context/ChatAttachmentContext';
import { WorkoutDataBundle } from '@/types/workout';

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
  const [enlargedGraph, setEnlargedGraph] = useState(false);
  
  // Determine if this message should show a graph based on previous message
  useEffect(() => {
    // Only assistant messages can have associated graphs and only if there's a previous user message
    if (message.sender === 'assistant' && previousMessage?.sender === 'user') {
      const bundles = getGraphBundlesByConversation(message.conversation_id);
      
      // If no bundles exist yet, we don't need to do anything
      if (!bundles.length) return;
      
      // Find a bundle where the original query matches the previous message's content
      const match = bundles.find(bundle => 
        bundle.original_query && 
        previousMessage.content.includes(bundle.original_query)
      );
      
      if (match) {
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
        
        {/* Graph display */}
        {matchingBundle?.chart_url && (
          <View style={styles.graphContainer}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setEnlargedGraph(true)}
            >
              <GraphImage 
                chartUrl={matchingBundle.chart_url}
                width={280}
                height={200}
              />
              <View style={styles.graphOverlay}>
                <Text style={styles.graphOverlayText}>Tap to enlarge</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Enlarged graph modal */}
      <Modal
        visible={enlargedGraph}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEnlargedGraph(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setEnlargedGraph(false)}
        >
          <View style={styles.enlargedGraphContainer}>
            <GraphImage
              chartUrl={matchingBundle?.chart_url || ''}
              width={340}
              height={260}
            />
            <Text style={styles.enlargedGraphTitle}>
              {matchingBundle?.original_query || 'Workout Analysis'}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginTop: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedGraphContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  enlargedGraphTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#041402',
    textAlign: 'center',
  }
});

export default MessageItem;