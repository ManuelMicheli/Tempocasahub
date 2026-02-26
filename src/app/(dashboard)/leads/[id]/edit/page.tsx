import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { LeadForm } from '@/components/leads/lead-form';
import type { Lead } from '@/types/database';

interface EditLeadPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLeadPage({ params }: EditLeadPageProps) {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/leads/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Modifica Lead</h1>
      </div>
      <LeadForm initialData={typedLead} leadId={id} />
    </div>
  );
}
