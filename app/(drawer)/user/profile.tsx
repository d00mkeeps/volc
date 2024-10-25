// screens/ProfileDisplayScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LazyProfileDisplay } from '@/components/profile/organisms/LazyProfileDisplay';
import { SignOutButton } from '@/components/auth/atoms/SignOutButton';

import { useUser } from '@/context/UserContext';

const MAX_RENDER_RETRIES = 3;
const RENDER_RETRY_DELAY = 1000;

export default function ProfileDisplayScreen() {
  const { userProfile, loading, refreshProfile, error } = useUser();
  const [renderAttempts, setRenderAttempts] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const attemptInitialLoad = async () => {
      if (!userProfile && !loading && renderAttempts < MAX_RENDER_RETRIES) {
        try {
          await new Promise(resolve => setTimeout(resolve, RENDER_RETRY_DELAY));
          await refreshProfile();
          setRenderAttempts(prev => prev + 1);
        } catch (err) {
          console.error('Profile load attempt failed:', err);
        }
      } else if (userProfile) {
        setIsInitialLoad(false);
      }
    };

    attemptInitialLoad();
  }, [userProfile, loading, renderAttempts, refreshProfile]);

  const handleRefresh = async () => {
    setRenderAttempts(0);
    await refreshProfile();
  };

  const handleRetry = () => {
    setRenderAttempts(0);
    handleRefresh();
  };

  if (error && !isInitialLoad) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>
            Unable to load your profile
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && !isInitialLoad}
            onRefresh={handleRefresh}
            tintColor="#8cd884"
          />
        }
      >
        <LazyProfileDisplay />
        <View style={styles.buttonContainer}>
          <SignOutButton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  buttonContainer: {
    padding: 16,
    marginTop: 'auto',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8cd884',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: 'bold',
  },
});