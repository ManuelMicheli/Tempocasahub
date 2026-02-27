'use client';

import { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { updateLeadStatus } from '@/lib/actions/leads';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import type { Lead, LeadStatus } from '@/types/database';

interface KanbanBoardProps {
  leads: Lead[];
}

const COLUMNS: { status: LeadStatus; title: string; color: string }[] = [
  { status: 'new', title: 'Nuovi', color: '#3b82f6' },           // blue
  { status: 'contacted', title: 'Contattati', color: '#06b6d4' }, // cyan
  { status: 'qualified', title: 'Qualificati', color: '#a855f7' }, // purple
  { status: 'active', title: 'Attivi', color: '#22c55e' },        // green
  { status: 'proposal', title: 'Proposta', color: '#f97316' },    // orange
  { status: 'negotiation', title: 'Negoziazione', color: '#f59e0b' }, // amber
  { status: 'closed_won', title: 'Chiuso', color: '#10b981' },    // emerald
  { status: 'closed_lost', title: 'Perso', color: '#ef4444' },    // red
];

export function KanbanBoard({ leads }: KanbanBoardProps) {
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dormantOpen, setDormantOpen] = useState(false);

  // Keep a snapshot for reverting on error
  const snapshotRef = useRef<Lead[]>(leads);

  // Sync when parent leads change (e.g. filters)
  const prevLeadsRef = useRef(leads);
  if (leads !== prevLeadsRef.current) {
    prevLeadsRef.current = leads;
    setLocalLeads(leads);
    snapshotRef.current = leads;
  }

  // Configure pointer sensor with a small activation distance to distinguish click from drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const activeLead = activeId
    ? localLeads.find((l) => l.id === activeId) ?? null
    : null;

  // Separate dormant leads from active pipeline
  const dormantLeads = localLeads.filter((l) => l.status === 'dormant');
  const pipelineLeads = localLeads.filter((l) => l.status !== 'dormant');

  // Group pipeline leads by status
  const leadsByStatus = COLUMNS.reduce<Record<LeadStatus, Lead[]>>(
    (acc, col) => {
      acc[col.status] = pipelineLeads.filter((l) => l.status === col.status);
      return acc;
    },
    {} as Record<LeadStatus, Lead[]>
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    snapshotRef.current = localLeads;
  }, [localLeads]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);

      const { active, over } = event;
      if (!over) return;

      const leadId = String(active.id);
      // Determine target status: the over.id could be a column (status) or another card
      let targetStatus: LeadStatus | null = null;

      // Check if dropped on a column directly
      const isColumn = COLUMNS.some((col) => col.status === over.id);
      if (isColumn) {
        targetStatus = over.id as LeadStatus;
      } else {
        // Dropped on a card — find which column that card belongs to
        const targetLead = localLeads.find((l) => l.id === over.id);
        if (targetLead) {
          targetStatus = targetLead.status;
        }
      }

      if (!targetStatus) return;

      // Check if status actually changed
      const currentLead = localLeads.find((l) => l.id === leadId);
      if (!currentLead || currentLead.status === targetStatus) return;

      // Optimistic update
      setLocalLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status: targetStatus } : l
        )
      );

      // Call server action
      const result = await updateLeadStatus(leadId, targetStatus);
      if (result && 'error' in result) {
        // Revert on error
        setLocalLeads(snapshotRef.current);
      }
    },
    [localLeads]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="-mx-4 px-4 md:mx-0 md:px-0 flex gap-2 md:gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              color={col.color}
              leads={leadsByStatus[col.status] || []}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <div className="w-[224px] md:w-[254px] lg:w-[264px]">
              <KanbanCard lead={activeLead} isDragOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dormant leads collapsed section */}
      {dormantLeads.length > 0 && (
        <div className="border rounded-lg">
          <button
            type="button"
            onClick={() => setDormantOpen(!dormantOpen)}
            className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          >
            {dormantOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-semibold font-display">Lead Dormienti</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
              {dormantLeads.length}
            </Badge>
          </button>
          {dormantOpen && (
            <div className="px-4 pb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {dormantLeads.map((lead) => (
                <KanbanCard key={lead.id} lead={lead} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
