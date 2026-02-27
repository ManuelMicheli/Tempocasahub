'use client';

import { User, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CensusOwner } from '@/types/database';

interface CensusOwnerCardProps {
  owner: CensusOwner;
}

export function CensusOwnerCard({ owner }: CensusOwnerCardProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <User className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{owner.full_name}</span>
              {!owner.is_natural_person && (
                <Badge variant="outline" className="text-[10px]">
                  Persona giuridica
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {owner.fiscal_code && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {owner.fiscal_code}
                </span>
              )}
              {owner.ownership_type && <span>{owner.ownership_type}</span>}
              {owner.ownership_share && <span>Quota: {owner.ownership_share}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
