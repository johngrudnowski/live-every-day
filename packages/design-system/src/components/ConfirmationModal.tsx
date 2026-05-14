import { Modal, Pressable, StyleSheet, View, type ModalProps } from 'react-native';

import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';
import { LedText } from './LedText';
import { PrimaryButton } from './PrimaryButton';

type ConfirmationModalProps = Pick<ModalProps, 'visible'> & {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'dark' | 'secondary' | 'danger';
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isPending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={cancelLabel}
          accessibilityRole="button"
          disabled={isPending}
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.copy}>
            <LedText variant="title">{title}</LedText>
            <LedText variant="body" color="predawn">
              {description}
            </LedText>
            {error ? (
              <View style={styles.error}>
                <LedText variant="bodySmall" color="flagHigh">
                  {error}
                </LedText>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={cancelLabel}
              variant="secondary"
              disabled={isPending}
              onPress={onCancel}
              style={styles.actionButton}
            />
            <PrimaryButton
              label={isPending ? 'Working...' : confirmLabel}
              variant={confirmVariant}
              disabled={isPending}
              onPress={onConfirm}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 40, 48, 0.56)',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.xl,
  },
  copy: {
    gap: spacing.sm,
  },
  error: {
    borderWidth: 1,
    borderColor: colors.flagHigh,
    borderRadius: radii.lg,
    backgroundColor: colors.flagHighBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexGrow: 1,
  },
});
