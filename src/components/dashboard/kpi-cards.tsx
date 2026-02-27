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
    bgColor: 'bg-primary/10 dark:bg-primary/20',
    iconColor: 'text-primary dark:text-primary',
  },
  {
    key: 'visitsThisWeek' as const,
    label: 'Visite questa settimana',
    icon: MapPin,
    bgColor: 'bg-primary/10 dark:bg-primary/20',
    iconColor: 'text-primary dark:text-primary',
  },
  {
    key: 'proposalsInProgress' as const,
    label: 'Proposte in corso',
    icon: FileText,
    bgColor: 'bg-primary/10 dark:bg-primary/20',
    iconColor: 'text-primary dark:text-primary',
  },
  {
    key: 'newMatches' as const,
    label: 'Nuovi match',
    icon: Zap,
    bgColor: 'bg-primary/10 dark:bg-primary/20',
    iconColor: 'text-primary dark:text-primary',
  },
];

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpiConfig.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className={`glass-card animate-in zoom-in-95 fade-in duration-500 delay-[${index * 100}ms]`}>
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.bgColor}`}
              >
                <Icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate font-medium">
                  {item.label}
                </p>
                <p className="text-2xl font-bold tracking-tight">{kpis[item.key]}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
