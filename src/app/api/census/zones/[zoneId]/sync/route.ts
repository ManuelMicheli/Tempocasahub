import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { syncCensusZone } from '@/lib/census/sync';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  const agent = await getCurrentAgent();
  if (!agent) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const { zoneId } = await params;

  try {
    const result = await syncCensusZone(zoneId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      buildings: result.buildings,
      units: result.units,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Errore durante la sincronizzazione' },
      { status: 500 }
    );
  }
}
