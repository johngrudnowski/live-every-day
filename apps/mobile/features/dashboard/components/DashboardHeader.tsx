import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { BrandLogo, LedText, PrimaryButton, colors, radii, shadows, spacing } from '@led/design-system';

type DashboardUser = {
  name: string;
  email: string | null;
  image: string | null;
};

type DashboardHeaderProps = {
  user: DashboardUser;
  onLogoPress: () => void;
  onSignOut: () => void;
};

export function DashboardHeader({ user, onLogoPress, onSignOut }: DashboardHeaderProps) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open design system"
          hitSlop={spacing.sm}
          onPress={onLogoPress}
          style={({ pressed }) => [styles.logoButton, pressed && styles.pressed]}
        >
          <BrandLogo markSize={30} wordmarkSize="small" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open account menu"
          hitSlop={spacing.sm}
          onPress={() => setIsAccountMenuOpen((value) => !value)}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <UserAvatar user={user} />
        </Pressable>
      </View>

      {isAccountMenuOpen ? <AccountMenu user={user} onSignOut={onSignOut} /> : null}
    </View>
  );
}

function UserAvatar({ user }: { user: DashboardUser }) {
  const [didImageFail, setDidImageFail] = useState(false);

  if (user.image && !didImageFail) {
    return (
      <Image
        accessibilityLabel={`${user.name}'s Google profile photo`}
        source={{ uri: user.image }}
        onError={() => setDidImageFail(true)}
        style={styles.avatarImage}
      />
    );
  }

  return (
    <View accessibilityLabel={`Signed in as ${user.name}`} style={styles.avatarFallback}>
      <LedText variant="bodySmall" style={styles.avatarText}>
        {getInitials(user.name)}
      </LedText>
    </View>
  );
}

function AccountMenu({ user, onSignOut }: { user: DashboardUser; onSignOut: () => void }) {
  return (
    <View style={styles.accountMenu}>
      <View style={styles.accountCopy}>
        <LedText variant="subtitle">{user.name}</LedText>
        {user.email ? (
          <LedText variant="bodySmall" color="textMid">
            {user.email}
          </LedText>
        ) : null}
      </View>
      <PrimaryButton label="Log out" variant="secondary" fullWidth onPress={onSignOut} />
    </View>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.canvas,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: colors.canvas,
  },
  logoButton: {
    borderRadius: radii.lg,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: {
    color: colors.midnight,
    fontFamily: 'DMSans_600SemiBold',
  },
  accountMenu: {
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    backgroundColor: colors.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  accountCopy: {
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.72,
  },
});
