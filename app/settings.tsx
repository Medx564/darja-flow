import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

const GROQ_KEY = '@darja_groq_key';
const AUTO_CORRECT_KEY = '@darja_auto_correct';
const LANGUAGE_HINT_KEY = '@darja_language_hint';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [autoCorrect, setAutoCorrect] = useState(false);
  const [languageHint, setLanguageHint] = useState('ar');
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const key = await AsyncStorage.getItem(GROQ_KEY);
    const auto = await AsyncStorage.getItem(AUTO_CORRECT_KEY);
    const lang = await AsyncStorage.getItem(LANGUAGE_HINT_KEY);
    if (key) setApiKey(key);
    if (auto) setAutoCorrect(auto === 'true');
    if (lang) setLanguageHint(lang);
  };

  const saveSettings = async () => {
    if (!apiKey.trim()) { Alert.alert('خطأ', 'أدخل Groq API Key أولاً'); return; }
    await AsyncStorage.setItem(GROQ_KEY, apiKey.trim());
    await AsyncStorage.setItem(AUTO_CORRECT_KEY, String(autoCorrect));
    await AsyncStorage.setItem(LANGUAGE_HINT_KEY, languageHint);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearHistory = async () => {
    Alert.alert('مسح السجل', 'هل أنت متأكد من مسح كل السجل؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'مسح', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('@darja_history');
        Alert.alert('✅', 'تم مسح السجل');
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>الإعدادات</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔑 Groq API Key</Text>
          <Text style={styles.sectionDesc}>احصل على مفتاحك من console.groq.com — مجاني</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="gsk_..."
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowKey(!showKey)}>
              <Text>{showKey ? '🙈' : '👁️'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ التصحيح التلقائي</Text>
          <Text style={styles.sectionDesc}>بعد كل تسجيل، تلقائياً يصحح النص بالدارجة التونسية</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{autoCorrect ? 'مفعّل' : 'معطّل'}</Text>
            <Switch
              value={autoCorrect}
              onValueChange={setAutoCorrect}
              trackColor={{ false: COLORS.surface2, true: COLORS.accent }}
              thumbColor={COLORS.text}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗣️ تلميح اللغة</Text>
          <Text style={styles.sectionDesc}>يساعد Whisper على التعرف الصحيح.</Text>
          <View style={styles.langOptions}>
            {['ar', 'fr', 'ar,fr'].map((lang) => (
              <Pressable
                key={lang}
                style={[styles.langChip, languageHint === lang && styles.langChipActive]}
                onPress={() => setLanguageHint(lang)}
              >
                <Text style={[styles.langChipText, languageHint === lang && styles.langChipTextActive]}>
                  {lang === 'ar' ? 'عربي' : lang === 'fr' ? 'فرنسي' : 'عربي + فرنسي'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ منطقة الخطر</Text>
          <Pressable style={styles.dangerBtn} onPress={clearHistory}>
            <Text style={styles.dangerBtnText}>مسح كل السجل</Text>
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>كيفاش يخدم؟</Text>
          <Text style={styles.infoText}>
            {'1. تسجّل صوتك بالدارجة التونسية\n'}
            {'2. يرفع الملف لـ Groq Whisper large-v3\n'}
            {'3. يرجع النص عربي في ثوان\n'}
            {'4. اختياري: تصحيح بـ AI عبر LLaMA 70B\n'}
            {'5. انسخ النص واستعمله وين تحب'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={[styles.saveBtn, saved && styles.saveBtnSuccess]} onPress={saveSettings}>
          <Text style={styles.saveBtnText}>{saved ? '✅ تم الحفظ' : 'حفظ الإعدادات'}</Text>
        </Pressable>
      </View>
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
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20 },
  section: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sectionDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface2, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12,
  },
  input: { flex: 1, height: 44, color: COLORS.text, fontSize: 14 },
  eyeBtn: { padding: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 14, color: COLORS.text },
  langOptions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  langChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border,
  },
  langChipActive: { backgroundColor: COLORS.accent + '30', borderColor: COLORS.accent },
  langChipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  langChipTextActive: { color: COLORS.accent },
  dangerBtn: {
    backgroundColor: '#ff000020', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#ff000040',
  },
  dangerBtnText: { color: COLORS.recordingRed, fontWeight: '700', fontSize: 14 },
  infoBox: {
    backgroundColor: COLORS.accent + '15', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.accent + '40',
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.accent, marginBottom: 8 },
  infoText: { fontSize: 13, color: COLORS.text, lineHeight: 22 },
  footer: { padding: 20, paddingTop: 0 },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 16, padding: 16, alignItems: 'center' },
  saveBtnSuccess: { backgroundColor: COLORS.success },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
