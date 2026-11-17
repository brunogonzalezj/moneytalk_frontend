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

  useEffect(() => {
    const SpeechRecognition = getRecognitionClass();
    if (!SpeechRecognition) return;

    const instance = new SpeechRecognition();
    instance.continuous = false;
    instance.interimResults = true;
    instance.lang = 'es-MX';

    instance.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInterimTranscript(interim);
      if (finalTranscript) setTranscript((previous) => `${previous} ${finalTranscript}`);
    };

    instance.onerror = (event) => {
      // Stopping on purpose fires "aborted"; that is not an error for the user
      if (event.error !== 'aborted') {
        setRecognitionError(SPEECH_ERRORS[event.error] ?? 'No se pudo reconocer la voz. Intenta de nuevo.');
      }
      setInterimTranscript('');
      setIsListening(false);
    };

    instance.onspeechend = () => {
      instance.stop();
      setIsListening(false);
    };

    instance.onend = () => {
      setInterimTranscript('');
      setIsListening(false);
    };

    recognition.current = instance;
    return () => {
      instance.stop();
      recognition.current = null;
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
    recognition.current?.stop();
    setIsListening(false);
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
