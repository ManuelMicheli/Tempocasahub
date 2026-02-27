'use client';

import { Building2, Users, UserCheck, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { CensusZone } from '@/types/database';

interface CensusZoneStatsProps {
  zone: CensusZone;
}

export function CensusZoneStats({ zone }: CensusZoneStatsProps) {
  const progress =
    zone.total_units > 0
      ? Math.round((zone.contacted_count / zone.total_units) * 100)
      : 0;

  const stats = [
    {
      label: 'Edifici',
      value: zone.total_buildings,
      icon: Building2,
    },
    {
      label: 'Unità',
      value: zone.total_units,
      icon: Users,
    },
    {
      label: 'Contattati',
      value: zone.contacted_count,
      icon: UserCheck,
      color: 'text-blue-500',
    },
    {
      label: 'Interessati',
      value: zone.interested_count,
      icon: UserCheck,
      color: 'text-green-500',
    },
    {
      label: 'Avanzamento',
      value: `${progress}%`,
      icon: Percent,
      color: progress > 50 ? 'text-green-500' : 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-3">
            <stat.icon
              className={`h-5 w-5 shrink-0 ${stat.color || 'text-muted-foreground'}`}
            />
            <div>
              <p className={`text-lg font-bold ${stat.color || ''}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
