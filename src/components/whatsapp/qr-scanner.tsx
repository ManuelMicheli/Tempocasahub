'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Wifi, WifiOff, Smartphone, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QrScannerProps {
  bridgeUrl?: string;
  agentId: string;
  onStatusChange: (status: string) => void;
}

export function QrScanner({ agentId, onStatusChange }: QrScannerProps) {
  const [status, setStatus] = useState<string>('disconnected');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollQr = useCallback(() => {
    stopPolling();

    const poll = async () => {
      try {
        const res = await fetch('/api/whatsapp/qr');
        if (!res.ok) return;

        const data = await res.json();

        setStatus(data.status);
        onStatusChange(data.status);

        if (data.qr) {
          setQrImage(data.qr);
        }

        // Connection succeeded
        if (data.status === 'connected') {
          setQrImage(null);
          setError(null);
          stopPolling();
        }

        // Connection failed after retries
        if (data.status === 'failed') {
          setQrImage(null);
          setError(data.error || 'Connessione a WhatsApp fallita. Riprova più tardi.');
          setConnecting(false);
          stopPolling();
        }

        // Session went back to disconnected (user disconnected or logged out)
        if (data.status === 'disconnected' && !data.qr) {
          stopPolling();
          setConnecting(false);
        }
      } catch {
        // Network error — keep polling
      }
    };

    // Immediate first check, then every 2s
    poll();
    pollRef.current = setInterval(poll, 2000);
  }, [onStatusChange, stopPolling]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agentId || 'default' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Errore ${res.status}`);
      }

      const data = await res.json();
      setStatus(data.status);
      onStatusChange(data.status);

      // Start polling for QR code
      pollQr();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossibile avviare la sessione WhatsApp.'
      );
      setStatus('disconnected');
      onStatusChange('disconnected');
      setConnecting(false);
    }
  }, [agentId, onStatusChange, pollQr]);

  const disconnect = useCallback(async () => {
    stopPolling();

    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
    } catch {
      // Ignore
    }

    setStatus('disconnected');
    setQrImage(null);
    setError(null);
    setConnecting(false);
    onStatusChange('disconnected');
  }, [onStatusChange, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Connected state
  if (status === 'connected') {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <Wifi className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400">
              WhatsApp collegato
            </p>
            <p className="text-sm text-green-600 dark:text-green-500">
              I messaggi dei contatti monitorati vengono sincronizzati automaticamente
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={disconnect}>
            <WifiOff className="h-4 w-4 mr-2" />
            Scollega
          </Button>
        </CardContent>
      </Card>
    );
  }

  // QR code state
  if (qrImage) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div>
            <p className="font-semibold mb-1">Scansiona il codice QR</p>
            <p className="text-sm text-muted-foreground">
              Apri WhatsApp sul telefono → Menu (⋮) → Dispositivi collegati → Collega un dispositivo
            </p>
          </div>
          <div className="inline-block p-3 bg-white rounded-xl shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImage} alt="QR Code WhatsApp" className="w-64 h-64" />
          </div>
          <p className="text-xs text-muted-foreground">
            Il codice QR si aggiorna automaticamente. Non chiudere questa pagina.
          </p>
          <Button variant="outline" size="sm" onClick={disconnect}>
            Annulla
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Failed state
  if (status === 'failed' || error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400 mb-1">
              Connessione fallita
            </p>
            <p className="text-sm text-red-600 dark:text-red-500">
              {error || 'Impossibile connettersi a WhatsApp. Riprova più tardi.'}
            </p>
          </div>
          <Button onClick={connect} variant="outline">
            <Wifi className="h-4 w-4 mr-2" />
            Riprova
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Connecting state
  if (status === 'connecting' || connecting) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            Connessione a WhatsApp in corso...
          </p>
          <p className="text-xs text-muted-foreground">
            Attendere, potrebbero essere necessari alcuni secondi
          </p>
        </CardContent>
      </Card>
    );
  }

  // Disconnected — show connect button
  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Smartphone className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold mb-1">Collega WhatsApp</p>
          <p className="text-sm text-muted-foreground">
            Connetti il tuo WhatsApp per sincronizzare automaticamente le conversazioni con i tuoi lead
          </p>
        </div>

        <Button onClick={connect} disabled={connecting}>
          <Wifi className="h-4 w-4 mr-2" />
          Connetti WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}
