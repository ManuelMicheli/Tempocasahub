'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createInteraction } from '@/lib/actions/interactions';

const INTERACTION_TYPES = [
  { value: 'call_outbound', label: 'Chiamata in uscita' },
  { value: 'call_inbound', label: 'Chiamata in entrata' },
  { value: 'whatsapp_sent', label: 'WhatsApp inviato' },
  { value: 'whatsapp_received', label: 'WhatsApp ricevuto' },
  { value: 'email_sent', label: 'Email inviata' },
  { value: 'email_received', label: 'Email ricevuta' },
  { value: 'visit', label: 'Visita' },
  { value: 'meeting', label: 'Incontro' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'note', label: 'Nota' },
] as const;

const OUTCOME_OPTIONS = [
  { value: 'interested', label: 'Interessato' },
  { value: 'not_interested', label: 'Non interessato' },
  { value: 'thinking', label: 'Ci pensa' },
  { value: 'no_answer', label: 'Nessuna risposta' },
] as const;

interface InteractionFormProps {
  leadId: string;
  properties?: { id: string; title: string | null; address: string }[];
  onSuccess?: () => void;
}

export function InteractionForm({ leadId, properties, onSuccess }: InteractionFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [outcome, setOutcome] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const isFutureDate = scheduledAt ? new Date(scheduledAt) > new Date() : false;

  function resetForm() {
    setType('');
    setPropertyId('');
    setOutcome('');
    setScheduledAt('');
    setError(null);
  }

  function handleSubmit(formData: FormData) {
    formData.set('lead_id', leadId);
    if (type) formData.set('type', type);
    if (propertyId && propertyId !== '_none') formData.set('property_id', propertyId);
    if (outcome && outcome !== '_none') formData.set('outcome', outcome);
    if (scheduledAt) formData.set('scheduled_at', new Date(scheduledAt).toISOString());

    // If it's not a scheduled future event, mark as completed now
    if (!isFutureDate) {
      formData.set('completed_at', new Date().toISOString());
    }

    startTransition(async () => {
      const result = await createInteraction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        resetForm();
        setOpen(false);
        onSuccess?.();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Nuova interazione
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuova interazione</DialogTitle>
          <DialogDescription>
            Registra una nuova interazione con il lead.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo..." />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Immobile */}
          {properties && properties.length > 0 && (
            <div className="space-y-2">
              <Label>Immobile</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Nessun immobile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nessun immobile</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title || p.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Riepilogo */}
          <div className="space-y-2">
            <Label htmlFor="summary">Riepilogo</Label>
            <Textarea
              id="summary"
              name="summary"
              placeholder="Note sull'interazione..."
              rows={3}
            />
          </div>

          {/* Esito */}
          <div className="space-y-2">
            <Label>Esito</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona esito..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Nessun esito</SelectItem>
                {OUTCOME_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e ora */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Data e ora</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          {/* Durata minuti */}
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Durata (minuti)</Label>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min={0}
              placeholder="es. 30"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending || !type}>
              {isPending ? 'Salvataggio...' : isFutureDate ? 'Schedula' : 'Aggiungi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
