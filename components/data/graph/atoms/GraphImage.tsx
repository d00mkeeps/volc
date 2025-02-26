// components/data/graph/atoms/GraphImage.tsx
import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StatusBar,
  SafeAreaView
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Ionicons } from '@expo/vector-icons';

interface GraphImageProps {
  chartUrl: string;
  width?: number;
  height?: number;
  onError?: (error: Error) => void;
  enableZoom?: boolean;
  inert?: boolean; // New prop to make image completely inert
}

export const GraphImage: React.FC<GraphImageProps> = ({
  chartUrl,
  width = 320,
  height = 240,
  onError,
  enableZoom = true,
  inert = false
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [enlarged, setEnlarged] = useState(false);

  const handleError = () => {
    const err = new Error('Failed to load graph image');
    setError(err);
    setLoading(false);
    if (onError) onError(err);
  };

  const handlePress = () => {
    if (enableZoom && !error && !inert) {
      setEnlarged(true);
    }
  };

  if (error) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="image-outline" size={48} color="#999" />
          <Text style={styles.errorText}>Could not load graph</Text>
        </View>
      </View>
    );
  }

  const imageComponent = (
    <View style={[styles.container, { width, height }]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      )}
      
      <FastImage
        source={{
          uri: chartUrl,
          priority: FastImage.priority.high,
          cache: FastImage.cacheControl.immutable
        }}
        style={[styles.image, { width, height }]}
        resizeMode={FastImage.resizeMode.contain}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={handleError}
        accessibilityLabel="Workout performance graph"
      />
    </View>
  );

  // If inert or not using zoom, just return the image without any interaction
  if (inert || !enableZoom) {
    return imageComponent;
  }

  return (
    <>
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="View larger graph"
        accessibilityHint="Double tap to see the graph in full screen"
      >
        {imageComponent}
      </TouchableOpacity>
      
      <Modal
        visible={enlarged}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEnlarged(false)}
        statusBarTranslucent
      >
        <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" barStyle="light-content" />
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setEnlarged(false)}
            accessibilityRole="button"
            accessibilityLabel="Close enlarged view"
          >
            <View style={styles.enlargedGraphContainer}>
              <FastImage
                source={{
                  uri: chartUrl,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable
                }}
                style={styles.enlargedImage}
                resizeMode={FastImage.resizeMode.contain}
              />
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setEnlarged(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  image: {
    borderRadius: 12,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.7)',
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  enlargedGraphContainer: {
    width: '100%',
    height: '70%',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  enlargedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    zIndex: 2,
    padding: 8,
  }
});