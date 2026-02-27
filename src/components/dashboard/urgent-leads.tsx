import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import type { Lead } from '@/types/database';
import { daysSince } from '@/lib/date';

interface UrgentLeadsProps {
  leads: Lead[];
}

const temperatureColors: Record<string, string> = {
  hot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  warm: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]',
  cold: 'bg-gray-400',
};

function getUrgencyReason(lead: Lead): string {
  if (!lead.last_contact_at) {
    return 'Mai contattato';
  }
  const days = daysSince(lead.last_contact_at);
  if (days > 0) {
    return `Non contattato da ${days} ${days === 1 ? 'giorno' : 'giorni'}`;
  }
  if (lead.next_follow_up_at) {
    const followUpDays = daysSince(lead.next_follow_up_at);
    if (followUpDays > 0) {
      return 'Follow-up scaduto';
    }
  }
  return 'Richiede attenzione';
}

export function UrgentLeads({ leads }: UrgentLeadsProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">Nessun lead urgente</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {leads.map((lead) => {
        const dotColor = temperatureColors[lead.temperature] || 'bg-gray-400';
        const reason = getUrgencyReason(lead);

        return (
          <div
            key={lead.id}
            className="group flex items-center gap-3 rounded-md p-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
          >
            <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
            <Link
              href={`/leads/${lead.id}`}
              className="min-w-0 flex-1"
            >
              <p className="text-sm font-medium truncate font-display">{lead.full_name}</p>
              <p className="text-xs text-muted-foreground">{reason}</p>
            </Link>
            {lead.phone && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                <a href={`tel:${lead.phone}`} aria-label={`Chiama ${lead.full_name}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        );
      })}

      <div className="pt-2">
        <Button variant="link" size="sm" className="px-0 text-xs" asChild>
          <Link href="/leads?temperature=hot">Vedi tutti</Link>
        </Button>
      </div>
    </div>
  );
}
