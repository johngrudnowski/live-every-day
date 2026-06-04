import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { LogoMark } from '@led/design-system';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type AnimatedLogoMarkProps = {
  size?: number;
  durationMs?: number;
};

export function AnimatedLogoMark({ size = 116, durationMs = 8000 }: AnimatedLogoMarkProps) {
  const reduceMotion = useReducedMotion();
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

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
