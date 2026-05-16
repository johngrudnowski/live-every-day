import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@led/design-system';

type ScreenHeaderNavRowProps = {
  left?: ReactNode;
  title: ReactNode;
  right?: ReactNode;
};

/**
 * Top app bar row: optional leading action, title centered on the full width,
 * optional trailing content. Side slots stay tappable above the title overlay.
 */
export function ScreenHeaderNavRow({ left, title, right }: ScreenHeaderNavRowProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.sidesRow}>
        <View style={[styles.side, styles.sideStart]}>{left}</View>
        <View style={[styles.side, styles.sideEnd]}>{right}</View>
      </View>
      <View style={styles.titleOverlay} pointerEvents="none">
        {title}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 44,
    justifyContent: 'center',
  },
  sidesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  side: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  sideStart: {
    alignItems: 'flex-start',
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
  titleOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.huge,
  },
});
