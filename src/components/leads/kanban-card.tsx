'use client';

import { useRouter } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRelative, daysSince } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types/database';

interface KanbanCardProps {
  lead: Lead;
  isDragOverlay?: boolean;
}

const temperatureColors = {
  hot: 'bg-red-500',
  warm: 'bg-yellow-500',
  cold: 'bg-gray-400',
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

export function KanbanCard({ lead, isDragOverlay = false }: KanbanCardProps) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tempColor = temperatureColors[lead.temperature] || temperatureColors.warm;
  const showWarning = needsAttentionWarning(lead);

  const budgetSummary =
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

  const handleClick = () => {
    if (!isDragging) {
      router.push(`/leads/${lead.id}`);
    }
  };

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={!isDragOverlay ? style : undefined}
      {...(!isDragOverlay ? attributes : {})}
      {...(!isDragOverlay ? listeners : {})}
      onClick={handleClick}
      className={cn(
        'rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-all select-none',
        isDragging && 'opacity-30',
        isDragOverlay && 'shadow-lg ring-2 ring-primary/20 rotate-2',
      )}
    >
      {/* Row 1: Name + temperature dot + score */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn('inline-block w-2 h-2 rounded-full shrink-0', tempColor)} />
          <span className="text-sm font-medium truncate">{lead.full_name}</span>
          {showWarning && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}
        </div>
        {lead.score > 0 && (
          <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 h-5">
            {lead.score}
          </Badge>
        )}
      </div>

      {/* Row 2: Last contact */}
      {lead.last_contact_at && (
        <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
          {formatRelative(lead.last_contact_at)}
        </p>
      )}

      {/* Row 3: Budget */}
      {budgetSummary && (
        <p className="text-xs font-medium mt-1">{budgetSummary}</p>
      )}

      {/* Row 4: Zone badges */}
      {visibleZones.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {visibleZones.map((zone) => (
            <Badge key={zone} variant="outline" className="text-[10px] px-1.5 py-0">
              {zone}
            </Badge>
          ))}
          {extraZonesCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              +{extraZonesCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
