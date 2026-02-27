'use client';

import { Clock, Phone, DoorOpen, StickyNote } from 'lucide-react';
import type { CensusContactLog as ContactLogType } from '@/types/database';

interface CensusContactLogProps {
  logs: ContactLogType[];
}

const TYPE_ICONS: Record<string, typeof Phone> = {
  door: DoorOpen,
  phone: Phone,
  note: StickyNote,
};

const TYPE_LABELS: Record<string, string> = {
  door: 'Porta a porta',
  phone: 'Telefonata',
  note: 'Nota',
};

const OUTCOME_LABELS: Record<string, string> = {
  no_answer: 'Nessuna risposta',
  not_interested: 'Non interessato',
  interested: 'Interessato',
  callback: 'Da richiamare',
  info_gathered: 'Informazioni raccolte',
};

const OUTCOME_COLORS: Record<string, string> = {
  no_answer: 'text-gray-400',
  not_interested: 'text-red-400',
  interested: 'text-green-400',
  callback: 'text-orange-400',
  info_gathered: 'text-blue-400',
};

export function CensusContactLog({ logs }: CensusContactLogProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nessun contatto registrato per questa unità
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const Icon = TYPE_ICONS[log.contact_type] || Clock;
        const outcomeColor = OUTCOME_COLORS[log.outcome] || 'text-muted-foreground';

        return (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {TYPE_LABELS[log.contact_type] || log.contact_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className={`text-sm ${outcomeColor}`}>
                {OUTCOME_LABELS[log.outcome] || log.outcome}
              </p>
              {log.notes && (
                <p className="text-xs text-muted-foreground">{log.notes}</p>
              )}
              {log.callback_date && (
                <p className="text-xs text-orange-400">
                  Richiamare il{' '}
                  {new Date(log.callback_date).toLocaleDateString('it-IT')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
