import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  isRecording: boolean;
  audioLevel: number;
}

const BAR_COUNT = 30;

export default function WaveformVisualizer({ isRecording, audioLevel }: Props) {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.1))
  ).current;

  useEffect(() => {
    if (!isRecording) {
      bars.forEach((bar) => {
        Animated.timing(bar, { toValue: 0.1, duration: 300, useNativeDriver: false }).start();
      });
      return;
    }

    const interval = setInterval(() => {
      bars.forEach((bar, i) => {
        const center = BAR_COUNT / 2;
        const distanceFromCenter = Math.abs(i - center) / center;
        const baseLevel = audioLevel * (1 - distanceFromCenter * 0.5);
        const randomized = baseLevel * (0.5 + Math.random() * 0.8);
        const clamped = Math.max(0.05, Math.min(1, randomized));
        Animated.timing(bar, { toValue: clamped, duration: 80, useNativeDriver: false }).start();
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, audioLevel]);

  return (
    <View style={styles.container}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[styles.bar, {
            height: bar.interpolate({ inputRange: [0, 1], outputRange: [3, 60] }),
            opacity: isRecording ? bar.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) : 0.2,
            backgroundColor: isRecording ? COLORS.accent : COLORS.surface2,
          }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 3, paddingHorizontal: 10,
  },
  bar: { width: 3, borderRadius: 2, backgroundColor: COLORS.accent },
});
