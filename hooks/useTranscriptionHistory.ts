import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@darja_history';
const MAX_ENTRIES = 100;

export interface HistoryEntry {
  id: string;
  text: string;
  timestamp: number;
}

export function useTranscriptionHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  };

  const saveHistory = async (entries: HistoryEntry[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    } catch {}
  };

  const addEntry = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: Date.now(),
    };
    const updated = [entry, ...history].slice(0, MAX_ENTRIES);
    setHistory(updated);
    await saveHistory(updated);
  }, [history]);

  const removeEntry = useCallback(async (id: string) => {
    const updated = history.filter((e) => e.id !== id);
    setHistory(updated);
    await saveHistory(updated);
  }, [history]);

  const clearAll = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  }, []);

  return { history, addEntry, removeEntry, clearAll };
}
