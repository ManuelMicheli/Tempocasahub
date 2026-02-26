'use client';

import { useTransition } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cancelFollowUp } from '@/lib/actions/follow-up';
import type { FollowUpQueueStatus } from '@/types/database';

export interface QueueItem {
  id: string;
  lead_id: string | null;
  rule_id: string | null;
  scheduled_at: string;
  sent_at: string | null;
  status: FollowUpQueueStatus;
  message_preview: string | null;
  created_at: string;
  lead?: { full_name: string } | null;
}

interface QueueListProps {
  queueItems: QueueItem[];
}

const STATUS_BADGES: Record<
  FollowUpQueueStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'In attesa',
    className: 'bg-yellow-100 text-yellow-800',
  },
  sent: { label: 'Inviato', className: 'bg-green-100 text-green-800' },
  cancelled: {
    label: 'Annullato',
    className: 'bg-gray-100 text-gray-600',
  },
  failed: { label: 'Fallito', className: 'bg-red-100 text-red-800' },
};

function CancelButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      await cancelFollowUp(id);
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCancel}
      disabled={isPending}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      {isPending ? 'Annullo...' : 'Annulla'}
    </Button>
  );
}

export function QueueList({ queueItems }: QueueListProps) {
  if (queueItems.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nessun follow-up in coda.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead</TableHead>
          <TableHead>Programmato</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Messaggio</TableHead>
          <TableHead className="w-[100px]">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queueItems.map((item) => {
          const statusInfo = STATUS_BADGES[item.status];
          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.lead?.full_name || '-'}
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(item.scheduled_at), 'dd MMM yyyy, HH:mm', {
                  locale: it,
                })}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={statusInfo.className}
                >
                  {statusInfo.label}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[300px]">
                <span className="text-sm text-muted-foreground truncate block">
                  {item.message_preview
                    ? item.message_preview.length > 80
                      ? item.message_preview.slice(0, 80) + '...'
                      : item.message_preview
                    : '-'}
                </span>
              </TableCell>
              <TableCell>
                {item.status === 'pending' && (
                  <CancelButton id={item.id} />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
