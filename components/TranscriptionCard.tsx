import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  text: string;
  timestamp?: number;
}

export default function TranscriptionCard({ text, timestamp }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{text}</Text>
      {timestamp && (
        <Text style={styles.time}>
          {new Date(timestamp).toLocaleTimeString('ar-TN')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 6,
  },
  text: {
    fontSize: 17, color: COLORS.text, lineHeight: 28,
    textAlign: 'right', writingDirection: 'rtl',
  },
  time: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },
});
