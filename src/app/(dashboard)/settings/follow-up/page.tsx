import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RuleEditor } from '@/components/follow-up/rule-editor';
import { QueueList } from '@/components/follow-up/queue-list';
import { SeedRulesButton } from '@/components/follow-up/seed-rules-button';
import {
  TRIGGER_EVENT_LABELS,
  TEMPLATE_DESCRIPTIONS,
} from '@/lib/follow-up/rules';
import { PageTransition } from '@/components/motion';
import type { FollowUpRule } from '@/types/database';

export default async function FollowUpSettingsPage() {
  const supabase = await createClient();
  const agent = await getCurrentAgent();

  // Fetch agent's follow-up rules
  const { data: rules } = await supabase
    .from('follow_up_rules')
    .select('*')
    .eq('agent_id', agent?.id ?? '')
    .order('trigger_event')
    .order('delay_hours', { ascending: true });

  const typedRules = (rules ?? []) as FollowUpRule[];

  // Fetch recent queue items
  const { data: queueItems } = await supabase
    .from('follow_up_queue')
    .select('*, lead:leads(full_name)')
    .order('scheduled_at', { ascending: false })
    .limit(20);

  // Group rules by trigger_event
  const groupedRules: Record<string, FollowUpRule[]> = {};
  for (const rule of typedRules) {
    if (!groupedRules[rule.trigger_event]) {
      groupedRules[rule.trigger_event] = [];
    }
    groupedRules[rule.trigger_event].push(rule);
  }

  const hasRules = typedRules.length > 0;

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">Regole Follow-up</h1>
          <p className="text-sm text-muted-foreground">
            Configura le regole automatiche di follow-up per i tuoi lead
          </p>
        </div>
      </div>

      {/* Rules Section */}
      <Card>
        <CardHeader>
          <CardTitle>Regole attive</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasRules ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Non hai ancora configurato le regole di follow-up.
                <br />
                Inizializza le regole predefinite per iniziare.
              </p>
              <SeedRulesButton />
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedRules).map(
                ([triggerEvent, eventRules]) => (
                  <div key={triggerEvent}>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      {TRIGGER_EVENT_LABELS[triggerEvent] || triggerEvent}
                    </h3>
                    <div className="space-y-2">
                      {eventRules.map((rule) => (
                        <RuleEditor
                          key={rule.id}
                          rule={rule}
                          description={
                            TEMPLATE_DESCRIPTIONS[rule.template_key ?? ''] ||
                            rule.trigger_event
                          }
                        />
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Section */}
      <Card>
        <CardHeader>
          <CardTitle>Coda Follow-up</CardTitle>
        </CardHeader>
        <CardContent>
          <QueueList queueItems={queueItems ?? []} />
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}
