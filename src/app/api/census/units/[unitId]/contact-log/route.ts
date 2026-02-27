import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const agent = await getCurrentAgent();
  if (!agent) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const { unitId } = await params;
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('census_contact_log')
    .select('*')
    .eq('unit_id', unitId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(logs ?? []);
}
