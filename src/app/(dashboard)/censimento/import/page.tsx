import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { CensusImportWizard } from '@/components/census/census-import-wizard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImportPageProps {
  searchParams: Promise<{ zoneId?: string }>;
}

export default async function CensusImportPage({ searchParams }: ImportPageProps) {
  const { zoneId } = await searchParams;
  const supabase = await createClient();
  const agent = await getCurrentAgent();

  if (!agent) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Non autenticato. Effettua il login.
      </div>
    );
  }

  // If zoneId is provided, verify it exists
  let zone: { id: string; name: string } | null = null;

  if (zoneId) {
    const { data } = await supabase
      .from('census_zones')
      .select('id, name')
      .eq('id', zoneId)
      .single();

    if (!data) notFound();
    zone = data;
  } else {
    // Get the first zone
    const { data: zones } = await supabase
      .from('census_zones')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1);

    if (!zones || zones.length === 0) {
      return (
        <div className="p-6 text-center text-muted-foreground">
          Nessuna zona censimento trovata. Crea prima una zona dalla pagina censimento.
        </div>
      );
    }
    zone = zones[0];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/censimento/${zone.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Torna alla zona
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Importa dati Elettra</h1>
        <p className="text-sm text-muted-foreground">
          Importa i dati catastali esportati dalla piattaforma Elettra nella zona {zone.name}
        </p>
      </div>

      <CensusImportWizard zoneId={zone.id} zoneName={zone.name} />
    </div>
  );
}
