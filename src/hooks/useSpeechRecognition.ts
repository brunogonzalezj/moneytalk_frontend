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
  onstart: (() => void) | null;
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
  // Opens a new dictation, also when a browser does not fire onstart
  const beginRef = useRef<() => void>(() => {});

  useEffect(() => {
    const SpeechRecognition = getRecognitionClass();
    if (!SpeechRecognition) return;

    const instance = new SpeechRecognition();
    instance.continuous = false;
    instance.interimResults = true;
    instance.lang = 'es-MX';

    let pauseTimer: ReturnType<typeof setTimeout> | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let heardSpeech = false;
    // Results that arrive after the dictation was closed are ignored, so nothing is analyzed twice
    let ended = false;
    // What this dictation produced: the words marked final, and the latest words still in progress
    let finalText = '';
    let lastInterim = '';
    const clearTimers = () => {
      clearTimeout(pauseTimer);
      clearTimeout(fallbackTimer);
    };
    // Closes the dictation once. iOS Safari may stop without ever marking the words as final,
    // so the last words heard become the transcript instead of being lost
    const endSession = () => {
      clearTimers();
      if (ended) {
        setIsListening(false);
        return;
      }
      ended = true;
      if (!finalText.trim() && lastInterim.trim()) setTranscript(lastInterim);
      heardSpeech = false;
      finalText = '';
      lastInterim = '';
      setInterimTranscript('');
      setIsListening(false);
    };
    const finish = () => {
      clearTimers();
      instance.stop();
      // onend normally arrives within a moment, with any last words; if it never does, stop waiting
      fallbackTimer = setTimeout(endSession, END_FALLBACK_MS);
    };
    finishRef.current = finish;

    const begin = () => {
      ended = false;
    };
    beginRef.current = begin;
    instance.onstart = begin;

    instance.onresult = (event) => {
      if (ended) return;
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInterimTranscript(interim);
      if (interim.trim()) lastInterim = `${finalText} ${interim}`.trim();
      if (finalTranscript) {
        heardSpeech = true;
        finalText = `${finalText} ${finalTranscript}`;
        setTranscript((previous) => `${previous} ${finalTranscript}`);
      }
      // Each new word restarts the pause; once anything was heard, a pause ends the dictation.
      // iOS Safari marks nothing as final until listening stops, so interim words count too
      if (interim) heardSpeech = true;
      clearTimeout(pauseTimer);
      if (heardSpeech) pauseTimer = setTimeout(finish, PAUSE_MS);
    };

    instance.onerror = (event) => {
      // Stopping on purpose fires "aborted"; that is not an error for the user
      if (event.error !== 'aborted') {
        setRecognitionError(SPEECH_ERRORS[event.error] ?? 'No se pudo reconocer la voz. Intenta de nuevo.');
      }
      endSession();
    };

    instance.onspeechend = finish;

    instance.onend = endSession;

    recognition.current = instance;
    return () => {
      clearTimers();
      instance.stop();
      recognition.current = null;
      finishRef.current = () => {};
      beginRef.current = () => {};
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognition.current) return;
    setRecognitionError(null);
    setIsListening(true);
    setTranscript('');
    setInterimTranscript('');
    beginRef.current();
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
