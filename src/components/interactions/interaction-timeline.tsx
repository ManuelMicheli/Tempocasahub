'use client';

import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Users,
  FileText,
  StickyNote,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/date';
import type { Interaction, InteractionType } from '@/types/database';

const TYPE_CONFIG: Record<InteractionType, { label: string; icon: typeof Phone; color: string }> = {
  call_outbound: { label: 'Chiamata in uscita', icon: Phone, color: 'text-gray-500' },
  call_inbound: { label: 'Chiamata in entrata', icon: Phone, color: 'text-gray-500' },
  whatsapp_sent: { label: 'WhatsApp inviato', icon: MessageCircle, color: 'text-green-500' },
  whatsapp_received: { label: 'WhatsApp ricevuto', icon: MessageCircle, color: 'text-green-500' },
  email_sent: { label: 'Email inviata', icon: Mail, color: 'text-blue-500' },
  email_received: { label: 'Email ricevuta', icon: Mail, color: 'text-blue-500' },
  visit: { label: 'Visita', icon: MapPin, color: 'text-indigo-500' },
  meeting: { label: 'Incontro', icon: Users, color: 'text-purple-500' },
  proposal: { label: 'Proposta', icon: FileText, color: 'text-orange-500' },
  note: { label: 'Nota', icon: StickyNote, color: 'text-yellow-500' },
};

const OUTCOME_CONFIG: Record<string, { label: string; className: string }> = {
  interested: { label: 'Interessato', className: 'bg-green-100 text-green-800 border-green-200' },
  not_interested: { label: 'Non interessato', className: 'bg-red-100 text-red-800 border-red-200' },
  thinking: { label: 'Ci pensa', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  no_answer: { label: 'Nessuna risposta', className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

interface InteractionWithProperty extends Interaction {
  property?: { address: string } | null;
}

interface InteractionTimelineProps {
  interactions: InteractionWithProperty[];
}

export function InteractionTimeline({ interactions }: InteractionTimelineProps) {
  if (interactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Nessuna interazione registrata
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical timeline line */}
      <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-border" />

      {interactions.map((interaction) => {
        const config = TYPE_CONFIG[interaction.type] || TYPE_CONFIG.note;
        const Icon = config.icon;
        const outcomeConfig = interaction.outcome
          ? OUTCOME_CONFIG[interaction.outcome]
          : null;

        return (
          <div key={interaction.id} className="relative flex gap-4 pb-6">
            {/* Icon circle */}
            <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background ${config.color}`}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{config.label}</span>
                {outcomeConfig && (
                  <Badge variant="outline" className={outcomeConfig.className}>
                    {outcomeConfig.label}
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTime(interaction.scheduled_at || interaction.created_at)}
              </p>

              {interaction.summary && (
                <p className="text-sm mt-1">{interaction.summary}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-1">
                {interaction.property?.address && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {interaction.property.address}
                  </span>
                )}
                {interaction.duration_minutes && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {interaction.duration_minutes} min
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
