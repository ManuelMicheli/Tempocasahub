'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteLead } from '@/lib/actions/leads';

interface DeleteLeadButtonProps {
  leadId: string;
  leadName: string;
}

export function DeleteLeadButton({ leadId, leadName }: DeleteLeadButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteLead(leadId);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="default">
          <Trash2 className="h-4 w-4" />
          Elimina
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Elimina Lead</DialogTitle>
          <DialogDescription>
            Sei sicuro di voler eliminare il lead &quot;{leadName}&quot;? Questa azione non
            pu&ograve; essere annullata.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Eliminazione...' : 'Elimina'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
