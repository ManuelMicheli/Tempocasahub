import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MatchWithDetails {
  id: string;
  score: number;
  lead: { full_name: string };
  property: { address: string; city: string; price: number };
}

interface NewMatchesProps {
  matches: MatchWithDetails[];
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-green-600 text-white';
  if (score >= 80) return 'bg-green-500 text-white';
  if (score >= 70) return 'bg-yellow-500 text-white';
  return 'bg-gray-400 text-white';
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}k`;
  return String(price);
}

export function NewMatches({ matches }: NewMatchesProps) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">Nessun nuovo match</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {matches.map((match) => {
        const scoreColor = getScoreColor(match.score);

        return (
          <div
            key={match.id}
            className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors"
          >
            <Badge className={`shrink-0 ${scoreColor} border-0`}>
              {match.score}%
            </Badge>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {match.property.address}, {match.property.city}
              </p>
              <p className="text-xs text-muted-foreground">
                {match.lead.full_name} &middot; &euro;{formatPrice(match.property.price)}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0" asChild>
              <Link href="/matches">Vedi</Link>
            </Button>
          </div>
        );
      })}

      <div className="pt-2">
        <Button variant="link" size="sm" className="px-0 text-xs" asChild>
          <Link href="/matches">Vedi tutti</Link>
        </Button>
      </div>
    </div>
  );
}
