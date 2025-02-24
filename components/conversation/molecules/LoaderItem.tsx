import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import PulsingLoader from '@/components/public/molecules/PulsingLoader';

const LoaderItem = () => {
    useEffect(() => {
        console.log('🔄 LoaderItem mounted');
        return () => console.log('🔄 LoaderItem unmounted');
      }, []);
    
      console.log('🔄 LoaderItem render');
  return (
    <View style={styles.messageWrapper}>
      <View style={[styles.container, styles.assistantMessage]}>
        <View style={styles.loaderContainer}>
          <PulsingLoader size={27} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  container: {
    width: 53,
    padding: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#041402',
  },
  loaderContainer: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',

  }
});

export default LoaderItem;