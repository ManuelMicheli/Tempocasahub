import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/whatsapp/session-manager';

// POST /api/whatsapp/connect — start Baileys session, returns immediately
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const agentId = body.agentId || 'default';

    const session = getSession();

    // If already connected or connecting, just return current status
    if (session.status === 'connected' || session.status === 'connecting' || session.status === 'qr') {
      return NextResponse.json({ status: session.status });
    }

    // Start connection (async — QR will arrive via polling /api/whatsapp/qr)
    session.connect(agentId).catch((err) => {
      console.error('[WA Connect] Error:', err);
    });

    return NextResponse.json({ status: 'connecting' });
  } catch (err) {
    console.error('[WA Connect] Error:', err);
    return NextResponse.json(
      { error: 'Errore avvio sessione WhatsApp' },
      { status: 500 }
    );
  }
}
