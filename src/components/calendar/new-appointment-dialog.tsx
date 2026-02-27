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
import { scheduleAppointment } from '@/lib/actions/interactions';

const APPOINTMENT_TYPES = [
  { value: 'visit', label: 'Visita' },
  { value: 'meeting', label: 'Incontro' },
  { value: 'call_outbound', label: 'Chiamata' },
  { value: 'proposal', label: 'Proposta' },
] as const;

interface NewAppointmentDialogProps {
  leads: { id: string; full_name: string }[];
  properties?: { id: string; title: string | null; address: string }[];
}

export function NewAppointmentDialog({ leads, properties }: NewAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('visit');
  const [leadId, setLeadId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  function resetForm() {
    setType('visit');
    setLeadId('');
    setPropertyId('');
    setScheduledAt('');
    setError(null);
  }

  function handleSubmit(formData: FormData) {
    if (!leadId || !scheduledAt) {
      setError('Lead e data/ora sono obbligatori');
      return;
    }

    formData.set('lead_id', leadId);
    formData.set('type', type);
    if (propertyId && propertyId !== '_none') formData.set('property_id', propertyId);
    formData.set('scheduled_at', new Date(scheduledAt).toISOString());

    startTransition(async () => {
      const result = await scheduleAppointment(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        resetForm();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          Nuovo Appuntamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display">Nuovo Appuntamento</DialogTitle>
          <DialogDescription>
            Schedula un nuovo appuntamento nel calendario.
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
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lead */}
          <div className="space-y-2">
            <Label>Lead *</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona lead..." />
              </SelectTrigger>
              <SelectContent>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.full_name}
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

          {/* Data e ora */}
          <div className="space-y-2">
            <Label htmlFor="appointment_scheduled_at">Data e ora *</Label>
            <Input
              id="appointment_scheduled_at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="appointment_summary">Note</Label>
            <Textarea
              id="appointment_summary"
              name="summary"
              placeholder="Dettagli sull'appuntamento..."
              rows={3}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending || !leadId || !scheduledAt}>
              {isPending ? 'Salvataggio...' : 'Schedula'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
