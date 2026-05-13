import { StyleSheet, View } from 'react-native';
import { LedText, colors, radii, spacing } from '@led/design-system';

const items = [
  {
    icon: '⏱️',
    title: '5 to 10 minutes',
    subtitle: "Take your time - there's no rushing this.",
  },
  {
    icon: '📋',
    title: 'MPN-10 anchor + optional deeper',
    subtitle: '10 anchor questions, plus the option to add more if you want.',
  },
  {
    icon: '🔒',
    title: 'This data is yours',
    subtitle: 'Never shared without your explicit permission.',
  },
];

export function WhatToExpect() {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleWrap}>
        <LedText variant="label" color="predawn">
          What to expect
        </LedText>
      </View>
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.title} style={styles.item}>
            <View style={styles.iconWrap}>
              <LedText style={styles.icon}>{item.icon}</LedText>
            </View>
            <View style={styles.itemCopy}>
              <LedText variant="body" style={styles.itemTitle}>
                {item.title}
              </LedText>
              <LedText variant="bodySmall" color="predawn">
                {item.subtitle}
              </LedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  list: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.selectedBg,
  },
  icon: {
    fontSize: 16,
    lineHeight: 19,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  itemTitle: {
    color: colors.midnight,
    fontFamily: 'DMSans_500Medium',
  },
  cardTitleWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
});
