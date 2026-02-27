'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Map, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CensusViewToggleProps {
  currentView: 'map' | 'list';
}

export function CensusViewToggle({ currentView }: CensusViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(view: 'map' | 'list') {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex rounded-lg border">
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        className="rounded-r-none"
        onClick={() => setView('list')}
      >
        <List className="mr-1 h-4 w-4" />
        Lista
      </Button>
      <Button
        variant={currentView === 'map' ? 'default' : 'ghost'}
        size="sm"
        className="rounded-l-none"
        onClick={() => setView('map')}
      >
        <Map className="mr-1 h-4 w-4" />
        Mappa
      </Button>
    </div>
  );
}
