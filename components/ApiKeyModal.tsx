import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ visible, onClose }: Props) {
  const goToSettings = () => {
    onClose();
    router.push('/settings');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>تحتاج API Key</Text>
          <Text style={styles.desc}>
            اروح على console.groq.com وتسجّل مجاناً، ثم أضف المفتاح في الإعدادات.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={goToSettings}>
            <Text style={styles.primaryBtnText}>اذهب للإعدادات</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>إلغاء</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: '#00000088',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modal: {
    backgroundColor: COLORS.surface, borderRadius: 24, padding: 24,
    alignItems: 'center', gap: 12, width: '100%',
    borderWidth: 1, borderColor: COLORS.border,
  },
  icon: { fontSize: 40 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  desc: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  secondaryBtnText: { color: COLORS.textMuted, fontSize: 14 },
});
