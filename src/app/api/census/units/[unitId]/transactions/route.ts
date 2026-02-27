import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { getCadastralProvider } from '@/lib/census/providers';

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

  // Check if transactions already exist in DB
  const { data: existing } = await supabase
    .from('census_transactions')
    .select('*')
    .eq('unit_id', unitId)
    .order('transaction_date', { ascending: false });

  if (existing && existing.length > 0) {
    return NextResponse.json(existing);
  }

  // Fetch unit details
  const { data: unit } = await supabase
    .from('census_units')
    .select('*')
    .eq('id', unitId)
    .single();

  if (!unit || !unit.sheet || !unit.parcel || !unit.sub) {
    return NextResponse.json([]);
  }

  // Fetch from cadastral provider and cache in DB
  try {
    const provider = getCadastralProvider();
    const transactions = await provider.fetchTransactions(
      unit.sheet,
      unit.parcel,
      unit.sub
    );

    if (transactions.length > 0) {
      const rows = transactions.map((t) => ({
        unit_id: unitId,
        transaction_type: t.transaction_type ?? null,
        transaction_date: t.transaction_date ?? null,
        price: t.price ?? null,
        buyer_name: t.buyer_name ?? null,
        seller_name: t.seller_name ?? null,
        notary: t.notary ?? null,
        notes: t.notes ?? null,
      }));

      const { data: inserted } = await supabase
        .from('census_transactions')
        .insert(rows)
        .select();

      return NextResponse.json(inserted ?? rows);
    }

    return NextResponse.json([]);
  } catch {
    return NextResponse.json([]);
  }
}
