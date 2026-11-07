import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Square } from 'lucide-react';

interface VoiceDictationProps {
  onTranscript: (text: string) => void;
  isBusy?: boolean;
}

export const VoiceDictation: React.FC<VoiceDictationProps> = ({ onTranscript, isBusy }) => {
  const [isListening, setIsListening] = useState(false);
  const [hasSupport, setHasSupport] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setHasSupport(Boolean(SpeechRecognition));
  }, []);

  const toggleListening = () => {
    if (!hasSupport || isBusy) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!isListening) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            onTranscript(transcript);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (e) {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      }
    } else {
      setIsListening(false);
    }
  };

  if (!hasSupport) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={isBusy}
      title={isListening ? 'Stop listening' : 'Dictate your question with voice'}
      className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
        isListening
          ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
};

interface SpeechPlayerProps {
  text: string;
}

export const SpeechPlayer: React.FC<SpeechPlayerProps> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSynthesis, setHasSynthesis] = useState(false);

  useEffect(() => {
    setHasSynthesis(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeech = () => {
    if (!hasSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();

      // Clean markdown tags for natural speech
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/[#*_`>\[\]]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  if (!hasSynthesis) return null;

  return (
    <button
      type="button"
      onClick={toggleSpeech}
      title={isPlaying ? 'Stop audio' : 'Listen to answer'}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
        isPlaying
          ? 'bg-indigo-600 text-white ring-1 ring-indigo-400'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700'
      }`}
    >
      {isPlaying ? (
        <>
          <Square className="w-3 h-3 fill-current" />
          <span>Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5" />
          <span>Listen</span>
        </>
      )}
    </button>
  );
};
