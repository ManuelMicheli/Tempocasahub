import Link from 'next/link';
import { Building2, Maximize2, DoorOpen, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HoverScale } from '@/components/motion';
import type { Property } from '@/types/database';

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
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
  aria_condizionata: 'A/C',
  posto_auto: 'Posto auto',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const statusConfig = STATUS_CONFIG[property.status] ?? STATUS_CONFIG.draft;
  const displayTitle = property.title || property.address;
  const features = property.features ?? [];
  const visibleFeatures = features.slice(0, 3);
  const extraCount = features.length - 3;

  return (
    <HoverScale>
    <Link href={`/properties/${property.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        {/* Photo area */}
        <div className="relative h-48 w-full bg-muted">
          {property.photos && property.photos.length > 0 ? (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${property.photos[0]})` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute left-2 top-2">
            <Badge className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="line-clamp-1 font-semibold group-hover:text-primary">
            {displayTitle}
          </h3>

          {/* Location */}
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
            {property.city}
            {property.zone ? ` - ${property.zone}` : ''}
          </p>

          {/* Price */}
          <p className="mt-2 text-lg font-bold text-primary font-mono-data">
            {formatPrice(property.price)}
          </p>

          {/* Stats row */}
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {property.sqm != null && (
              <span className="flex items-center gap-1">
                <Maximize2 className="h-3.5 w-3.5" />
                {property.sqm} mq
              </span>
            )}
            {property.rooms != null && (
              <span className="flex items-center gap-1">
                <DoorOpen className="h-3.5 w-3.5" />
                {property.rooms} locali
              </span>
            )}
            {property.floor != null && (
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                P. {property.floor}
                {property.total_floors != null
                  ? `/${property.total_floors}`
                  : ''}
              </span>
            )}
          </div>

          {/* Badges row */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {/* Condition badge */}
            {property.condition && (
              <Badge variant="outline" className="text-xs">
                {CONDITION_LABELS[property.condition] ?? property.condition}
              </Badge>
            )}

            {/* Energy class badge */}
            {property.energy_class && (
              <Badge variant="secondary" className="text-xs">
                Classe {property.energy_class}
              </Badge>
            )}

            {/* Feature badges */}
            {visibleFeatures.map((f) => (
              <Badge key={f} variant="outline" className="text-xs font-normal">
                {FEATURE_LABELS[f] ?? f}
              </Badge>
            ))}
            {extraCount > 0 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{extraCount}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
    </HoverScale>
  );
}
