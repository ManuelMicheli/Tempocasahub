import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { CalendarView } from '@/components/calendar/calendar-view';
import { NewAppointmentDialog } from '@/components/calendar/new-appointment-dialog';
import { PageTransition } from '@/components/motion';

export default async function CalendarPage() {
  const supabase = await createClient();
  const agent = await getCurrentAgent();

  // Fetch scheduled interactions with lead and property joins
  const { data: appointments } = await supabase
    .from('interactions')
    .select('*, lead:leads(full_name), property:properties(address)')
    .not('scheduled_at', 'is', null)
    .order('scheduled_at', { ascending: true })
    .limit(200);

  // Fetch leads for the appointment dialog
  const { data: leads } = await supabase
    .from('leads')
    .select('id, full_name')
    .eq('agent_id', agent?.id ?? '')
    .order('full_name');

  // Fetch properties for the appointment dialog
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, address')
    .eq('agent_id', agent?.id ?? '')
    .order('address');

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Calendario</h1>
        <NewAppointmentDialog
          leads={leads ?? []}
          properties={properties ?? []}
        />
      </div>

      <CalendarView appointments={appointments ?? []} />
    </div>
    </PageTransition>
  );
}
