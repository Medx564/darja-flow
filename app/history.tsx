import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTranscriptionHistory } from '../hooks/useTranscriptionHistory';
import { COLORS } from '../constants/theme';

export default function HistoryScreen() {
  const { history, removeEntry, clearAll } = useTranscriptionHistory();

  const handleCopy = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('مسح', 'تمسح هذا النص؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'مسح', style: 'destructive', onPress: () => removeEntry(id) },
    ]);
  }, [removeEntry]);

  const handleClearAll = () => {
    Alert.alert('مسح الكل', 'تمسح كل السجل؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'مسح الكل', style: 'destructive', onPress: clearAll },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardText}>{item.text}</Text>
      <Text style={styles.cardDate}>
        {new Date(item.timestamp).toLocaleString('ar-TN')}
      </Text>
      <View style={styles.cardActions}>
        <Pressable style={styles.copyBtn} onPress={() => handleCopy(item.text)}>
          <Text style={styles.copyBtnText}>📋 نسخ</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtnText}>🗑</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>سجل التسجيلات</Text>
        {history.length > 0 ? (
          <Pressable onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>مسح الكل</Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>السجل فاضي</Text>
          <Text style={styles.emptySubtitle}>تسجيلاتك كي تبدأ تظهر هنا</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: COLORS.text },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  clearBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#ff000020', borderRadius: 10,
  },
  clearBtnText: { color: COLORS.recordingRed, fontSize: 12, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 8,
  },
  cardText: {
    fontSize: 16, color: COLORS.text, lineHeight: 26,
    textAlign: 'right', writingDirection: 'rtl',
  },
  cardDate: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },
  cardActions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 8,
    paddingTop: 4, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  copyBtn: {
    backgroundColor: COLORS.surface2, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  copyBtnText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: '#ff000015', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#ff000030',
  },
  deleteBtnText: { color: COLORS.recordingRed, fontSize: 12 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted },
});
