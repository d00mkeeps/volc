// components/atoms/Title.tsx
import { StyleSheet, Text, View } from 'react-native';

interface TitleProps {
  title: string;
  subtitle?: string;
  variant?: 'large' | 'medium' | 'small';
}

export const Title: React.FC<TitleProps> = ({ 
  title, 
  subtitle, 
  variant = 'medium' 
}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, styles[`${variant}Title`]]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, styles[`${variant}Subtitle`]]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#a0aba0',
    fontWeight: '400',
  },
  largeTitle: {
    fontSize: 24,
  },
  mediumTitle: {
    fontSize: 20,
  },
  smallTitle: {
    fontSize: 16,
  },
  largeSubtitle: {
    fontSize: 16,
  },
  mediumSubtitle: {
    fontSize: 14,
  },
  smallSubtitle: {
    fontSize: 12,
  },
});