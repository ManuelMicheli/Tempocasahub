'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MatchCard } from '@/components/matches/match-card';
import { MatchDetailDialog } from '@/components/matches/match-detail-dialog';
import type { Match, Lead, Property } from '@/types/database';

type MatchWithRelations = Match & { lead: Lead; property: Property };

interface MatchCenterClientProps {
  suggested: MatchWithRelations[];
  sent: MatchWithRelations[];
  history: MatchWithRelations[];
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function MatchGrid({ matches, onOpenDetail }: { matches: MatchWithRelations[]; onOpenDetail: (m: MatchWithRelations) => void }) {
  if (matches.length === 0) {
    return <EmptyState message="Nessun match in questa categoria." />;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} onOpenDetail={onOpenDetail} />
      ))}
    </div>
  );
}

export function MatchCenterClient({ suggested, sent, history }: MatchCenterClientProps) {
  const [selectedMatch, setSelectedMatch] = useState<MatchWithRelations | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleOpenDetail(match: MatchWithRelations) {
    setSelectedMatch(match);
    setDialogOpen(true);
  }

  return (
    <>
      <Tabs defaultValue="suggested" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggested" className="gap-2">
            Nuovi suggerimenti
            <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] justify-center rounded-full px-1.5 text-[10px]">
              {suggested.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            Inviati
            <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] justify-center rounded-full px-1.5 text-[10px]">
              {sent.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            Storico
            <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] justify-center rounded-full px-1.5 text-[10px]">
              {history.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested">
          <MatchGrid matches={suggested} onOpenDetail={handleOpenDetail} />
        </TabsContent>

        <TabsContent value="sent">
          <MatchGrid matches={sent} onOpenDetail={handleOpenDetail} />
        </TabsContent>

        <TabsContent value="history">
          <MatchGrid matches={history} onOpenDetail={handleOpenDetail} />
        </TabsContent>
      </Tabs>

      <MatchDetailDialog
        match={selectedMatch}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
