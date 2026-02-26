import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/properties/property-form';
import type { Property } from '@/types/database';

export default async function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (!data) notFound();

  const property = data as Property;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/properties/${property.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Modifica Immobile</h1>
          <p className="text-sm text-muted-foreground">
            {property.title || property.address}
          </p>
        </div>
      </div>

      {/* Form */}
      <PropertyForm initialData={property} propertyId={property.id} />
    </div>
  );
}
