import { NextResponse } from 'next/server';
import { getSession, getQrDataUrl } from '@/lib/whatsapp/session-manager';

export const dynamic = 'force-dynamic';

// GET /api/whatsapp/qr — returns current QR data URL, session status and error
export async function GET() {
  try {
    const session = getSession();
    return NextResponse.json({
      status: session.status,
      qr: getQrDataUrl(),
      error: session.lastError,
    });
  } catch (err) {
    console.error('[WA QR] Error:', err);
    return NextResponse.json({ status: 'disconnected', qr: null, error: null });
  }
}
