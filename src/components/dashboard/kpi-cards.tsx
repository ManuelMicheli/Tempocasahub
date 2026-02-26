import { Card, CardContent } from '@/components/ui/card';
import { Users, MapPin, FileText, Zap } from 'lucide-react';

interface KpiCardsProps {
  kpis: {
    activeLeads: number;
    visitsThisWeek: number;
    proposalsInProgress: number;
    newMatches: number;
  };
}

const kpiConfig = [
  {
    key: 'activeLeads' as const,
    label: 'Lead attivi',
    icon: Users,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    key: 'visitsThisWeek' as const,
    label: 'Visite questa settimana',
    icon: MapPin,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    key: 'proposalsInProgress' as const,
    label: 'Proposte in corso',
    icon: FileText,
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    key: 'newMatches' as const,
    label: 'Nuovi match',
    icon: Zap,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
];

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpiConfig.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key}>
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.bgColor}`}
              >
                <Icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {item.label}
                </p>
                <p className="text-2xl font-bold">{kpis[item.key]}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
