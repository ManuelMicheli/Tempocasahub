import { createClient } from '@/lib/supabase/server';
import { MatchCenterClient } from '@/components/matches/match-center-client';
import { PageTransition } from '@/components/motion';
import type { Match, Lead, Property } from '@/types/database';

type MatchWithRelations = Match & { lead: Lead; property: Property };

export default async function MatchesPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from('matches')
    .select('*, lead:leads(*), property:properties(*)')
    .order('score', { ascending: false })
    .limit(100);

  const allMatches = ((matches as unknown as MatchWithRelations[]) ?? []).filter(
    (m) => m.lead && m.property
  );

  const suggested = allMatches.filter((m) => m.status === 'suggested');
  const sent = allMatches.filter(
    (m) => m.status === 'sent' || m.status === 'visit_booked'
  );
  const history = allMatches.filter(
    (m) =>
      m.status !== 'suggested' &&
      m.status !== 'sent' &&
      m.status !== 'visit_booked'
  );

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Match Center</h1>
        <p className="text-sm text-muted-foreground">
          Gestisci i match tra immobili e clienti
        </p>
      </div>

      <MatchCenterClient
        suggested={suggested}
        sent={sent}
        history={history}
      />
    </div>
    </PageTransition>
  );
}
