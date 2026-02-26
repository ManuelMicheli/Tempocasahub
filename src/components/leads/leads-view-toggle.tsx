'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LayoutGrid, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LeadsViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'kanban';

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'kanban') {
      params.delete('view');
    } else {
      params.set('view', view);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center border rounded-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView('kanban')}
        className={cn(
          'rounded-r-none h-8 px-3 gap-1.5',
          currentView === 'kanban' && 'bg-muted',
        )}
      >
        <Columns3 className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Kanban</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView('list')}
        className={cn(
          'rounded-l-none h-8 px-3 gap-1.5',
          currentView === 'list' && 'bg-muted',
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Lista</span>
      </Button>
    </div>
  );
}
