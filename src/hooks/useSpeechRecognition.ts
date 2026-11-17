import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

// Messages for the error codes of the Web Speech API
const SPEECH_ERRORS: Record<string, string> = {
  'no-speech': 'No se detectó voz. Habla cerca del micrófono e intenta de nuevo.',
  'audio-capture': 'No se encontró un micrófono disponible.',
  'not-allowed': 'Permite el acceso al micrófono para usar la entrada por voz.',
  'service-not-allowed': 'Permite el acceso al micrófono para usar la entrada por voz.',
  network: 'El reconocimiento de voz necesita conexión a internet.',
};

// The slice of the Web Speech API this hook uses
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onspeechend: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

interface SpeechRecognitionResult {
  transcript: string;
  /** Words recognized so far while the user is still speaking */
  interimTranscript: string;
  isSupported: boolean;
  isListening: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

const UNSUPPORTED_MESSAGE = 'Tu navegador no permite el reconocimiento de voz. Prueba con Chrome o Edge, o escribe la transacción.';

// Silence after the last understood words that ends a dictation
const PAUSE_MS = 1500;
// How long to wait for the browser to confirm the end before moving on without it
const END_FALLBACK_MS = 800;

const getRecognitionClass = () =>
  typeof window === 'undefined' ? undefined : window.SpeechRecognition ?? window.webkitSpeechRecognition;

export const useSpeechRecognition = (): SpeechRecognitionResult => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const isSupported = Boolean(getRecognitionClass());
  const error = isSupported ? recognitionError : UNSUPPORTED_MESSAGE;

  // Ends the dictation: some phones never report the end of speech, so listening also ends on a pause
  // after the last words, or right away when the user taps the mic, without waiting for the browser
  const finishRef = useRef<() => void>(() => {});

  useEffect(() => {
    const SpeechRecognition = getRecognitionClass();
    if (!SpeechRecognition) return;

    const instance = new SpeechRecognition();
    instance.continuous = false;
    instance.interimResults = true;
    instance.lang = 'es-MX';

    let pauseTimer: ReturnType<typeof setTimeout> | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let heardFinal = false;
    const clearTimers = () => {
      clearTimeout(pauseTimer);
      clearTimeout(fallbackTimer);
    };
    const finish = () => {
      clearTimers();
      instance.stop();
      // onend normally arrives within a moment, with any last words; if it never does, stop waiting
      fallbackTimer = setTimeout(() => {
        heardFinal = false;
        setInterimTranscript('');
        setIsListening(false);
      }, END_FALLBACK_MS);
    };
    finishRef.current = finish;

    instance.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInterimTranscript(interim);
      if (finalTranscript) {
        heardFinal = true;
        setTranscript((previous) => `${previous} ${finalTranscript}`);
      }
      // Each new word restarts the pause; once something was understood, a pause ends the dictation
      clearTimeout(pauseTimer);
      if (heardFinal) pauseTimer = setTimeout(finish, PAUSE_MS);
    };

    instance.onerror = (event) => {
      clearTimers();
      // Stopping on purpose fires "aborted"; that is not an error for the user
      if (event.error !== 'aborted') {
        setRecognitionError(SPEECH_ERRORS[event.error] ?? 'No se pudo reconocer la voz. Intenta de nuevo.');
      }
      setInterimTranscript('');
      setIsListening(false);
    };

    instance.onspeechend = finish;

    instance.onend = () => {
      clearTimers();
      heardFinal = false;
      setInterimTranscript('');
      setIsListening(false);
    };

    recognition.current = instance;
    return () => {
      clearTimers();
      instance.stop();
      recognition.current = null;
      finishRef.current = () => {};
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognition.current) return;
    setRecognitionError(null);
    setIsListening(true);
    setTranscript('');
    setInterimTranscript('');
    try {
      recognition.current.start();
    } catch {
      // start() throws if recognition is already running; nothing to do
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognition.current) finishRef.current();
    else setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript: transcript.trim(),
    interimTranscript: interimTranscript.trim(),
    isSupported,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeechRecognition;
