import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { syncCensusZone } from '@/lib/census/sync';
import { setupCornaredo } from '@/lib/census/setup-cornaredo';

/**
 * Pagina Censimento — redirige alla zona esistente o esegue auto-setup.
 * Il setup viene normalmente fatto durante la registrazione;
 * questa pagina funge da fallback se il setup non è avvenuto.
 */
export default async function CensimentoPage() {
  const supabase = await createClient();
  const agent = await getCurrentAgent();

  if (!agent) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Non autenticato. Effettua il login.
      </div>
    );
  }

  // Fast path: zona già esistente
  const { data: zones } = await supabase
    .from('census_zones')
    .select('id, synced_at')
    .order('created_at', { ascending: true })
    .limit(1);

  if (zones && zones.length > 0) {
    const zone = zones[0];
    if (!zone.synced_at) {
      await syncCensusZone(zone.id);
    }
    redirect(`/censimento/${zone.id}`);
  }

  // Fallback: setup non avvenuto durante la registrazione
  const result = await setupCornaredo(supabase, agent.id, agent.agency_id);

  if (result.success && result.zoneId) {
    redirect(`/censimento/${result.zoneId}`);
  }

  // Errore
  return (
    <div className="mx-auto max-w-md space-y-4 p-6 text-center">
      <h2 className="font-display text-lg font-bold text-destructive">
        Errore Configurazione Censimento
      </h2>
      <p className="text-sm text-muted-foreground">
        {result.error || 'Errore sconosciuto nella configurazione.'}
      </p>
      <p className="text-xs text-muted-foreground">
        Verifica che le migration siano state applicate nel progetto Supabase.
      </p>
      <pre className="mt-2 rounded bg-muted p-3 text-left text-xs overflow-x-auto">
{`-- Esegui le migration nell'SQL Editor di Supabase:
-- 1. supabase/migrations/003_census.sql
-- 2. supabase/migrations/004_agencies_insert_policy.sql`}
      </pre>
    </div>
  );
}
