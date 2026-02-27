import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractPropertyFromText } from '@/lib/ai/extract-property';

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  // Check API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY non configurata. Aggiungi la chiave nel file .env' },
      { status: 503 }
    );
  }

  const { text } = await req.json();
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return NextResponse.json(
      { error: 'Descrizione troppo breve. Scrivi almeno qualche dettaglio sull\'immobile.' },
      { status: 400 }
    );
  }

  try {
    const extracted = await extractPropertyFromText(text.trim());
    return NextResponse.json({ data: extracted });
  } catch (err) {
    console.error('[AI Extract Property]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Errore nell\'analisi AI' },
      { status: 500 }
    );
  }
}
