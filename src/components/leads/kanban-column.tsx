'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { KanbanCard } from './kanban-card';
import type { Lead, LeadStatus } from '@/types/database';

interface KanbanColumnProps {
  status: LeadStatus;
  title: string;
  leads: Lead[];
  color: string;
}

export function KanbanColumn({ status, title, leads, color }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  const leadIds = leads.map((lead) => lead.id);

  return (
    <div className="flex flex-col min-w-[240px] max-w-[240px] md:min-w-[270px] md:max-w-[270px] lg:min-w-[280px] lg:max-w-[280px] flex-shrink-0">
      {/* Column header */}
      <div
        className={cn(
          'rounded-t-lg border-t-[3px] border-x border-b bg-muted/40 px-3 py-2',
        )}
        style={{ borderTopColor: color }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold font-display">{title}</h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {leads.length}
          </Badge>
        </div>
      </div>

      {/* Column content - droppable area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto rounded-b-lg border-x border-b p-2 space-y-2',
          'transition-colors duration-150',
          isOver ? 'bg-accent/50' : 'bg-muted/20',
        )}
        style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '200px' }}
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            Nessun lead
          </div>
        )}
      </div>
    </div>
  );
}
