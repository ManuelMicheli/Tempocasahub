import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CensusZone } from '@/types/database';

interface CensusZoneCardProps {
  zone: CensusZone;
}

export function CensusZoneCard({ zone }: CensusZoneCardProps) {
  const progress =
    zone.total_units > 0
      ? Math.round((zone.contacted_count / zone.total_units) * 100)
      : 0;

  return (
    <Link href={`/censimento/${zone.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{zone.name}</CardTitle>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {zone.province && <span>{zone.province}</span>}
            {zone.municipality_code && (
              <Badge variant="outline" className="text-[10px]">
                {zone.municipality_code}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-lg font-bold">{zone.total_buildings}</div>
              <div className="text-muted-foreground">Edifici</div>
            </div>
            <div>
              <div className="text-lg font-bold">{zone.total_units}</div>
              <div className="text-muted-foreground">Unità</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">
                {zone.interested_count}
              </div>
              <div className="text-muted-foreground">Interessati</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Avanzamento</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {zone.synced_at && (
            <p className="text-[10px] text-muted-foreground">
              Ultimo sync:{' '}
              {new Date(zone.synced_at).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
