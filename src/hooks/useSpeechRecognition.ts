import { useState, useEffect, useCallback } from 'react';

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
  aborted: 'Se canceló la grabación.',
};

declare global {
  interface Window {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  }
}

interface SpeechRecognitionResult {
  transcript: string;
  isListening: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (): SpeechRecognitionResult => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Tu navegador no permite el reconocimiento de voz. Prueba con Chrome o Edge, o escribe la transacción.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'es-MX';

    recognitionInstance.onresult = (event: SpeechRecognitionEventLike) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscript(prevTranscript => prevTranscript + ' ' + finalTranscript);
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEventLike) => {
      setError(SPEECH_ERRORS[event.error] ?? 'No se pudo reconocer la voz. Intenta de nuevo.');
      setIsListening(false);
    };

    recognitionInstance.onspeechend = () => {
      recognitionInstance.stop();
        setIsListening(false);
    }

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    // Cleanup on unmount
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognition) return;
    
    setError(null);
    setIsListening(true);
    
    try {
      recognition.start();
        setTranscript(''); // Clear previous transcript

    } catch {
      // start() throws if recognition is already running; nothing to do
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    recognition.stop();
    setIsListening(false);
  }, [recognition]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript: transcript.trim(),
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeechRecognition;