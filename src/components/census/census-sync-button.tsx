'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CensusSyncButtonProps {
  zoneId: string;
  syncedAt: string | null;
}

export function CensusSyncButton({ zoneId }: CensusSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setSyncing(true);
    setResult(null);

    try {
      const res = await fetch(`/api/census/zones/${zoneId}/sync`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.error) {
        setResult(`Errore: ${data.error}`);
      } else {
        setResult(
          `Sincronizzati ${data.buildings} edifici con ${data.units} unità`
        );
        router.refresh();
      }
    } catch {
      setResult('Errore di connessione');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-xs text-muted-foreground">{result}</span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing}
      >
        {syncing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {syncing ? 'Sincronizzazione...' : 'Sincronizza'}
      </Button>
    </div>
  );
}
