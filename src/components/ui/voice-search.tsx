'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface VoiceSearchProps {
  onResult: (query: string) => void;
  className?: string;
}

export function VoiceSearch({ onResult, className }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        setTranscript(text);
        if (result.isFinal) {
          onResult(text);
          setIsListening(false);
        }
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [onResult]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    }
  }, [isListening]);

  if (!supported) return null;

  return (
    <div className={className}>
      <motion.button
        onClick={toggleListening}
        whileTap={{ scale: 0.9 }}
        className="relative size-12 rounded-full flex items-center justify-center bg-panel-2/80 border border-line/50 text-ink-3 hover:text-volt-300 hover:border-volt-500/30 transition-all"
        aria-label={isListening ? 'Stop listening' : 'Voice search'}
      >
        {isListening && (
          <motion.div
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-volt-400"
          />
        )}
        {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      </motion.button>

      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 text-center text-sm text-ink-2 bg-panel/90 backdrop-blur-sm rounded-lg p-2"
          >
            &ldquo;{transcript}&rdquo;
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
