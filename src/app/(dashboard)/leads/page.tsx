import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { Button } from '@/components/ui/button';
import { LeadCard } from '@/components/leads/lead-card';
import { LeadFilters } from '@/components/leads/lead-filters';
import type { Lead } from '@/types/database';

interface LeadsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    temperature?: string;
    source?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const agent = await getCurrentAgent();

  if (!agent) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Non autenticato. Effettua il login per visualizzare i lead.
      </div>
    );
  }

  let query = supabase
    .from('leads')
    .select('*')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false });

  if (params.search) {
    const search = `%${params.search}%`;
    query = query.or(`full_name.ilike.${search},phone.ilike.${search},email.ilike.${search}`);
  }

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params.temperature && params.temperature !== 'all') {
    query = query.eq('temperature', params.temperature);
  }

  if (params.source && params.source !== 'all') {
    query = query.eq('source', params.source);
  }

  const { data: leads } = await query;
  const leadsList = (leads as Lead[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead</h1>
          <p className="text-sm text-muted-foreground">
            {leadsList.length} {leadsList.length === 1 ? 'risultato' : 'risultati'}
          </p>
        </div>
        <Button asChild>
          <Link href="/leads/new">
            <Plus className="h-4 w-4" />
            Nuovo Lead
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <LeadFilters />

      {/* Grid */}
      {leadsList.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leadsList.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            Nessun lead trovato. Aggiungi il tuo primo lead!
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/leads/new">
              <Plus className="h-4 w-4" />
              Nuovo Lead
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
