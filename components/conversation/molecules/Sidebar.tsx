// components/molecules/Sidebar.tsx
import { Animated, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { Title } from '../../public/atoms/Title';
import { ToggleSwitch } from '../../public/atoms/ToggleSwitch';

interface SidebarProps {
  isOpen: boolean;
  conversationId: string;
  detailedAnalysis: boolean;
  onToggleAnalysis: (value: boolean) => void;
}

const SIDEBAR_WIDTH = 300;

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  conversationId,
  detailedAnalysis,
  onToggleAnalysis,
}) => {
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 0 : SIDEBAR_WIDTH,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isOpen, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.section}>
          <Title 
            title="Conversation Data"
            subtitle="Analysis and attachments"
            variant="medium"
          />
        </View>

        <View style={styles.section}>
          <Title 
            title="Options"
            variant="small"
          />
          <ToggleSwitch
            label="Detailed Analysis"
            value={detailedAnalysis}
            onValueChange={onToggleAnalysis}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#2a332a',
    borderLeftWidth: 1,
    borderLeftColor: '#3a433a',
    zIndex: 100,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#3a433a',
    paddingBottom: 16,
  },
});