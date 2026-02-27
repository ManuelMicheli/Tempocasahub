'use client';

import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Users,
  FileText,
  StickyNote,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ClipboardList,
  User,
  History,
  Home,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDateTime, formatDate } from '@/lib/date';
import type { AppointmentBrief as AppointmentBriefType } from '@/lib/brief/generate-brief';
import type { InteractionType, Temperature } from '@/types/database';

// --- Type config for interaction icons ---

const TYPE_CONFIG: Record<
  InteractionType,
  { label: string; icon: typeof Phone }
> = {
  call_outbound: { label: 'Chiamata in uscita', icon: Phone },
  call_inbound: { label: 'Chiamata in entrata', icon: Phone },
  whatsapp_sent: { label: 'WhatsApp inviato', icon: MessageCircle },
  whatsapp_received: { label: 'WhatsApp ricevuto', icon: MessageCircle },
  email_sent: { label: 'Email inviata', icon: Mail },
  email_received: { label: 'Email ricevuta', icon: Mail },
  visit: { label: 'Visita', icon: MapPin },
  meeting: { label: 'Incontro', icon: Users },
  proposal: { label: 'Proposta', icon: FileText },
  note: { label: 'Nota', icon: StickyNote },
};

const TEMP_CONFIG: Record<Temperature, { label: string; className: string }> = {
  hot: { label: 'Caldo', className: 'bg-red-100 text-red-800 border-red-200' },
  warm: {
    label: 'Tiepido',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  cold: {
    label: 'Freddo',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

interface AppointmentBriefProps {
  brief: AppointmentBriefType;
}

export function AppointmentBrief({ brief }: AppointmentBriefProps) {
  const { appointment, lead, property, interactions, match, strengths, objections, aiSuggestions } =
    brief;

  const tempConfig = TEMP_CONFIG[lead.temperature] || TEMP_CONFIG.warm;

  return (
    <div className="space-y-6 max-w-3xl mx-auto print:max-w-none">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="font-display text-xl font-bold tracking-tight">
              BRIEF APPUNTAMENTO
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {appointment.scheduled_at
                ? formatDateTime(appointment.scheduled_at)
                : formatDateTime(appointment.created_at)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">
              {TYPE_CONFIG[appointment.type]?.label || appointment.type}
            </Badge>
            {appointment.completed_at && (
              <Badge variant="secondary">Completato</Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Client Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-semibold">{lead.full_name}</span>
            <Badge variant="outline" className={tempConfig.className}>
              {tempConfig.label}
            </Badge>
            <Badge
              variant="outline"
              className="bg-gray-100 text-gray-800 border-gray-200"
            >
              Score: {lead.score}
            </Badge>
          </div>

          {lead.phone && (
            <div className="text-sm">
              <span className="text-muted-foreground">Tel: </span>
              <a
                href={`tel:${lead.phone}`}
                className="text-primary underline underline-offset-4"
              >
                {lead.phone}
              </a>
            </div>
          )}

          {lead.email && (
            <div className="text-sm">
              <span className="text-muted-foreground">Email: </span>
              <a
                href={`mailto:${lead.email}`}
                className="text-primary underline underline-offset-4"
              >
                {lead.email}
              </a>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Cliente da: {formatDate(lead.created_at, 'dd MMMM yyyy')}
          </div>

          {lead.budget_min || lead.budget_max ? (
            <div className="text-sm">
              <span className="text-muted-foreground">Budget: </span>
              {lead.budget_min ? formatPrice(lead.budget_min) : '?'} -{' '}
              {lead.budget_max ? formatPrice(lead.budget_max) : '?'}
            </div>
          ) : null}

          {lead.must_have && lead.must_have.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Must-have: </span>
              {lead.must_have.join(', ')}
            </div>
          )}

          {lead.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Note: </span>
              {lead.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interaction History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Storico interazioni ({interactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessuna interazione precedente
            </p>
          ) : (
            <div className="space-y-2">
              {interactions.map((interaction) => {
                const config = TYPE_CONFIG[interaction.type] || TYPE_CONFIG.note;
                const Icon = config.icon;
                return (
                  <div
                    key={interaction.id}
                    className="flex items-start gap-3 py-2 border-b last:border-b-0"
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {config.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(
                            interaction.scheduled_at || interaction.created_at,
                          )}
                        </span>
                        {interaction.outcome && (
                          <Badge variant="outline" className="text-xs">
                            {interaction.outcome}
                          </Badge>
                        )}
                      </div>
                      {interaction.summary && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {interaction.summary}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Section */}
      {property && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              Immobile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-semibold text-base">
                {property.title || property.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {property.address}, {property.city}
                {property.zone ? ` - ${property.zone}` : ''}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Prezzo: </span>
                  <span className="font-medium">
                    {formatPrice(property.price)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Tipo: </span>
                  <span className="font-medium">{property.property_type}</span>
                </div>
                {property.sqm && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Superficie: </span>
                    <span className="font-medium">{property.sqm} mq</span>
                  </div>
                )}
                {property.rooms && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Locali: </span>
                    <span className="font-medium">{property.rooms}</span>
                  </div>
                )}
                {property.floor !== null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Piano: </span>
                    <span className="font-medium">
                      {property.floor}
                      {property.total_floors
                        ? `/${property.total_floors}`
                        : ''}
                    </span>
                  </div>
                )}
                {property.energy_class && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      Classe energetica:{' '}
                    </span>
                    <span className="font-medium">{property.energy_class}</span>
                  </div>
                )}
                {property.heating && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      Riscaldamento:{' '}
                    </span>
                    <span className="font-medium">{property.heating}</span>
                  </div>
                )}
                {property.condition && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Condizione: </span>
                    <span className="font-medium">{property.condition}</span>
                  </div>
                )}
              </div>

              {property.features && property.features.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground">
                    Caratteristiche:{' '}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {property.features.map((f) => (
                      <Badge key={f} variant="secondary" className="text-xs">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {match && (
              <>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  Match score:{' '}
                  <span className="font-bold text-foreground">
                    {match.score}
                  </span>
                  /100 - Status:{' '}
                  <span className="font-medium text-foreground">
                    {match.status}
                  </span>
                </div>
              </>
            )}

            {/* Strengths */}
            {strengths.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-display text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Punti di forza da evidenziare
                  </h4>
                  <ul className="space-y-1">
                    {strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-sm flex items-start gap-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Objections */}
            {objections.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-display text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Possibili obiezioni
                  </h4>
                  <ul className="space-y-1">
                    {objections.map((o, i) => (
                      <li
                        key={i}
                        className="text-sm flex items-start gap-2"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Suggerimenti AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted/50 border border-dashed p-4">
            <p className="text-sm italic leading-relaxed">{aiSuggestions}</p>
          </div>
        </CardContent>
      </Card>

      {/* Post-visit actions checklist */}
      <Card className="print:break-before-avoid">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Azioni post-visita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[
              'Registrare feedback',
              'Se interessato \u2192 proposta',
              'Se non interessato \u2192 motivazione',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <div className="h-4 w-4 rounded border border-muted-foreground/40 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
