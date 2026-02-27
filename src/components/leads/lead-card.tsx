import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HoverScale } from '@/components/motion';
import { formatRelative, daysSince } from '@/lib/date';
import { AlertTriangle, Calendar } from 'lucide-react';
import type { Lead } from '@/types/database';

interface LeadCardProps {
  lead: Lead;
}

const temperatureConfig = {
  hot: { color: 'bg-red-500', label: 'Caldo' },
  warm: { color: 'bg-yellow-500', label: 'Tiepido' },
  cold: { color: 'bg-gray-400', label: 'Freddo' },
};

const statusLabels: Record<string, string> = {
  new: 'Nuovo',
  contacted: 'Contattato',
  qualified: 'Qualificato',
  active: 'Attivo',
  proposal: 'Proposta',
  negotiation: 'Trattativa',
  closed_won: 'Chiuso (vinto)',
  closed_lost: 'Chiuso (perso)',
  dormant: 'Dormiente',
};

const typeLabels: Record<string, string> = {
  buyer: 'Acquirente',
  seller: 'Venditore',
  both: 'Entrambi',
};

function formatBudget(value: number | null): string {
  if (value === null) return '';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function needsAttentionWarning(lead: Lead): boolean {
  if (!lead.last_contact_at) return true;
  const days = daysSince(lead.last_contact_at);
  if (lead.temperature === 'hot' && days > 3) return true;
  if (lead.temperature === 'warm' && days > 7) return true;
  return false;
}

export function LeadCard({ lead }: LeadCardProps) {
  const temp = temperatureConfig[lead.temperature] || temperatureConfig.warm;
  const showWarning = needsAttentionWarning(lead);

  const budgetRange =
    lead.type === 'seller' || lead.type === 'both'
      ? lead.selling_price_requested
        ? `\u20AC${formatBudget(lead.selling_price_requested)}`
        : null
      : lead.budget_min || lead.budget_max
        ? `\u20AC${formatBudget(lead.budget_min)} - \u20AC${formatBudget(lead.budget_max)}`
        : null;

  const zones = lead.search_zones || [];
  const visibleZones = zones.slice(0, 2);
  const extraZonesCount = zones.length - 2;

  return (
    <Link href={`/leads/${lead.id}`}>
      <HoverScale>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${temp.color}`} />
              <h3 className="font-semibold text-sm truncate font-display">{lead.full_name}</h3>
              {showWarning && (
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
            </div>
            {lead.score > 0 && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {lead.score}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {typeLabels[lead.type] || lead.type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {statusLabels[lead.status] || lead.status}
            </Badge>
          </div>

          {lead.last_contact_at && (
            <p className="text-xs text-muted-foreground">
              Ultimo contatto: {formatRelative(lead.last_contact_at)}
            </p>
          )}

          {lead.next_follow_up_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Follow-up: {formatRelative(lead.next_follow_up_at)}</span>
            </div>
          )}

          {budgetRange && (
            <p className="text-xs font-medium font-mono-data">{budgetRange}</p>
          )}

          {visibleZones.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {visibleZones.map((zone) => (
                <Badge key={zone} variant="outline" className="text-xs py-0">
                  {zone}
                </Badge>
              ))}
              {extraZonesCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  +{extraZonesCount}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </HoverScale>
    </Link>
  );
}
