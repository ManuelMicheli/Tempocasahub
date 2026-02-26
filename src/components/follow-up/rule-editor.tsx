'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toggleRule, updateRule } from '@/lib/actions/follow-up';
import type { FollowUpRule } from '@/types/database';

interface RuleEditorProps {
  rule: FollowUpRule;
  description: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  call_reminder: 'Promemoria',
};

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-800',
  email: 'bg-blue-100 text-blue-800',
  call_reminder: 'bg-orange-100 text-orange-800',
};

function formatDelay(hours: number): string {
  if (hours === 0) return 'Immediato';
  if (hours < 24) return `${hours} or${hours === 1 ? 'a' : 'e'}`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `${days} giorn${days === 1 ? 'o' : 'i'}`;
  return `${days}g ${remainingHours}h`;
}

export function RuleEditor({ rule, description }: RuleEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [delayHours, setDelayHours] = useState(rule.delay_hours);
  const [channel, setChannel] = useState(rule.channel);

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      await toggleRule(rule.id, checked);
    });
  }

  function handleSave() {
    startTransition(async () => {
      await updateRule(rule.id, {
        delay_hours: delayHours,
        channel,
      });
      setEditing(false);
    });
  }

  function handleCancel() {
    setDelayHours(rule.delay_hours);
    setChannel(rule.channel);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <Switch
        checked={rule.is_active}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            !rule.is_active ? 'text-muted-foreground line-through' : ''
          }`}
        >
          {description}
        </p>

        {!editing ? (
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant="secondary"
              className={CHANNEL_COLORS[rule.channel] || ''}
            >
              {CHANNEL_LABELS[rule.channel] || rule.channel}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDelay(rule.delay_hours)}
            </span>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                value={delayHours}
                onChange={(e) => setDelayHours(Number(e.target.value))}
                className="w-20 h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">ore</span>
            </div>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="call_reminder">Promemoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {!editing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            disabled={isPending}
          >
            Modifica
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              Annulla
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              Salva
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
