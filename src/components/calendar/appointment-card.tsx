'use client';

import Link from 'next/link';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Users,
  FileText,
  StickyNote,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Interaction, InteractionType } from '@/types/database';

const TYPE_CONFIG: Record<InteractionType, { label: string; icon: typeof Phone; borderColor: string }> = {
  call_outbound: { label: 'Chiamata', icon: Phone, borderColor: 'border-l-gray-400' },
  call_inbound: { label: 'Chiamata', icon: Phone, borderColor: 'border-l-gray-400' },
  whatsapp_sent: { label: 'WhatsApp', icon: MessageCircle, borderColor: 'border-l-green-400' },
  whatsapp_received: { label: 'WhatsApp', icon: MessageCircle, borderColor: 'border-l-green-400' },
  email_sent: { label: 'Email', icon: Mail, borderColor: 'border-l-blue-400' },
  email_received: { label: 'Email', icon: Mail, borderColor: 'border-l-blue-400' },
  visit: { label: 'Visita', icon: MapPin, borderColor: 'border-l-blue-500' },
  meeting: { label: 'Incontro', icon: Users, borderColor: 'border-l-green-500' },
  proposal: { label: 'Proposta', icon: FileText, borderColor: 'border-l-orange-500' },
  note: { label: 'Nota', icon: StickyNote, borderColor: 'border-l-yellow-400' },
};

interface AppointmentCardProps {
  appointment: Interaction & {
    lead: { full_name: string };
    property?: { address: string } | null;
  };
  compact?: boolean;
}

export function AppointmentCard({ appointment, compact = false }: AppointmentCardProps) {
  const config = TYPE_CONFIG[appointment.type] || TYPE_CONFIG.note;
  const Icon = config.icon;

  const time = appointment.scheduled_at
    ? format(new Date(appointment.scheduled_at), 'HH:mm')
    : '--:--';

  const leadHref = appointment.lead_id ? `/leads/${appointment.lead_id}` : '#';

  if (compact) {
    return (
      <Link href={leadHref}>
        <div
          className={`rounded-md border border-l-4 ${config.borderColor} bg-card p-2 text-xs hover:bg-accent transition-colors cursor-pointer`}
        >
          <div className="flex items-center gap-1 font-medium">
            <span className="text-muted-foreground">{time}</span>
            <Icon className="h-3 w-3 shrink-0" />
          </div>
          <p className="truncate font-medium mt-0.5">{appointment.lead?.full_name}</p>
          {appointment.property?.address && (
            <p className="truncate text-muted-foreground mt-0.5">
              {appointment.property.address}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={leadHref}>
      <div
        className={`rounded-md border border-l-4 ${config.borderColor} bg-card p-3 hover:bg-accent transition-colors cursor-pointer`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">{time}</span>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-sm">{config.label}</span>
        </div>
        <p className="font-medium mt-1">{appointment.lead?.full_name}</p>
        {appointment.property?.address && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />
            {appointment.property.address}
          </p>
        )}
        {appointment.summary && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {appointment.summary}
          </p>
        )}
      </div>
    </Link>
  );
}
