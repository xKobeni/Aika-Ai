import { useEffect, useRef } from 'react';

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)
    : undefined;

const WAKE_PATTERN = /\baika\b/i;

export function useWakeWord(active: boolean, onWakeWord: () => void) {
  const onWakeWordRef = useRef(onWakeWord);
  onWakeWordRef.current = onWakeWord;

  useEffect(() => {
    if (!active || !SpeechRecognitionAPI) return;

    const Recognition = SpeechRecognitionAPI;
    const rec = new Recognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (WAKE_PATTERN.test(transcript)) {
          onWakeWordRef.current();
          break;
        }
      }
    };

    rec.onerror = () => {};
    rec.start();

    return () => {
      try {
        rec.abort();
      } catch {}
    };
  }, [active]);
}
