import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Pressable, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRecording } from '../hooks/useRecording';
import { useTranscriptionHistory } from '../hooks/useTranscriptionHistory';
import { transcribeAudio, correctDarjaText } from '../utils/groqApi';
import WaveformVisualizer from '../components/WaveformVisualizer';
import ApiKeyModal from '../components/ApiKeyModal';
import { COLORS } from '../constants/theme';

export default function HomeScreen() {
  const [transcription, setTranscription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState('اضغط للتسجيل');
  const [copied, setCopied] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { isRecording, startRecording, stopRecording, audioLevel } = useRecording();
  const { addEntry } = useTranscriptionHistory();

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [pulseAnim]);

  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleMicPress = async () => {
    if (isTranscribing || isCorrecting) return;

    if (isRecording) {
      stopPulse();
      setStatusMsg('جاري التحويل...');
      setIsTranscribing(true);
      const uri = await stopRecording();
      if (!uri) {
        setStatusMsg('خطأ في التسجيل');
        setIsTranscribing(false);
        return;
      }
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const result = await transcribeAudio(uri);
        setTranscription(result);
        fadeIn();
        setStatusMsg('اضغط للتسجيل');
        addEntry(result);
      } catch (err: any) {
        if (err.message?.includes('API_KEY')) {
          setShowApiModal(true);
        } else {
          Alert.alert('خطأ', 'فشل التحويل. حاول مرة أخرى.');
        }
        setStatusMsg('اضغط للتسجيل');
      } finally {
        setIsTranscribing(false);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const started = await startRecording();
      if (started) {
        startPulse();
        setStatusMsg('يسجل... اضغط للإيقاف');
        fadeAnim.setValue(0);
      } else {
        setShowApiModal(true);
      }
    }
  };

  const handleCorrect = async () => {
    if (!transcription.trim() || isCorrecting) return;
    setIsCorrecting(true);
    setStatusMsg('جاري التصحيح...');
    try {
      const corrected = await correctDarjaText(transcription);
      setTranscription(corrected);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      if (err.message?.includes('API_KEY')) setShowApiModal(true);
    } finally {
      setIsCorrecting(false);
      setStatusMsg('اضغط للتسجيل');
    }
  };

  const handleCopy = async () => {
    if (!transcription.trim()) return;
    await Clipboard.setStringAsync(transcription);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setTranscription('');
    fadeAnim.setValue(0);
    setStatusMsg('اضغط للتسجيل');
  };

  const isProcessing = isTranscribing || isCorrecting;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>دارجة فلو</Text>
          <Text style={styles.appSubtitle}>Darja Flow</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={() => router.push('/history')}>
            <Text style={styles.headerBtnIcon}>📋</Text>
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={() => router.push('/settings')}>
            <Text style={styles.headerBtnIcon}>⚙️</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.waveformContainer}>
          <WaveformVisualizer isRecording={isRecording} audioLevel={audioLevel} />
        </View>

        <View style={styles.micSection}>
          <Animated.View style={[styles.micOuter, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity onPress={handleMicPress} disabled={isProcessing} activeOpacity={0.85}>
              <LinearGradient
                colors={
                  isRecording ? [COLORS.recordingRed, '#ff6b6b'] :
                  isProcessing ? [COLORS.surface2, COLORS.surface2] :
                  [COLORS.accent, COLORS.accentLight]
                }
                style={styles.micButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.micIcon}>
                  {isProcessing ? '⏳' : isRecording ? '⏹' : '🎙️'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.statusText}>{statusMsg}</Text>
          {isRecording && (
            <View style={styles.recordingBadge}>
              <View style={styles.redDot} />
              <Text style={styles.recordingLabel}>REC</Text>
            </View>
          )}
        </View>

        {transcription ? (
          <Animated.View style={[styles.outputSection, { opacity: fadeAnim }]}>
            <View style={styles.outputHeader}>
              <Text style={styles.outputLabel}>النص المكتوب</Text>
              <View style={styles.outputActions}>
                <Pressable style={[styles.actionChip, isCorrecting && styles.actionChipDisabled]} onPress={handleCorrect} disabled={isCorrecting}>
                  <Text style={styles.actionChipText}>{isCorrecting ? '...' : '✨ صحّح'}</Text>
                </Pressable>
                <Pressable style={[styles.actionChip, copied && styles.actionChipSuccess]} onPress={handleCopy}>
                  <Text style={styles.actionChipText}>{copied ? '✅ نسخ' : '📋 نسخ'}</Text>
                </Pressable>
                <Pressable style={styles.actionChipDanger} onPress={handleClear}>
                  <Text style={styles.actionChipText}>🗑</Text>
                </Pressable>
              </View>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.textEditor}
                multiline
                value={transcription}
                onChangeText={setTranscription}
                onBlur={() => setIsEditing(false)}
                autoFocus
                textAlignVertical="top"
                writingDirection="rtl"
                textAlign="right"
                selectionColor={COLORS.accent}
              />
            ) : (
              <Pressable onPress={() => setIsEditing(true)}>
                <Text style={styles.transcriptionText}>{transcription}</Text>
                <Text style={styles.tapToEdit}>اضغط لتعديل النص</Text>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎤</Text>
            <Text style={styles.emptyTitle}>جرّب تحكي بالدارجة</Text>
            <Text style={styles.emptySubtitle}>اضغط على الميكروفون وحكي بالدارجة التونسية</Text>
            <Text style={styles.emptyExamples}>"نحب نعرف الطقس اليوم" أو "مرحبا كيفاش الحال"</Text>
          </View>
        )}
      </ScrollView>
      <ApiKeyModal visible={showApiModal} onClose={() => setShowApiModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.text, textAlign: 'right' },
  appSubtitle: { fontSize: 12, color: COLORS.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center',
  },
  headerBtnIcon: { fontSize: 18 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  waveformContainer: { height: 80, marginTop: 20, marginBottom: 8 },
  micSection: { alignItems: 'center', paddingVertical: 24 },
  micOuter: {
    borderRadius: 100, shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  micButton: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
  micIcon: { fontSize: 36 },
  statusText: { marginTop: 14, fontSize: 15, color: COLORS.textMuted, fontWeight: '500', textAlign: 'center' },
  recordingBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: 6,
    backgroundColor: '#ff000020', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6,
  },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.recordingRed },
  recordingLabel: { color: COLORS.recordingRed, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  outputSection: {
    marginTop: 8, backgroundColor: COLORS.surface, borderRadius: 20,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  outputHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8,
  },
  outputLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  outputActions: { flexDirection: 'row', gap: 6 },
  actionChip: {
    backgroundColor: COLORS.surface2, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  actionChipDisabled: { opacity: 0.5 },
  actionChipSuccess: { borderColor: COLORS.success, backgroundColor: '#00ff8820' },
  actionChipDanger: {
    backgroundColor: '#ff000015', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#ff000030',
  },
  actionChipText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  transcriptionText: {
    fontSize: 18, color: COLORS.text, lineHeight: 30,
    textAlign: 'right', writingDirection: 'rtl', fontWeight: '400',
  },
  tapToEdit: { marginTop: 8, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },
  textEditor: {
    fontSize: 18, color: COLORS.text, lineHeight: 30,
    textAlign: 'right', minHeight: 100, writingDirection: 'rtl',
  },
  emptyState: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  emptyExamples: {
    fontSize: 13, color: COLORS.accent, textAlign: 'center', fontStyle: 'italic',
    lineHeight: 22, backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, overflow: 'hidden',
  },
});
