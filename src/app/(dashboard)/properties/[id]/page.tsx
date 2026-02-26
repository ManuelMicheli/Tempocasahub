import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Building2,
  Maximize2,
  DoorOpen,
  Layers,
  BedDouble,
  Bath,
  Calendar,
  Flame,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { deleteProperty } from '@/lib/actions/properties';
import type { Property } from '@/types/database';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  available: {
    label: 'Disponibile',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  reserved: {
    label: 'Riservato',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  draft: {
    label: 'Bozza',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  sold: {
    label: 'Venduto',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  withdrawn: {
    label: 'Ritirato',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

const CONDITION_LABELS: Record<string, string> = {
  nuovo: 'Nuovo',
  ristrutturato: 'Ristrutturato',
  buono: 'Buono',
  da_ristrutturare: 'Da ristrutturare',
};

const FEATURE_LABELS: Record<string, string> = {
  box: 'Box',
  balcone: 'Balcone',
  ascensore: 'Ascensore',
  giardino: 'Giardino',
  cantina: 'Cantina',
  terrazzo: 'Terrazzo',
  doppi_servizi: 'Doppi servizi',
  aria_condizionata: 'Aria condizionata',
  posto_auto: 'Posto auto',
};

const HEATING_LABELS: Record<string, string> = {
  autonomo: 'Autonomo',
  centralizzato: 'Centralizzato',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  appartamento: 'Appartamento',
  villa: 'Villa',
  loft: 'Loft',
  bilocale: 'Bilocale',
  trilocale: 'Trilocale',
  attico: 'Attico',
  monolocale: 'Monolocale',
  casa_indipendente: 'Casa indipendente',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function PropertyDetailPage({
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
  const statusConfig = STATUS_CONFIG[property.status] ?? STATUS_CONFIG.draft;

  async function handleDelete(): Promise<void> {
    'use server';
    await deleteProperty(property.id);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {property.title || property.address}
            </h1>
            <p className="text-sm text-muted-foreground">
              {property.address}, {property.city}
              {property.zone ? ` - ${property.zone}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/properties/${property.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Modifica
            </Link>
          </Button>
          <form action={handleDelete}>
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4" />
              Elimina
            </Button>
          </form>
        </div>
      </div>

      {/* Photo gallery / placeholder */}
      <div className="overflow-hidden rounded-lg border bg-muted">
        {property.photos && property.photos.length > 0 ? (
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {property.photos.map((url, i) => (
              <div
                key={i}
                className="aspect-video bg-cover bg-center"
                style={{ backgroundImage: `url(${url})` }}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Status + Price row */}
      <div className="flex flex-wrap items-center gap-4">
        <Badge className={`text-sm ${statusConfig.className}`}>
          {statusConfig.label}
        </Badge>
        <span className="text-2xl font-bold text-primary">
          {formatPrice(property.price)}
        </span>
        <span className="text-sm text-muted-foreground">
          {PROPERTY_TYPE_LABELS[property.property_type] ?? property.property_type}
        </span>
      </div>

      {/* Characteristics */}
      <Card>
        <CardHeader>
          <CardTitle>Caratteristiche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {property.sqm != null && (
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Superficie</p>
                  <p className="font-medium">{property.sqm} mq</p>
                </div>
              </div>
            )}
            {property.rooms != null && (
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Locali</p>
                  <p className="font-medium">{property.rooms}</p>
                </div>
              </div>
            )}
            {property.bedrooms != null && (
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Camere</p>
                  <p className="font-medium">{property.bedrooms}</p>
                </div>
              </div>
            )}
            {property.bathrooms != null && (
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Bagni</p>
                  <p className="font-medium">{property.bathrooms}</p>
                </div>
              </div>
            )}
            {property.floor != null && (
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Piano</p>
                  <p className="font-medium">
                    {property.floor}
                    {property.total_floors != null
                      ? ` / ${property.total_floors}`
                      : ''}
                  </p>
                </div>
              </div>
            )}
            {property.year_built != null && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Anno costruzione
                  </p>
                  <p className="font-medium">{property.year_built}</p>
                </div>
              </div>
            )}
            {property.heating && (
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Riscaldamento</p>
                  <p className="font-medium">
                    {HEATING_LABELS[property.heating] ?? property.heating}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Condition & Energy */}
      <div className="flex flex-wrap gap-2">
        {property.condition && (
          <Badge variant="outline" className="text-sm">
            Condizione:{' '}
            {CONDITION_LABELS[property.condition] ?? property.condition}
          </Badge>
        )}
        {property.energy_class && (
          <Badge variant="secondary" className="text-sm">
            Classe energetica: {property.energy_class}
          </Badge>
        )}
      </div>

      {/* Features */}
      {property.features && property.features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dotazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.features.map((f) => (
                <Badge key={f} variant="outline">
                  {FEATURE_LABELS[f] ?? f}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {property.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descrizione</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {property.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Virtual tour */}
      {property.virtual_tour_url && (
        <Card>
          <CardHeader>
            <CardTitle>Virtual Tour</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={property.virtual_tour_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Apri virtual tour
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CardContent>
        </Card>
      )}

      {/* Published on */}
      {property.published_on && property.published_on.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pubblicato su</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.published_on.map((portal) => (
                <Badge key={portal} variant="secondary">
                  {portal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internal notes */}
      {property.internal_notes && (
        <Card className="border-dashed bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Note interne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {property.internal_notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Owner */}
      {property.owner_lead_id && (
        <Card>
          <CardHeader>
            <CardTitle>Proprietario</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/leads/${property.owner_lead_id}`}
              className="text-sm text-primary hover:underline"
            >
              Vai al profilo del proprietario
            </Link>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Matches placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Match</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            I match verranno implementati prossimamente
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
