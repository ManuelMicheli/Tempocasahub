import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadDetail } from '@/components/leads/lead-detail';
import { DeleteLeadButton } from '@/components/leads/delete-lead-button';
import { InteractionForm } from '@/components/interactions/interaction-form';
import { InteractionTimeline } from '@/components/interactions/interaction-timeline';
import { PostVisitForm } from '@/components/interactions/post-visit-form';
import { PageTransition } from '@/components/motion';
import type { Lead, Interaction, Match, Property, MatchStatus } from '@/types/database';

const MATCH_STATUS_CONFIG: Record<MatchStatus, { label: string; className: string }> = {
  suggested: { label: 'Suggerito', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  sent: { label: 'Inviato', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  visit_booked: { label: 'Visita prenotata', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  visited: { label: 'Visitato', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  interested: { label: 'Interessato', className: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Scartato', className: 'bg-red-100 text-red-800 border-red-200' },
  proposal: { label: 'Proposta', className: 'bg-orange-100 text-orange-800 border-orange-200' },
};

function getScoreBadgeColor(score: number): string {
  if (score >= 80) return 'bg-green-500 text-white';
  if (score >= 60) return 'bg-yellow-500 text-white';
  return 'bg-gray-400 text-white';
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const agent = await getCurrentAgent();

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (!lead) {
    notFound();
  }

  const typedLead = lead as Lead;

  // Fetch interactions for this lead
  const { data: interactions } = await supabase
    .from('interactions')
    .select('*, property:properties(address)')
    .eq('lead_id', id)
    .order('created_at', { ascending: false });

  // Fetch agent's properties for the interaction form
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, address')
    .eq('agent_id', agent?.id ?? '')
    .order('address');

  // Fetch matches for this lead
  const { data: matchesData } = await supabase
    .from('matches')
    .select('*, property:properties(*)')
    .eq('lead_id', id)
    .order('score', { ascending: false });

  const leadMatches = (matchesData as unknown as (Match & { property: Property })[]) ?? [];

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold font-display">{typedLead.full_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/leads/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Modifica
            </Link>
          </Button>
          <DeleteLeadButton leadId={id} leadName={typedLead.full_name} />
        </div>
      </div>

      {/* Lead Detail */}
      <LeadDetail lead={typedLead} />

      {/* Interazioni */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Interazioni</CardTitle>
          <InteractionForm
            leadId={id}
            properties={properties ?? []}
          />
        </CardHeader>
        <CardContent>
          {/* Post-visit feedback buttons for visits without outcome */}
          {(() => {
            const typedInteractions = (interactions as (Interaction & { property?: { address: string } | null })[]) ?? [];
            const pendingVisits = typedInteractions.filter(
              (i) => (i.type === 'visit' || i.type === 'meeting') && !i.outcome,
            );
            if (pendingVisits.length === 0) return null;
            return (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Visite senza feedback
                </p>
                {pendingVisits.map((visit) => {
                  const matchForVisit = visit.property_id
                    ? leadMatches.find((m) => m.property_id === visit.property_id)
                    : undefined;
                  return (
                    <div
                      key={visit.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2"
                    >
                      <span className="text-sm">
                        {visit.type === 'visit' ? 'Visita' : 'Incontro'}
                        {visit.property?.address ? ` - ${visit.property.address}` : ''}
                      </span>
                      <PostVisitForm
                        interactionId={visit.id}
                        leadId={id}
                        matchId={matchForVisit?.id}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <InteractionTimeline
            interactions={(interactions as (Interaction & { property?: { address: string } | null })[]) ?? []}
          />
        </CardContent>
      </Card>

      {/* Matched Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match ({leadMatches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {leadMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun match trovato per questo lead.
            </p>
          ) : (
            <div className="space-y-2">
              {leadMatches.map((m) => {
                const mStatus = MATCH_STATUS_CONFIG[m.status];
                return (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${getScoreBadgeColor(m.score)}`}
                      >
                        {m.score}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {m.property?.address ?? 'Immobile sconosciuto'}
                          {m.property?.city ? `, ${m.property.city}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.property?.price != null ? formatPrice(m.property.price) : ''}
                          {m.property?.sqm != null ? ` - ${m.property.sqm} mq` : ''}
                          {m.property?.rooms != null ? ` - ${m.property.rooms} locali` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={mStatus.className}>{mStatus.label}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/properties/${m.property_id}`}>
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Vedi
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}
