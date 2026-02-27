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
    <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView('kanban')}
        className={cn(
          'rounded-md h-7 px-3 gap-1.5 transition-all',
          currentView === 'kanban'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Columns3 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline text-xs font-medium">Kanban</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView('list')}
        className={cn(
          'rounded-md h-7 px-3 gap-1.5 transition-all',
          currentView === 'list'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="hidden sm:inline text-xs font-medium">Lista</span>
      </Button>
    </div>
  );
}
