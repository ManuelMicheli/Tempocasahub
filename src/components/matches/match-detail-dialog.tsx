'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Send,
  CalendarCheck,
  X,
  ExternalLink,
  Check,
  AlertTriangle,
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { updateMatchStatus, addMatchNote, addClientFeedback } from '@/lib/actions/matches';
import type { Match, Lead, Property, ScoreBreakdown, MatchStatus } from '@/types/database';

export type MatchWithRelations = Match & { lead: Lead; property: Property };

interface MatchDetailDialogProps {
  match: MatchWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

const SCORE_LABELS: Record<keyof ScoreBreakdown, string> = {
  price: 'Prezzo',
  zone: 'Zona',
  type: 'Tipologia',
  sqm: 'Superficie',
  must_have: 'Must-have',
  nice_to_have: 'Nice-to-have',
};

const STATUS_CONFIG: Record<MatchStatus, { label: string; className: string }> = {
  suggested: { label: 'Suggerito', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  sent: { label: 'Inviato', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  visit_booked: { label: 'Visita prenotata', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  visited: { label: 'Visitato', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  interested: { label: 'Interessato', className: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Scartato', className: 'bg-red-100 text-red-800 border-red-200' },
  proposal: { label: 'Proposta', className: 'bg-orange-100 text-orange-800 border-orange-200' },
};

function ScoreBarWide({ label, value }: { label: string; value: number }) {
  const isGood = value >= 70;
  const isWarn = value >= 40 && value < 70;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-3 flex-1 rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            isGood ? 'bg-green-500' : isWarn ? 'bg-yellow-500' : 'bg-red-400'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-10 text-right font-medium">{value}%</span>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500 text-white';
  if (score >= 60) return 'bg-yellow-500 text-white';
  return 'bg-gray-400 text-white';
}

function daysSince(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export function MatchDetailDialog({ match, open, onOpenChange }: MatchDetailDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<MatchStatus | null>(null);
  const [agentNotes, setAgentNotes] = useState('');
  const [clientFeedbackText, setClientFeedbackText] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  // Reset local state when match changes
  const status = currentStatus ?? match?.status ?? 'suggested';

  function handleOpen(isOpen: boolean) {
    if (isOpen && match) {
      setCurrentStatus(match.status);
      setAgentNotes(match.agent_notes ?? '');
      setClientFeedbackText(match.client_feedback ?? '');
      setNotesSaved(false);
      setFeedbackSaved(false);
    }
    onOpenChange(isOpen);
  }

  function handleStatusChange(newStatus: MatchStatus) {
    if (!match) return;
    startTransition(async () => {
      const result = await updateMatchStatus(match.id, newStatus);
      if (result.success) {
        setCurrentStatus(newStatus);
      }
    });
  }

  function handleSaveNotes() {
    if (!match) return;
    startTransition(async () => {
      const result = await addMatchNote(match.id, agentNotes);
      if (result.success) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      }
    });
  }

  function handleSaveFeedback() {
    if (!match) return;
    startTransition(async () => {
      const result = await addClientFeedback(match.id, clientFeedbackText);
      if (result.success) {
        setFeedbackSaved(true);
        setTimeout(() => setFeedbackSaved(false), 2000);
      }
    });
  }

  if (!match) return null;

  const { lead, property, score, score_breakdown } = match;
  const statusConfig = STATUS_CONFIG[status];

  const budgetOk =
    lead.budget_min != null && lead.budget_max != null
      ? property.price >= lead.budget_min && property.price <= lead.budget_max
      : null;

  const zoneMatch =
    lead.search_zones && lead.search_zones.length > 0 && property.zone
      ? lead.search_zones.some(
          (z) => z.toLowerCase() === property.zone!.toLowerCase() || z.toLowerCase() === property.city.toLowerCase()
        )
      : null;

  const leadAge = daysSince(lead.created_at);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-display">
            <span>NUOVO MATCH</span>
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold font-mono-data ${getScoreColor(score)}`}
            >
              {score}
            </span>
            <span className="text-sm font-normal text-muted-foreground">/ 100</span>
          </DialogTitle>
          <DialogDescription>
            Dettaglio completo del match tra immobile e cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Property Info */}
          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Immobile
                </p>
                <p className="font-medium">
                  {property.property_type ? `${property.property_type.charAt(0).toUpperCase()}${property.property_type.slice(1)} ` : ''}
                  {property.address}, {property.city}
                </p>
              </div>
              <Link
                href={`/properties/${property.id}`}
                className="shrink-0 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-sm">
              <span className="font-semibold font-mono-data">{formatPrice(property.price)}</span>
              {lead.budget_min != null && lead.budget_max != null && (
                <span className="ml-2 text-muted-foreground">
                  (budget: {formatPrice(lead.budget_min)}-{formatPrice(lead.budget_max)}{' '}
                  {budgetOk === true ? (
                    <Check className="inline h-3.5 w-3.5 text-green-600" />
                  ) : budgetOk === false ? (
                    <AlertTriangle className="inline h-3.5 w-3.5 text-yellow-600" />
                  ) : null}
                  )
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {[
                property.sqm != null ? `${property.sqm} mq` : null,
                property.floor != null ? `${property.floor}° piano` : null,
                ...(property.features ?? []),
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>

          {/* Lead Info */}
          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cliente
                </p>
                <p className="font-medium">
                  {lead.full_name}{' '}
                  <span className="text-sm text-muted-foreground">
                    (lead attivo da {leadAge}gg)
                  </span>
                </p>
              </div>
              <Link
                href={`/leads/${lead.id}`}
                className="shrink-0 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Cerca:{' '}
              {[
                lead.property_types && lead.property_types.length > 0
                  ? lead.property_types.join(', ')
                  : null,
                lead.search_zones && lead.search_zones.length > 0
                  ? lead.search_zones.join(', ')
                  : null,
                lead.budget_min != null && lead.budget_max != null
                  ? `budget ${formatPrice(lead.budget_min)}-${formatPrice(lead.budget_max)}`
                  : null,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>

          <Separator />

          {/* Score Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-semibold font-display">Dettaglio punteggio</p>
            {score_breakdown && (
              <div className="space-y-2">
                {(Object.keys(SCORE_LABELS) as (keyof ScoreBreakdown)[]).map((key) => {
                  const val = score_breakdown[key] ?? 0;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      {val >= 70 ? (
                        <Check className="h-4 w-4 shrink-0 text-green-600" />
                      ) : val >= 40 ? (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-red-500" />
                      )}
                      <ScoreBarWide label={SCORE_LABELS[key]} value={val} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Zone / Budget check lines */}
            <div className="mt-2 space-y-0.5 text-sm">
              {zoneMatch === true && (
                <p className="text-green-700">
                  <Check className="mr-1 inline h-4 w-4" /> Zona: match esatto
                </p>
              )}
              {zoneMatch === false && (
                <p className="text-yellow-700">
                  <AlertTriangle className="mr-1 inline h-4 w-4" /> Zona: non corrispondente
                </p>
              )}
              {budgetOk === true && (
                <p className="text-green-700">
                  <Check className="mr-1 inline h-4 w-4" /> Budget: nel range
                </p>
              )}
              {budgetOk === false && (
                <p className="text-yellow-700">
                  <AlertTriangle className="mr-1 inline h-4 w-4" /> Budget: fuori range
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Agent Notes */}
          <div className="space-y-2">
            <p className="text-sm font-semibold font-display">Note agente</p>
            <Textarea
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              placeholder="Aggiungi note per questo match..."
              rows={3}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={handleSaveNotes}
              >
                <Save className="mr-1 h-3.5 w-3.5" />
                Salva note
              </Button>
              {notesSaved && (
                <span className="text-xs text-green-600">Salvato!</span>
              )}
            </div>
          </div>

          {/* Client Feedback */}
          <div className="space-y-2">
            <p className="text-sm font-semibold font-display">Feedback cliente</p>
            <Textarea
              value={clientFeedbackText}
              onChange={(e) => setClientFeedbackText(e.target.value)}
              placeholder="Inserisci il feedback del cliente..."
              rows={3}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={handleSaveFeedback}
              >
                <Save className="mr-1 h-3.5 w-3.5" />
                Salva feedback
              </Button>
              {feedbackSaved && (
                <span className="text-xs text-green-600">Salvato!</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Status + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>

            <div className="flex flex-wrap items-center gap-1.5">
              {status === 'suggested' && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleStatusChange('sent')}
                  >
                    <Send className="mr-1 h-3.5 w-3.5" />
                    Invia al cliente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleStatusChange('rejected')}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Ignora
                  </Button>
                </>
              )}
              {(status === 'suggested' || status === 'sent') && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleStatusChange('visit_booked')}
                >
                  <CalendarCheck className="mr-1 h-3.5 w-3.5" />
                  Prenota visita
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
