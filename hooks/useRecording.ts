import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return false;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('startRecording error:', err);
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) return null;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      setAudioLevel(0);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      return uri || null;
    } catch (err) {
      console.error('stopRecording error:', err);
      setIsRecording(false);
      return null;
    }
  }, []);

  return { isRecording, startRecording, stopRecording, audioLevel };
}
