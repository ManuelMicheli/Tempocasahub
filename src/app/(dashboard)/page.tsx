import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { TodayAgenda, type AgendaItem } from '@/components/dashboard/today-agenda';
import { UrgentLeads } from '@/components/dashboard/urgent-leads';
import { NewMatches } from '@/components/dashboard/new-matches';
import { QuickNotes } from '@/components/dashboard/quick-notes';
import { PageTransition } from '@/components/motion';
import type { Lead } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();
  const agent = await getCurrentAgent();

  if (!agent) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Non autenticato. Effettua il login per visualizzare la dashboard.
      </div>
    );
  }

  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const thirtyDaysFromNow = addDays(now, 30).toISOString();
  const threeDaysAgo = addDays(now, -3).toISOString();
  const todayDateStr = format(now, "d MMMM yyyy", { locale: it });

  // --- Fetch all data in parallel ---
  const [
    activeLeadsResult,
    visitsThisWeekResult,
    proposalsResult,
    newMatchesCountResult,
    hotLeadsStaleResult,
    followUpDueResult,
    newLeadsResult,
    todayAppointmentsResult,
    mandateExpiryResult,
    followUpQueueResult,
    urgentLeadsResult,
    newMatchesResult,
  ] = await Promise.all([
    // 1. KPI: Active leads count
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .not('status', 'in', '("closed_won","closed_lost","dormant")'),

    // 2. KPI: Visits this week
    supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .eq('type', 'visit')
      .gte('scheduled_at', weekStart)
      .lte('scheduled_at', weekEnd),

    // 3. KPI: Proposals in progress
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .in('status', ['proposal', 'negotiation']),

    // 4. KPI: New matches count
    supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'suggested'),

    // 5. Agenda: Hot leads with stale contact (> 3 days)
    supabase
      .from('leads')
      .select('id, full_name')
      .eq('agent_id', agent.id)
      .eq('temperature', 'hot')
      .not('status', 'in', '("closed_won","closed_lost","dormant")')
      .lt('last_contact_at', threeDaysAgo)
      .order('last_contact_at', { ascending: true })
      .limit(10),

    // 6. Agenda: Follow-ups due today or overdue
    supabase
      .from('leads')
      .select('id, full_name')
      .eq('agent_id', agent.id)
      .not('status', 'in', '("closed_won","closed_lost","dormant")')
      .lte('next_follow_up_at', todayEnd)
      .order('next_follow_up_at', { ascending: true })
      .limit(10),

    // 7. Agenda: New leads (status='new')
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .eq('status', 'new'),

    // 8. Agenda: Today's scheduled appointments
    supabase
      .from('interactions')
      .select('id, type, summary, scheduled_at, lead_id')
      .eq('agent_id', agent.id)
      .in('type', ['visit', 'meeting'])
      .gte('scheduled_at', todayStart)
      .lte('scheduled_at', todayEnd)
      .order('scheduled_at', { ascending: true })
      .limit(10),

    // 9. Agenda: Mandate expiry within 30 days (seller leads)
    supabase
      .from('leads')
      .select('id, full_name, mandate_expiry')
      .eq('agent_id', agent.id)
      .in('type', ['seller', 'both'])
      .not('status', 'in', '("closed_won","closed_lost","dormant")')
      .lte('mandate_expiry', thirtyDaysFromNow)
      .gte('mandate_expiry', todayStart)
      .order('mandate_expiry', { ascending: true })
      .limit(10),

    // 10. Agenda: Pending follow-up queue items due today
    supabase
      .from('follow_up_queue')
      .select('id, lead_id, scheduled_at, message_preview')
      .eq('status', 'pending')
      .gte('scheduled_at', todayStart)
      .lte('scheduled_at', todayEnd)
      .order('scheduled_at', { ascending: true })
      .limit(10),

    // 11. Urgent leads: top 5 hot/warm leads sorted by days since last contact
    supabase
      .from('leads')
      .select('*')
      .eq('agent_id', agent.id)
      .in('temperature', ['hot', 'warm'])
      .not('status', 'in', '("closed_won","closed_lost","dormant")')
      .order('last_contact_at', { ascending: true, nullsFirst: true })
      .limit(5),

    // 12. New matches: top 5 suggested with score >= 70
    supabase
      .from('matches')
      .select('id, score, lead:leads(full_name), property:properties(address, city, price)')
      .eq('status', 'suggested')
      .gte('score', 70)
      .order('score', { ascending: false })
      .limit(5),
  ]);

  // --- Build KPIs ---
  const kpis = {
    activeLeads: activeLeadsResult.count ?? 0,
    visitsThisWeek: visitsThisWeekResult.count ?? 0,
    proposalsInProgress: proposalsResult.count ?? 0,
    newMatches: newMatchesCountResult.count ?? 0,
  };

  // --- Build Agenda Items ---
  const agendaItems: AgendaItem[] = [];

  // Hot leads not contacted
  const hotLeadsStale = hotLeadsStaleResult.data ?? [];
  if (hotLeadsStale.length > 0) {
    agendaItems.push({
      type: 'hot_lead',
      priority: 'high',
      title: 'Lead caldi da contattare',
      description: hotLeadsStale
        .slice(0, 3)
        .map((l) => l.full_name)
        .join(', ') + (hotLeadsStale.length > 3 ? ` e altri ${hotLeadsStale.length - 3}` : ''),
      count: hotLeadsStale.length,
      link: '/leads?temperature=hot',
    });
  }

  // Follow-ups due
  const followUpDue = followUpDueResult.data ?? [];
  if (followUpDue.length > 0) {
    agendaItems.push({
      type: 'follow_up',
      priority: 'medium',
      title: 'Follow-up in scadenza',
      description: followUpDue
        .slice(0, 3)
        .map((l) => l.full_name)
        .join(', ') + (followUpDue.length > 3 ? ` e altri ${followUpDue.length - 3}` : ''),
      count: followUpDue.length,
      link: '/leads',
    });
  }

  // New leads to qualify
  const newLeadsCount = newLeadsResult.count ?? 0;
  if (newLeadsCount > 0) {
    agendaItems.push({
      type: 'new_leads',
      priority: 'low',
      title: 'Nuovi lead da qualificare',
      description: `${newLeadsCount} ${newLeadsCount === 1 ? 'nuovo lead' : 'nuovi lead'} in attesa di qualificazione`,
      count: newLeadsCount,
      link: '/leads?status=new',
    });
  }

  // Today's appointments
  const todayAppointments = todayAppointmentsResult.data ?? [];
  for (const appt of todayAppointments) {
    const timeStr = appt.scheduled_at
      ? format(new Date(appt.scheduled_at), 'HH:mm', { locale: it })
      : undefined;
    const typeLabel = appt.type === 'visit' ? 'Visita' : 'Appuntamento';
    agendaItems.push({
      type: 'appointment',
      priority: 'low',
      title: `${typeLabel}`,
      description: appt.summary || 'Nessun dettaglio',
      time: timeStr,
      link: appt.lead_id ? `/leads/${appt.lead_id}` : '/calendar',
    });
  }

  // Mandate expiry warnings
  const mandateExpiry = mandateExpiryResult.data ?? [];
  if (mandateExpiry.length > 0) {
    agendaItems.push({
      type: 'mandate_expiry',
      priority: 'medium',
      title: 'Mandati in scadenza',
      description: mandateExpiry
        .slice(0, 3)
        .map((l) => l.full_name)
        .join(', ') + (mandateExpiry.length > 3 ? ` e altri ${mandateExpiry.length - 3}` : ''),
      count: mandateExpiry.length,
      link: '/leads',
    });
  }

  // Follow-up queue items due today
  const followUpQueue = followUpQueueResult.data ?? [];
  if (followUpQueue.length > 0) {
    agendaItems.push({
      type: 'follow_up',
      priority: 'medium',
      title: 'Follow-up automatici da inviare',
      description: `${followUpQueue.length} ${followUpQueue.length === 1 ? 'messaggio' : 'messaggi'} in coda`,
      count: followUpQueue.length,
      link: '/settings/follow-up',
    });
  }

  // Sort: high first, then medium, then low
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  agendaItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // --- Urgent Leads ---
  const urgentLeads = (urgentLeadsResult.data as Lead[]) ?? [];

  // --- New Matches ---
  type MatchRow = {
    id: string;
    score: number;
    lead: { full_name: string } | { full_name: string }[] | null;
    property: { address: string; city: string; price: number } | { address: string; city: string; price: number }[] | null;
  };
  const rawMatches = (newMatchesResult.data as MatchRow[] | null) ?? [];
  const newMatchesList = rawMatches
    .map((m) => {
      const lead = Array.isArray(m.lead) ? m.lead[0] : m.lead;
      const property = Array.isArray(m.property) ? m.property[0] : m.property;
      if (!lead || !property) return null;
      return {
        id: m.id,
        score: m.score,
        lead: { full_name: lead.full_name },
        property: { address: property.address, city: property.city, price: property.price },
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-display">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Oggi, {todayDateStr}
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} />

      {/* Main Content: Two columns on landscape */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left Column: Today Agenda (~60%) */}
        <div className="lg:col-span-3">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display">Oggi devi</CardTitle>
            </CardHeader>
            <CardContent>
              <TodayAgenda items={agendaItems} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Urgent Leads + New Matches (~40%) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display">Lead urgenti</CardTitle>
            </CardHeader>
            <CardContent>
              <UrgentLeads leads={urgentLeads} />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display">Nuovi match</CardTitle>
            </CardHeader>
            <CardContent>
              <NewMatches matches={newMatchesList} />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-5">
              <QuickNotes initialNotes={agent.quick_notes ?? ''} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
