'use client';

import { useState, useTransition } from 'react';
import { Send, CalendarCheck, X, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HoverScale } from '@/components/motion';
import { updateMatchStatus } from '@/lib/actions/matches';
import type { Match, Lead, Property, ScoreBreakdown, MatchStatus } from '@/types/database';

export type MatchWithRelations = Match & { lead: Lead; property: Property };

interface MatchCardProps {
  match: MatchWithRelations;
  onOpenDetail?: (match: MatchWithRelations) => void;
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

const LEAD_TYPE_LABELS: Record<string, string> = {
  buyer: 'Acquirente',
  seller: 'Venditore',
  both: 'Acquirente/Venditore',
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-8 text-right font-medium">{value}%</span>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500 text-white';
  if (score >= 60) return 'bg-yellow-500 text-white';
  return 'bg-gray-400 text-white';
}

export function MatchCard({ match, onOpenDetail }: MatchCardProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<MatchStatus>(match.status);

  const { lead, property, score, score_breakdown } = match;
  const statusConfig = STATUS_CONFIG[currentStatus];

  function handleStatusChange(newStatus: MatchStatus) {
    startTransition(async () => {
      const result = await updateMatchStatus(match.id, newStatus);
      if (result.success) {
        setCurrentStatus(newStatus);
      }
    });
  }

  return (
    <HoverScale>
      <Card className="relative overflow-hidden">
      {/* Score Badge */}
      <div
        className={`absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold font-mono-data shadow-md ${getScoreColor(score)}`}
      >
        {score}
      </div>

      <CardContent className="space-y-3 p-4">
        {/* Property Section */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Immobile
          </p>
          <p className="mt-0.5 font-medium leading-tight pr-14">
            {property.address}, {property.city}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            <span className="font-semibold text-primary font-mono-data">{formatPrice(property.price)}</span>
            {property.sqm != null && <span>{property.sqm} mq</span>}
            {property.rooms != null && <span>{property.rooms} locali</span>}
          </div>
          {property.features && property.features.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {property.features.slice(0, 4).map((f) => (
                <Badge key={f} variant="outline" className="text-[10px] px-1.5 py-0">
                  {f}
                </Badge>
              ))}
              {property.features.length > 4 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  +{property.features.length - 4}
                </Badge>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Lead Section */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cliente
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="font-medium">{lead.full_name}</p>
            <Badge variant="secondary" className="text-[10px]">
              {LEAD_TYPE_LABELS[lead.type] ?? lead.type}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            {(lead.budget_min != null || lead.budget_max != null) && (
              <span>
                Budget: {lead.budget_min != null ? formatPrice(lead.budget_min) : '?'} -{' '}
                {lead.budget_max != null ? formatPrice(lead.budget_max) : '?'}
              </span>
            )}
          </div>
          {lead.search_zones && lead.search_zones.length > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Zone: {lead.search_zones.join(', ')}
            </p>
          )}
        </div>

        <Separator />

        {/* Score Breakdown */}
        {score_breakdown && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dettaglio punteggio
            </p>
            {(Object.keys(SCORE_LABELS) as (keyof ScoreBreakdown)[]).map((key) => (
              <ScoreBar
                key={key}
                label={SCORE_LABELS[key]}
                value={score_breakdown[key] ?? 0}
              />
            ))}
          </div>
        )}

        <Separator />

        {/* Status + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>

          <div className="flex items-center gap-1.5">
            {onOpenDetail && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenDetail(match)}
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                Dettagli
              </Button>
            )}
            {currentStatus === 'suggested' && (
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
            {(currentStatus === 'suggested' || currentStatus === 'sent') && (
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
      </CardContent>
      </Card>
    </HoverScale>
  );
}
