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

  // Check if owners already exist in DB
  const { data: existingOwners } = await supabase
    .from('census_owners')
    .select('*')
    .eq('unit_id', unitId);

  if (existingOwners && existingOwners.length > 0) {
    return NextResponse.json(existingOwners);
  }

  // Fetch unit details to get cadastral references
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
    const owners = await provider.fetchOwners(unit.sheet, unit.parcel, unit.sub);

    if (owners.length > 0) {
      const rows = owners.map((o) => ({
        unit_id: unitId,
        full_name: o.full_name,
        fiscal_code: o.fiscal_code ?? null,
        ownership_type: o.ownership_type ?? null,
        ownership_share: o.ownership_share ?? null,
        is_natural_person: o.is_natural_person,
      }));

      const { data: inserted } = await supabase
        .from('census_owners')
        .insert(rows)
        .select();

      return NextResponse.json(inserted ?? rows);
    }

    return NextResponse.json([]);
  } catch {
    return NextResponse.json([]);
  }
}
