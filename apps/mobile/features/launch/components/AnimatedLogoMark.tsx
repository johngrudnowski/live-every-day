import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { LogoMark } from '@led/design-system';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type AnimatedLogoMarkProps = {
  size?: number;
  durationMs?: number;
};

export function AnimatedLogoMark({ size = 82, durationMs = 10000 }: AnimatedLogoMarkProps) {
  const reduceMotion = useReduceMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(rotation);
      rotation.value = 0;
      return;
    }

    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, {
        duration: durationMs,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => cancelAnimation(rotation);
  }, [durationMs, reduceMotion, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.mark, { width: size, height: size }, animatedStyle]}>
      <LogoMark size={size} />
    </Animated.View>
  );
}

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((isEnabled) => {
        if (isMounted) {
          setReduceMotion(isEnabled);
        }
      })
      .catch(() => {
        if (isMounted) {
          setReduceMotion(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
