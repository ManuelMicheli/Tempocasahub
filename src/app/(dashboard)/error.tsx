'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-2xl font-bold">Errore nella dashboard</h2>
      <p className="text-muted-foreground max-w-md text-center">
        {error.message || 'Errore sconosciuto'}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Digest: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Riprova</Button>
        <Button variant="outline" asChild>
          <Link href="/login">Vai al login</Link>
        </Button>
      </div>
    </div>
  );
}
