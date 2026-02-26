'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { completeInteraction } from '@/lib/actions/interactions';
import { updateMatchStatus } from '@/lib/actions/matches';
import { updateLeadFollowUp } from '@/lib/actions/post-visit';
import { useToast } from '@/hooks/use-toast';
import type { MatchStatus } from '@/types/database';

const FEEDBACK_OPTIONS = [
  {
    label: 'Molto interessato',
    outcome: 'interested' as const,
    matchStatus: 'interested' as MatchStatus,
    className:
      'bg-green-500 hover:bg-green-600 text-white border-green-600',
  },
  {
    label: 'Interessato',
    outcome: 'interested' as const,
    matchStatus: 'interested' as MatchStatus,
    className:
      'bg-blue-500 hover:bg-blue-600 text-white border-blue-600',
  },
  {
    label: 'Cosi cosi',
    outcome: 'thinking' as const,
    matchStatus: 'visited' as MatchStatus,
    className:
      'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600',
  },
  {
    label: 'Non interessato',
    outcome: 'not_interested' as const,
    matchStatus: 'rejected' as MatchStatus,
    className:
      'bg-red-500 hover:bg-red-600 text-white border-red-600',
  },
];

const NEXT_STEP_OPTIONS = [
  { value: 'proposal', label: 'Proposta' },
  { value: 'another_visit', label: 'Altra visita' },
  { value: 'follow_up', label: 'Follow-up tra X giorni' },
  { value: 'none', label: 'Nessuno' },
];

interface PostVisitFormProps {
  interactionId: string;
  leadId: string;
  matchId?: string;
}

export function PostVisitForm({
  interactionId,
  leadId,
  matchId,
}: PostVisitFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedFeedback, setSelectedFeedback] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [followUpDays, setFollowUpDays] = useState(3);
  const router = useRouter();
  const { toast } = useToast();

  function resetForm() {
    setSelectedFeedback(null);
    setNotes('');
    setNextStep('');
    setFollowUpDays(3);
  }

  function handleSubmit() {
    if (selectedFeedback === null) return;

    const feedback = FEEDBACK_OPTIONS[selectedFeedback];

    startTransition(async () => {
      // 1. Complete the interaction
      const result = await completeInteraction(
        interactionId,
        feedback.outcome,
        notes,
      );
      if (result?.error) {
        toast({ title: 'Errore', description: result.error, variant: 'destructive' });
        return;
      }

      // 2. Update match status if applicable
      if (matchId) {
        await updateMatchStatus(matchId, feedback.matchStatus);
      }

      // 3. Handle follow-up if selected
      if (nextStep === 'follow_up' && followUpDays > 0) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + followUpDays);
        await updateLeadFollowUp(leadId, followUpDate.toISOString());
      }

      toast({ title: 'Feedback registrato', description: 'Feedback salvato con successo.' });
      resetForm();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardCheck className="mr-1 h-4 w-4" />
          Registra feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Feedback post-visita</DialogTitle>
          <DialogDescription>
            {`Registra come e' andata la visita e i prossimi passi.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* 1. Feedback buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {`Come e' andata?`}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_OPTIONS.map((option, i) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setSelectedFeedback(i)}
                  className={`rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all ${
                    selectedFeedback === i
                      ? `${option.className} ring-2 ring-offset-2 ring-offset-background`
                      : 'border-border bg-background hover:bg-accent text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Notes */}
          <div className="space-y-2">
            <Label htmlFor="pv-notes">Note</Label>
            <Textarea
              id="pv-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Appunti sulla visita..."
              rows={3}
            />
          </div>

          {/* 3. Next step */}
          <div className="space-y-2">
            <Label>Prossimo passo?</Label>
            <Select value={nextStep} onValueChange={setNextStep}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                {NEXT_STEP_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Follow-up days input */}
          {nextStep === 'follow_up' && (
            <div className="space-y-2">
              <Label htmlFor="follow-up-days">Giorni per il follow-up</Label>
              <Input
                id="follow-up-days"
                type="number"
                min={1}
                max={365}
                value={followUpDays}
                onChange={(e) => setFollowUpDays(Number(e.target.value))}
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isPending || selectedFeedback === null}
            >
              {isPending ? 'Salvataggio...' : 'Salva feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
