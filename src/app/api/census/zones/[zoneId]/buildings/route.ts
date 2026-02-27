import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  const agent = await getCurrentAgent();
  if (!agent) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const { zoneId } = await params;
  const supabase = await createClient();

  const { data: buildings, error } = await supabase
    .from('census_buildings')
    .select('*')
    .eq('zone_id', zoneId)
    .order('address')
    .order('civic_number');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(buildings);
}
