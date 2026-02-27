import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { syncCensusZone } from '@/lib/census/sync';

/**
 * Pagina Censimento — auto-setup Cornaredo al primo accesso.
 * Se esiste già una zona, redirige alla prima zona disponibile.
 * Se non esiste, crea "Cornaredo" e sincronizza i dati mock.
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

  // Controlla se esistono zone
  const { data: zones } = await supabase
    .from('census_zones')
    .select('id, synced_at')
    .order('created_at', { ascending: true })
    .limit(1);

  if (zones && zones.length > 0) {
    const zone = zones[0];

    // Se la zona non è ancora stata sincronizzata, lancia il sync
    if (!zone.synced_at) {
      await syncCensusZone(zone.id);
    }

    redirect(`/censimento/${zone.id}`);
  }

  // Nessuna zona — auto-setup agenzia + Cornaredo
  let agencyId = agent.agency_id;

  if (!agencyId) {
    // Prova a trovare un'agenzia esistente
    const { data: existingAgencies } = await supabase
      .from('agencies')
      .select('id')
      .limit(1);

    if (existingAgencies && existingAgencies.length > 0) {
      agencyId = existingAgencies[0].id;
    } else {
      // Crea una nuova agenzia
      const { data: newAgency, error: agencyError } = await supabase
        .from('agencies')
        .insert({ name: 'Tempo Casa Cornaredo', city: 'Cornaredo' })
        .select()
        .single();

      if (agencyError) {
        return (
          <div className="mx-auto max-w-md space-y-4 p-6 text-center">
            <h2 className="text-lg font-bold text-destructive">Configurazione Agenzia</h2>
            <p className="text-sm text-muted-foreground">
              Non è stato possibile creare l&apos;agenzia automaticamente.
              Devi applicare la migration <code className="rounded bg-muted px-1">004_agencies_insert_policy.sql</code> nel
              tuo progetto Supabase per abilitare la creazione di agenzie.
            </p>
            <p className="text-xs text-muted-foreground">
              Errore: {agencyError.message}
            </p>
            <pre className="mt-2 rounded bg-muted p-3 text-left text-xs overflow-x-auto">
{`-- Esegui in Supabase SQL Editor:
CREATE POLICY "agencies_insert" ON agencies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "agencies_update" ON agencies
  FOR UPDATE USING (
    id IN (SELECT agency_id FROM agents
           WHERE user_id = auth.uid())
  );`}
            </pre>
          </div>
        );
      }

      agencyId = newAgency.id;
    }

    // Associa l'agente all'agenzia
    if (agencyId) {
      await supabase
        .from('agents')
        .update({ agency_id: agencyId })
        .eq('id', agent.id);
    }
  }

  if (!agencyId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Errore nella configurazione dell&apos;agenzia. Contatta l&apos;amministratore.
      </div>
    );
  }

  // Crea zona Cornaredo
  const { data: newZone, error: zoneError } = await supabase
    .from('census_zones')
    .insert({
      agency_id: agencyId,
      name: 'Cornaredo',
      municipality_code: 'D019',
      province: 'MI',
      region: 'Lombardia',
    })
    .select()
    .single();

  if (zoneError || !newZone) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6 text-center">
        <h2 className="text-lg font-bold text-destructive">Errore Creazione Zona</h2>
        <p className="text-sm text-muted-foreground">
          Non è stato possibile creare la zona Cornaredo.
          Verifica che la migration <code className="rounded bg-muted px-1">003_census.sql</code> sia stata applicata.
        </p>
        {zoneError && (
          <p className="text-xs text-muted-foreground">
            Errore: {zoneError.message}
          </p>
        )}
        <pre className="mt-2 rounded bg-muted p-3 text-left text-xs overflow-x-auto">
{`-- Esegui le migration nell'SQL Editor di Supabase:
-- 1. supabase/migrations/003_census.sql
-- 2. supabase/migrations/004_agencies_insert_policy.sql`}
        </pre>
      </div>
    );
  }

  // Sincronizza dati mock
  await syncCensusZone(newZone.id);

  redirect(`/censimento/${newZone.id}`);
}
