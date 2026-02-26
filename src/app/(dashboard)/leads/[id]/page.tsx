import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadDetail } from '@/components/leads/lead-detail';
import { DeleteLeadButton } from '@/components/leads/delete-lead-button';
import type { Lead } from '@/types/database';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (!lead) {
    notFound();
  }

  const typedLead = lead as Lead;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{typedLead.full_name}</h1>
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

      {/* Interazioni - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Le interazioni verranno implementate prossimamente.
          </p>
        </CardContent>
      </Card>

      {/* Match - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            I match verranno implementati prossimamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
