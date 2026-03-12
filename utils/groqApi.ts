import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const GROQ_KEY_STORAGE = '@darja_groq_key';
const LANGUAGE_HINT_KEY = '@darja_language_hint';

async function getApiKey(): Promise<string> {
  const key = await AsyncStorage.getItem(GROQ_KEY_STORAGE);
  if (!key) throw new Error('API_KEY_MISSING');
  return key;
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const apiKey = await getApiKey();
  const languageHint = (await AsyncStorage.getItem(LANGUAGE_HINT_KEY)) || 'ar';

  const base64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'audio/m4a' });

  const formData = new FormData();
  formData.append('file', blob as any, 'recording.m4a');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', languageHint.split(',')[0]);
  formData.append('response_format', 'json');
  formData.append('prompt', 'هذا تسجيل بالدارجة التونسية. الكلام بالعربي التونسي العامي.');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('API_KEY_INVALID');
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.text?.trim() || '';
}

export async function correctDarjaText(text: string): Promise<string> {
  const apiKey = await getApiKey();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: `أنت مساعد متخصص في الدارجة التونسية. مهمتك تصحيح وتحسين النصوص المكتوبة بالدارجة التونسية. احتفظ بنفس المعنى والكلمات التونسية. صحّح الأخطاء الإملائية فقط. لا تترجم للعربية الفصحى. أرجع النص المصحح فقط بدون شرح.`,
        },
        {
          role: 'user',
          content: `صحّح هذا النص: "${text}"`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('API_KEY_INVALID');
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || text;
}
