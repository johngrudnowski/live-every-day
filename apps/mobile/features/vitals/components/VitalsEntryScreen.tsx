import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, LedText, PrimaryButton, colors, radii, spacing } from '@led/design-system';
import { ScreenHeaderChevronLink, ScreenHeaderNavRow } from '@/components/screen-header';
import { LoadingScreen } from '@/features/launch/components/LoadingScreen';
import { useLatestVitalReadingQuery, useSaveVitalReadingMutation } from '../api/vitals-queries';

const defaultReading = {
  systolicMmHg: 132,
  diastolicMmHg: 84,
  pulseBpm: 72,
  temperatureF: 98.4,
  oxygenSaturationPercent: 97,
};

export function VitalsEntryScreen() {
  const latestQuery = useLatestVitalReadingQuery();
  const saveMutation = useSaveVitalReadingMutation();
  const initializedFromLatestRef = useRef(false);
  const [systolicMmHg, setSystolicMmHg] = useState(defaultReading.systolicMmHg);
  const [diastolicMmHg, setDiastolicMmHg] = useState(defaultReading.diastolicMmHg);
  const [pulseBpm, setPulseBpm] = useState(defaultReading.pulseBpm);
  const [temperatureF, setTemperatureF] = useState(defaultReading.temperatureF);
  const [oxygenSaturationPercent, setOxygenSaturationPercent] = useState(
    defaultReading.oxygenSaturationPercent,
  );

  useEffect(() => {
    if (initializedFromLatestRef.current) {
      return;
    }

    const latestReading = latestQuery.data?.latestReading;
    if (!latestReading) {
      return;
    }

    initializedFromLatestRef.current = true;
    setSystolicMmHg(latestReading.systolicMmHg ?? defaultReading.systolicMmHg);
    setDiastolicMmHg(latestReading.diastolicMmHg ?? defaultReading.diastolicMmHg);
    setPulseBpm(latestReading.pulseBpm ?? defaultReading.pulseBpm);
    setTemperatureF(latestReading.temperatureF ?? defaultReading.temperatureF);
    setOxygenSaturationPercent(
      latestReading.oxygenSaturationPercent ?? defaultReading.oxygenSaturationPercent,
    );
  }, [latestQuery.data?.latestReading]);

  if (latestQuery.isPending) {
    return <LoadingScreen message="Loading vitals" />;
  }

  function saveReading() {
    saveMutation.mutate(
      {
        data: {
          systolicMmHg,
          diastolicMmHg,
          pulseBpm,
          temperatureF,
          oxygenSaturationPercent,
        },
      },
      {
        onSuccess: () => {
          router.replace('/home');
        },
        onError: (error) => {
          Alert.alert('Unable to save reading', getErrorMessage(error));
        },
      },
    );
  }

  return (
    <AppScreen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeaderNavRow
          left={
            <ScreenHeaderChevronLink label="Home" onPress={() => router.replace('/home')} />
          }
          title={
            <LedText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
              Log vitals
            </LedText>
          }
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <LedText variant="displayMedium" style={styles.title}>
            Log your reading.
          </LedText>
          <LedText variant="body" color="textMid" style={styles.subtitle}>
            Tap plus or minus to adjust. We&apos;ll save it with the time you logged.
          </LedText>
        </View>

        <BloodPressureField
          diastolic={diastolicMmHg}
          onDiastolicChange={(nextValue) => setDiastolicMmHg(clamp(nextValue, 30, 160))}
          onSystolicChange={(nextValue) => setSystolicMmHg(clamp(nextValue, 50, 260))}
          systolic={systolicMmHg}
        />
        <StepperField
          label="Pulse (bpm)"
          max={240}
          min={20}
          onChange={setPulseBpm}
          step={1}
          value={pulseBpm}
        />
        <StepperField
          label="Temperature (F)"
          max={110}
          min={85}
          onChange={(nextValue) => setTemperatureF(roundToTenths(nextValue))}
          step={0.1}
          value={temperatureF}
          valueFormatter={(value) => value.toFixed(1)}
        />
        <StepperField
          label="Oxygen saturation (%)"
          max={100}
          min={50}
          onChange={setOxygenSaturationPercent}
          step={1}
          value={oxygenSaturationPercent}
        />

        <View style={styles.actions}>
          <PrimaryButton
            disabled={saveMutation.isPending}
            label={saveMutation.isPending ? 'Saving...' : 'Save reading'}
            fullWidth
            onPress={saveReading}
          />
          <PrimaryButton
            label="Connect my device"
            variant="secondary"
            fullWidth
            onPress={() =>
              Alert.alert(
                'Device connection coming soon',
                'Withings, Omron, and other device sync is not available yet.',
              )
            }
          />
          <LedText variant="bodySmall" color="predawn" align="center" style={styles.deviceHint}>
            Withings, Omron, and others can sync readings automatically.
          </LedText>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function BloodPressureField({
  diastolic,
  onDiastolicChange,
  onSystolicChange,
  systolic,
}: {
  diastolic: number;
  onDiastolicChange: (value: number) => void;
  onSystolicChange: (value: number) => void;
  systolic: number;
}) {
  return (
    <View style={styles.field}>
      <LedText variant="label" color="predawn">
        Blood pressure (mmHg)
      </LedText>
      <View style={styles.bloodPressureRow}>
        <StepperShell
          onDecrement={() => onSystolicChange(systolic - 1)}
          onIncrement={() => onSystolicChange(systolic + 1)}
          value={String(systolic)}
        />
        <LedText style={styles.slash}>/</LedText>
        <StepperShell
          onDecrement={() => onDiastolicChange(diastolic - 1)}
          onIncrement={() => onDiastolicChange(diastolic + 1)}
          value={String(diastolic)}
        />
      </View>
      <View style={styles.bpLabels}>
        <LedText variant="bodySmall" color="textLite">
          Systolic
        </LedText>
        <LedText variant="bodySmall" color="textLite">
          Diastolic
        </LedText>
      </View>
    </View>
  );
}

function StepperField({
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueFormatter = String,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
  valueFormatter?: (value: number) => string;
}) {
  return (
    <View style={styles.field}>
      <LedText variant="label" color="predawn">
        {label}
      </LedText>
      <StepperShell
        onDecrement={() => onChange(clamp(roundToTenths(value - step), min, max))}
        onIncrement={() => onChange(clamp(roundToTenths(value + step), min, max))}
        value={valueFormatter(value)}
      />
    </View>
  );
}

function StepperShell({
  onDecrement,
  onIncrement,
  value,
}: {
  onDecrement: () => void;
  onIncrement: () => void;
  value: string;
}) {
  return (
    <View style={styles.stepper}>
      <IconButton label="Decrease" name="minus" onPress={onDecrement} />
      <LedText style={styles.stepperValue}>{value}</LedText>
      <IconButton label="Increase" name="plus" onPress={onIncrement} />
    </View>
  );
}

function IconButton({
  label,
  name,
  onPress,
}: {
  label: string;
  name: 'minus' | 'plus';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <FontAwesome name={name} size={16} color={colors.midnight} />
    </Pressable>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundToTenths(value: number) {
  return Math.round(value * 10) / 10;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  intro: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    lineHeight: 21,
  },
  field: {
    gap: spacing.sm,
  },
  bloodPressureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  slash: {
    color: colors.textLite,
    fontFamily: 'Raleway_300Light',
    fontSize: 24,
    lineHeight: 28,
  },
  bpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  stepper: {
    flex: 1,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.white,
    padding: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  stepperValue: {
    flex: 1,
    color: colors.midnight,
    fontFamily: 'Raleway_300Light',
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
    marginTop: 'auto',
    paddingTop: spacing.md,
  },
  deviceHint: {
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.72,
  },
});
