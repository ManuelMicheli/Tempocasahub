import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Flame,
  PhoneForwarded,
  UserPlus,
  CalendarClock,
  FileWarning,
  Clock,
} from 'lucide-react';

export type AgendaItem = {
  type: 'hot_lead' | 'follow_up' | 'new_leads' | 'appointment' | 'mandate_expiry';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  time?: string;
  link?: string;
  count?: number;
};

interface TodayAgendaProps {
  items: AgendaItem[];
}

const priorityBorder: Record<AgendaItem['priority'], string> = {
  high: 'border-l-red-500 shadow-[[-2px_0_8px_rgba(239,68,68,0.2)]]',
  medium: 'border-l-yellow-500 shadow-[[-2px_0_8px_rgba(234,179,8,0.2)]]',
  low: 'border-l-primary shadow-[[-2px_0_8px_rgba(0,166,80,0.2)]]',
};

const typeIcons: Record<AgendaItem['type'], React.ElementType> = {
  hot_lead: Flame,
  follow_up: PhoneForwarded,
  new_leads: UserPlus,
  appointment: CalendarClock,
  mandate_expiry: FileWarning,
};

const typeIconColors: Record<AgendaItem['type'], string> = {
  hot_lead: 'text-red-500',
  follow_up: 'text-yellow-600',
  new_leads: 'text-primary',
  appointment: 'text-primary',
  mandate_expiry: 'text-amber-600',
};

export function TodayAgenda({ items }: TodayAgendaProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          Nessuna attivita per oggi. Buon lavoro!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const Icon = typeIcons[item.type] || Clock;
        const iconColor = typeIconColors[item.type] || 'text-muted-foreground';

        return (
          <div
            key={`${item.type}-${index}`}
            className={`group flex items-center gap-3 rounded-lg border-l-4 bg-gradient-to-r from-muted/40 to-transparent hover:from-muted/60 transition-all p-3 ${priorityBorder[item.priority]}`}
          >
            <div className="shrink-0">
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">
                {item.title}
                {item.count !== undefined && item.count > 0 && (
                  <span className="ml-1 text-muted-foreground font-normal">
                    ({item.count})
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </p>
              {item.time && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.time}
                </p>
              )}
            </div>
            {item.link && (
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href={item.link}>Vai</Link>
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
