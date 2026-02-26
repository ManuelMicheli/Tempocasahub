import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatRelative, formatDate } from '@/lib/date';
import type { Lead } from '@/types/database';

interface LeadDetailProps {
  lead: Lead;
}

const temperatureConfig = {
  hot: { color: 'bg-red-500', label: 'Caldo', badgeClass: 'bg-red-100 text-red-800 border-red-200' },
  warm: { color: 'bg-yellow-500', label: 'Tiepido', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  cold: { color: 'bg-gray-400', label: 'Freddo', badgeClass: 'bg-gray-100 text-gray-800 border-gray-200' },
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

const mandateLabels: Record<string, string> = {
  esclusiva: 'Esclusiva',
  non_esclusiva: 'Non esclusiva',
};

const timelineLabels: Record<string, string> = {
  urgente: 'Urgente',
  '1-3_mesi': '1-3 mesi',
  '3-6_mesi': '3-6 mesi',
  esplorativo: 'Esplorativo',
};

const sourceLabels: Record<string, string> = {
  portale: 'Portale immobiliare',
  passaparola: 'Passaparola',
  social: 'Social media',
  sito_web: 'Sito web',
  cartello: 'Cartello',
  walk_in: 'Walk-in',
  telefono: 'Telefono',
  evento: 'Evento',
  altro: 'Altro',
};

function formatCurrency(value: number | null): string {
  if (value === null) return '-';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '' || value === '-') return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-1.5">
      <span className="text-sm text-muted-foreground sm:w-40 shrink-0">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function LeadDetail({ lead }: LeadDetailProps) {
  const temp = temperatureConfig[lead.temperature] || temperatureConfig.warm;
  const showBuyer = lead.type === 'buyer' || lead.type === 'both';
  const showSeller = lead.type === 'seller' || lead.type === 'both';

  return (
    <div className="space-y-6">
      {/* Header con badge */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge className={temp.badgeClass}>
          <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${temp.color}`} />
          {temp.label}
        </Badge>
        <Badge variant="secondary">
          {statusLabels[lead.status] || lead.status}
        </Badge>
        <Badge variant="outline">
          {typeLabels[lead.type] || lead.type}
        </Badge>
        {lead.score > 0 && (
          <Badge variant="default">Score: {lead.score}</Badge>
        )}
      </div>

      {/* Anagrafica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anagrafica</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow label="Nome completo" value={lead.full_name} />
          <DetailRow label="Telefono" value={lead.phone} />
          <DetailRow label="Email" value={lead.email} />
          <DetailRow label="Fonte" value={lead.source ? (sourceLabels[lead.source] || lead.source) : null} />
        </CardContent>
      </Card>

      {/* Ricerca */}
      {showBuyer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ricerca</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label="Zone di ricerca"
              value={
                lead.search_zones && lead.search_zones.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {lead.search_zones.map((zone) => (
                      <Badge key={zone} variant="outline" className="text-xs">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                ) : null
              }
            />
            <DetailRow
              label="Budget"
              value={
                lead.budget_min || lead.budget_max
                  ? `${formatCurrency(lead.budget_min)} - ${formatCurrency(lead.budget_max)}`
                  : null
              }
            />
            <DetailRow
              label="Tipologia immobile"
              value={
                lead.property_types && lead.property_types.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {lead.property_types.map((pt) => (
                      <Badge key={pt} variant="outline" className="text-xs">
                        {pt}
                      </Badge>
                    ))}
                  </div>
                ) : null
              }
            />
            <DetailRow
              label="Locali minimi"
              value={lead.min_rooms !== null ? String(lead.min_rooms) : null}
            />
            <DetailRow
              label="Metratura minima"
              value={lead.min_sqm !== null ? `${lead.min_sqm} mq` : null}
            />
            <Separator className="my-2" />
            <DetailRow
              label="Must have"
              value={
                lead.must_have && lead.must_have.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {lead.must_have.map((item) => (
                      <Badge key={item} variant="default" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : null
              }
            />
            <DetailRow
              label="Nice to have"
              value={
                lead.nice_to_have && lead.nice_to_have.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {lead.nice_to_have.map((item) => (
                      <Badge key={item} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : null
              }
            />
            <DetailRow
              label="Timeline"
              value={lead.timeline ? (timelineLabels[lead.timeline] || lead.timeline) : null}
            />
          </CardContent>
        </Card>
      )}

      {/* Vendita */}
      {showSeller && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendita</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Indirizzo immobile" value={lead.selling_address} />
            <DetailRow
              label="Prezzo richiesto"
              value={lead.selling_price_requested !== null ? formatCurrency(lead.selling_price_requested) : null}
            />
            <DetailRow
              label="Prezzo stimato"
              value={lead.selling_price_estimated !== null ? formatCurrency(lead.selling_price_estimated) : null}
            />
            <DetailRow
              label="Tipo mandato"
              value={lead.mandate_type ? (mandateLabels[lead.mandate_type] || lead.mandate_type) : null}
            />
            <DetailRow
              label="Scadenza mandato"
              value={lead.mandate_expiry ? formatDate(lead.mandate_expiry) : null}
            />
          </CardContent>
        </Card>
      )}

      {/* Note */}
      {lead.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Date di sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow
            label="Ultimo contatto"
            value={lead.last_contact_at ? formatRelative(lead.last_contact_at) : 'Mai'}
          />
          <DetailRow
            label="Prossimo follow-up"
            value={lead.next_follow_up_at ? formatDate(lead.next_follow_up_at) : 'Non programmato'}
          />
          <DetailRow label="Creato il" value={formatDate(lead.created_at)} />
          <DetailRow label="Aggiornato il" value={formatDate(lead.updated_at)} />
        </CardContent>
      </Card>
    </div>
  );
}
