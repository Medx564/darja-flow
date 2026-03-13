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

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

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