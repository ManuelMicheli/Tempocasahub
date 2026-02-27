'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface VoiceInputProps {
  onExtracted: (data: Record<string, unknown>) => void;
  extractEndpoint: string;
  placeholder: string;
  entityLabel: string;
}

export function VoiceInput({
  onExtracted,
  extractEndpoint,
  placeholder,
  entityLabel,
}: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = text;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += ' ' + result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setText((finalTranscript + ' ' + interim).trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        setError(`Errore riconoscimento vocale: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setError(null);
  }, [text]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleExtract = async () => {
    if (!text.trim()) return;

    setIsExtracting(true);
    setError(null);

    try {
      const res = await fetch(extractEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Errore nell\'estrazione');
        return;
      }

      onExtracted(result.data);
    } catch {
      setError('Errore di connessione al server');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleClear = () => {
    setText('');
    setError(null);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">
            Descrivi {entityLabel} a voce o per iscritto
          </p>
        </div>

        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="pr-10 bg-background"
          />
          {text && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {speechSupported && (
            <Button
              type="button"
              variant={isListening ? 'destructive' : 'outline'}
              size="sm"
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Ferma
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Parla
                </>
              )}
            </Button>
          )}

          {isListening && (
            <span className="text-sm text-red-500 animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              In ascolto...
            </span>
          )}

          <div className="ml-auto">
            <Button
              type="button"
              size="sm"
              onClick={handleExtract}
              disabled={!text.trim() || isExtracting}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisi AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Compila con AI
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-md p-2">
            {error}
          </p>
        )}

        {!speechSupported && (
          <p className="text-xs text-muted-foreground">
            Il riconoscimento vocale non è supportato da questo browser.
            Usa Chrome o Edge per la funzione vocale, oppure digita la descrizione.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
