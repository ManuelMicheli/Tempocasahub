'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { seedDefaultRules } from '@/lib/actions/follow-up';

export function SeedRulesButton() {
  const [isPending, startTransition] = useTransition();

  function handleSeed() {
    startTransition(async () => {
      const result = await seedDefaultRules();
      if (result.error) {
        console.error('Errore durante inizializzazione regole:', result.error);
      }
    });
  }

  return (
    <Button onClick={handleSeed} disabled={isPending}>
      {isPending ? 'Inizializzazione...' : 'Inizializza regole predefinite'}
    </Button>
  );
}
