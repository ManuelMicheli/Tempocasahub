'use client';

import { Check, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Match, Lead, Property } from '@/types/database';

type MatchWithRelations = Match & { lead: Lead; property: Property };

interface MatchNotificationProps {
  match: MatchWithRelations;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

function daysSince(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-gray-500';
}

export function MatchNotification({ match }: MatchNotificationProps) {
  const { lead, property, score, score_breakdown } = match;
  const leadAge = daysSince(lead.created_at);

  const budgetOk =
    lead.budget_min != null && lead.budget_max != null
      ? property.price >= lead.budget_min && property.price <= lead.budget_max
      : null;

  const zoneMatch =
    lead.search_zones && lead.search_zones.length > 0 && property.zone
      ? lead.search_zones.some(
          (z) =>
            z.toLowerCase() === property.zone!.toLowerCase() ||
            z.toLowerCase() === property.city.toLowerCase()
        )
      : null;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>NUOVO MATCH</span>
          <span className={`font-bold ${getScoreColor(score)}`}>
            (Score: {score}/100)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <p className="font-medium">
            Immobile:{' '}
            {property.property_type
              ? `${property.property_type.charAt(0).toUpperCase()}${property.property_type.slice(1)} `
              : ''}
            {property.address}, {property.city}
          </p>
          <p>
            Prezzo: {formatPrice(property.price)}
            {lead.budget_min != null && lead.budget_max != null && (
              <span className="text-muted-foreground">
                {' '}
                (budget: {formatPrice(lead.budget_min)}-{formatPrice(lead.budget_max)}{' '}
                {budgetOk ? (
                  <Check className="inline h-3.5 w-3.5 text-green-600" />
                ) : (
                  <AlertTriangle className="inline h-3.5 w-3.5 text-yellow-600" />
                )}
                )
              </span>
            )}
          </p>
          <p className="text-muted-foreground">
            {[
              property.sqm != null ? `${property.sqm} mq` : null,
              property.floor != null ? `${property.floor}° piano` : null,
              ...(property.features ?? []),
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
        <div>
          <p className="font-medium">
            Cliente: {lead.full_name} (lead attivo da {leadAge}gg)
          </p>
          <p className="text-muted-foreground">
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
        {score_breakdown && (
          <div className="space-y-0.5 pt-1">
            {zoneMatch === true && (
              <p className="text-green-700">
                <Check className="mr-1 inline h-3.5 w-3.5" /> Zona: match esatto
              </p>
            )}
            {zoneMatch === false && (
              <p className="text-yellow-700">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> Zona: non corrispondente
              </p>
            )}
            {budgetOk === true && (
              <p className="text-green-700">
                <Check className="mr-1 inline h-3.5 w-3.5" /> Budget: nel range
              </p>
            )}
            {budgetOk === false && (
              <p className="text-yellow-700">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> Budget: fuori range
              </p>
            )}
            {lead.must_have && lead.must_have.length > 0 && property.features && (
              <p
                className={
                  lead.must_have.every((mh) => property.features!.includes(mh))
                    ? 'text-green-700'
                    : 'text-yellow-700'
                }
              >
                {lead.must_have.every((mh) => property.features!.includes(mh)) ? (
                  <Check className="mr-1 inline h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                )}{' '}
                Must-have: {lead.must_have.join(', ')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
