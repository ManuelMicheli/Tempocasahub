'use client';

import { MessageCircle, Users, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ConnectionStatusProps {
  monitoredContacts: number;
  totalContacts: number;
  recentSyncs: number;
}

export function ConnectionStatus({
  monitoredContacts,
  totalContacts,
  recentSyncs,
}: ConnectionStatusProps) {
  return (
    <div className="grid gap-3 grid-cols-3">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
            <Users className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="font-display font-mono-data text-2xl font-bold">{monitoredContacts}</p>
            <p className="text-xs text-muted-foreground">Monitorati</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-display font-mono-data text-2xl font-bold">{totalContacts}</p>
            <p className="text-xs text-muted-foreground">Contatti WA</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
            <RefreshCw className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="font-display font-mono-data text-2xl font-bold">{recentSyncs}</p>
            <p className="text-xs text-muted-foreground">Sync 24h</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
