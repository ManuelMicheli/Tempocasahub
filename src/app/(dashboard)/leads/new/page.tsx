'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadForm } from '@/components/leads/lead-form';
import { VoiceInput } from '@/components/ai/voice-input';
import { PageTransition } from '@/components/motion';
import type { Lead } from '@/types/database';

export default function NewLeadPage() {
  const [aiData, setAiData] = useState<Partial<Lead> | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  const handleExtracted = (data: Record<string, unknown>) => {
    const leadData: Partial<Lead> = {
      full_name: (data.full_name as string) || '',
      phone: (data.phone as string) || undefined,
      email: (data.email as string) || undefined,
      type: (data.type as Lead['type']) || 'buyer',
      source: (data.source as string) || undefined,
      temperature: (data.temperature as Lead['temperature']) || 'warm',
      search_zones: (data.search_zones as string[]) || [],
      budget_min: (data.budget_min as number) || undefined,
      budget_max: (data.budget_max as number) || undefined,
      property_types: (data.property_types as string[]) || [],
      min_rooms: (data.min_rooms as number) || undefined,
      min_sqm: (data.min_sqm as number) || undefined,
      must_have: (data.must_have as string[]) || [],
      nice_to_have: (data.nice_to_have as string[]) || [],
      timeline: (data.timeline as string) || undefined,
      selling_address: (data.selling_address as string) || undefined,
      selling_price_requested: (data.selling_price_requested as number) || undefined,
      selling_price_estimated: (data.selling_price_estimated as number) || undefined,
      mandate_type: (data.mandate_type as string) || undefined,
      notes: (data.notes as string) || undefined,
    };

    setAiData(leadData);
    setShowForm(true);
  };

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/leads">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold font-display">Nuovo Lead</h1>
      </div>

      {/* Voice/AI Input */}
      <VoiceInput
        onExtracted={handleExtracted}
        extractEndpoint="/api/ai/extract-lead"
        placeholder="Es: Mario Rossi, telefono 333 1234567, cerca bilocale zona centro o sempione Milano, budget 200-300mila, deve avere il box, urgente..."
        entityLabel="il cliente"
      />

      {showForm && aiData && (
        <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 rounded-md p-3">
          I dati sono stati estratti dall&apos;AI e inseriti nel form. Rivedi e completa i campi mancanti.
        </div>
      )}

      {/* Form — key forces re-mount when AI fills data */}
      <LeadForm
        key={aiData ? 'ai-filled' : 'empty'}
        initialData={aiData as Lead | undefined}
      />
    </div>
    </PageTransition>
  );
}
