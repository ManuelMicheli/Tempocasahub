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
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-500',
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
  new_leads: 'text-blue-500',
  appointment: 'text-blue-500',
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
        const iconColor = typeIconColors[item.type] || 'text-gray-500';

        return (
          <div
            key={`${item.type}-${index}`}
            className={`flex items-center gap-3 rounded-lg border-l-4 bg-muted/30 p-3 ${priorityBorder[item.priority]}`}
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
