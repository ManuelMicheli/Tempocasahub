import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/properties/property-card';
import { PropertyFilters } from '@/components/properties/property-filters';
import { PageTransition } from '@/components/motion';
import type { Property } from '@/types/database';

interface SearchParams {
  q?: string;
  status?: string;
  city?: string;
  price_min?: string;
  price_max?: string;
  type?: string;
  rooms_min?: string;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Apply filters
  if (params.q) {
    query = query.or(
      `title.ilike.%${params.q}%,address.ilike.%${params.q}%,city.ilike.%${params.q}%`
    );
  }

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params.city) {
    query = query.ilike('city', `%${params.city}%`);
  }

  if (params.price_min) {
    query = query.gte('price', Number(params.price_min));
  }

  if (params.price_max) {
    query = query.lte('price', Number(params.price_max));
  }

  if (params.type && params.type !== 'all') {
    query = query.eq('property_type', params.type);
  }

  if (params.rooms_min) {
    query = query.gte('rooms', Number(params.rooms_min));
  }

  const { data: properties } = await query;
  const items: Property[] = (properties as Property[]) ?? [];

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Immobili</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'immobile' : 'immobili'}{' '}
            {params.q || params.status || params.city || params.price_min || params.price_max || params.type || params.rooms_min
              ? 'trovati'
              : 'totali'}
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="h-4 w-4" />
            Nuovo Immobile
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <PropertyFilters />

      {/* Grid */}
      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">
            Nessun immobile trovato
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggiungi il tuo primo immobile!
          </p>
          <Button asChild className="mt-4">
            <Link href="/properties/new">
              <Plus className="h-4 w-4" />
              Nuovo Immobile
            </Link>
          </Button>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
