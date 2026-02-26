'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function BriefShareButton() {
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: 'Condividi',
          description:
            'Funzionalita di condivisione in arrivo. Per ora puoi stampare la pagina.',
        });
      }}
    >
      <Share2 className="mr-1 h-4 w-4" />
      Condividi
    </Button>
  );
}
