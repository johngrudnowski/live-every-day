import { LedText, colors, radii, spacing } from '@led/design-system';
import { StyleSheet, View } from 'react-native';
import { SectionHeader } from './SectionHeader';

const labValues = [
  {
    label: 'Platelets',
    unit: 'x10^3/uL',
    value: '842',
    status: 'High',
    statusTone: 'high',
  },
  {
    label: 'WBC',
    unit: 'x10^3/uL',
    value: '10.4',
    status: 'Steady',
    statusTone: 'neutral',
  },
  {
    label: 'Hemoglobin',
    unit: 'g/dL',
    value: '14.6',
    status: 'Normal',
    statusTone: 'ok',
  },
] as const;

export function LabValuesSection() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Lab values - CBC" />
      <View style={styles.card}>
        {labValues.map((item, index) => (
          <View
            key={item.label}
            style={[styles.row, index < labValues.length - 1 && styles.rowBorder]}
          >
            <View style={styles.copy}>
              <LedText variant="subtitle" style={styles.label}>
                {item.label}
              </LedText>
              <LedText variant="bodySmall" color="predawn">
                {item.unit}
              </LedText>
            </View>
            <View style={styles.valueWrap}>
              <LedText style={[styles.value, item.statusTone === 'high' && styles.highValue]}>
                {item.value}
              </LedText>
              <View style={[styles.pill, getPillStyle(item.statusTone)]}>
                <LedText
                  variant="bodySmall"
                  style={[styles.pillText, getPillTextStyle(item.statusTone)]}
                >
                  {item.status}
                </LedText>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function getPillStyle(tone: (typeof labValues)[number]['statusTone']) {
  if (tone === 'high') {
    return styles.highPill;
  }

  if (tone === 'ok') {
    return styles.okPill;
  }

  return styles.neutralPill;
}

function getPillTextStyle(tone: (typeof labValues)[number]['statusTone']) {
  if (tone === 'high') {
    return styles.highText;
  }

  if (tone === 'ok') {
    return styles.okText;
  }

  return styles.neutralText;
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  copy: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    lineHeight: 19,
  },
  valueWrap: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  value: {
    color: colors.midnight,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 18,
    lineHeight: 22,
  },
  highValue: {
    color: colors.flagHigh,
  },
  pill: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  highPill: {
    backgroundColor: colors.flagHighBg,
  },
  okPill: {
    backgroundColor: colors.flagOkBg,
  },
  neutralPill: {
    backgroundColor: colors.surface,
  },
  pillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    lineHeight: 13,
  },
  highText: {
    color: colors.flagHigh,
  },
  okText: {
    color: '#1A6040',
  },
  neutralText: {
    color: colors.predawn,
  },
});
