import { Card, CardContent } from '@/components/ui/card';
import { StaggerContainer, StaggerItem } from '@/components/motion';
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
    bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-500',
  },
  {
    key: 'visitsThisWeek' as const,
    label: 'Visite questa settimana',
    icon: MapPin,
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-500',
  },
  {
    key: 'proposalsInProgress' as const,
    label: 'Proposte in corso',
    icon: FileText,
    bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-500',
  },
  {
    key: 'newMatches' as const,
    label: 'Nuovi match',
    icon: Zap,
    bgColor: 'bg-violet-500/10 dark:bg-violet-500/20',
    iconColor: 'text-violet-500',
  },
];

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <StaggerContainer className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpiConfig.map((item) => {
        const Icon = item.icon;
        return (
          <StaggerItem key={item.key}>
            <Card className="glass-card">
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
                  <p className="text-2xl font-bold tracking-tight font-mono-data">{kpis[item.key]}</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
