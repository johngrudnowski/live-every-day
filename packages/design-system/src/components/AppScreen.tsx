import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewProps } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type AppScreenProps = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
  surface?: 'canvas' | 'midnight' | 'surface';
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
};

export function AppScreen({
  children,
  scroll = false,
  padded = true,
  surface = 'canvas',
  style,
  contentContainerStyle,
  ...props
}: AppScreenProps) {
  const baseStyle = [styles.container, { backgroundColor: colors[surface] }, padded && styles.padded, style];

  if (scroll) {
    return (
      <ScrollView
        {...props}
        style={[styles.container, { backgroundColor: colors[surface] }, style]}
        contentContainerStyle={[padded && styles.padded, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View {...props} style={baseStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
});
