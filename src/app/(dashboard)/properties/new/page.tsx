'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/properties/property-form';
import { VoiceInput } from '@/components/ai/voice-input';
import type { Property } from '@/types/database';

export default function NewPropertyPage() {
  const [aiData, setAiData] = useState<Partial<Property> | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  const handleExtracted = (data: Record<string, unknown>) => {
    // Map AI features array to match form's checkbox structure
    const propertyData: Partial<Property> = {
      title: (data.title as string) || undefined,
      address: (data.address as string) || '',
      city: (data.city as string) || '',
      zone: (data.zone as string) || undefined,
      property_type: (data.property_type as string) || '',
      price: (data.price as number) || 0,
      sqm: (data.sqm as number) || undefined,
      rooms: (data.rooms as number) || undefined,
      bedrooms: (data.bedrooms as number) || undefined,
      bathrooms: (data.bathrooms as number) || undefined,
      floor: (data.floor as number) ?? undefined,
      total_floors: (data.total_floors as number) || undefined,
      year_built: (data.year_built as number) || undefined,
      energy_class: (data.energy_class as string) || undefined,
      features: (data.features as string[]) || [],
      condition: (data.condition as string) || undefined,
      heating: (data.heating as string) || undefined,
      status: (data.status as Property['status']) || 'available',
      description: (data.description as string) || undefined,
    };

    setAiData(propertyData);
    setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/properties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuovo Immobile</h1>
      </div>

      {/* Voice/AI Input */}
      <VoiceInput
        onExtracted={handleExtracted}
        extractEndpoint="/api/ai/extract-property"
        placeholder="Es: Trilocale luminoso in via Roma 15, Milano centro, 85 mq, terzo piano, due camere, un bagno, box e balcone, prezzo 280mila, classe C, riscaldamento autonomo..."
        entityLabel="l'immobile"
      />

      {showForm && aiData && (
        <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 rounded-md p-3">
          I dati sono stati estratti dall&apos;AI e inseriti nel form. Rivedi e completa i campi mancanti.
        </div>
      )}

      {/* Form — key forces re-mount when AI fills data */}
      <PropertyForm
        key={aiData ? 'ai-filled' : 'empty'}
        initialData={aiData as Property | undefined}
      />
    </div>
  );
}
