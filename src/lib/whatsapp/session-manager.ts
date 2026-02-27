// ============================================================
// WhatsApp Session Singleton — runs Baileys inside the Next.js process
// Persists across requests via globalThis (works in dev & production).
// ============================================================

import { WhatsAppSession } from '@/services/whatsapp-bridge/session';
import QRCode from 'qrcode';

interface WAGlobal {
  waSession?: WhatsAppSession;
  waQrDataUrl?: string | null;
}

const g = globalThis as unknown as WAGlobal;

export function getSession(): WhatsAppSession {
  if (!g.waSession) {
    g.waSession = new WhatsAppSession();

    g.waSession.on('qr', async (qr: string) => {
      try {
        g.waQrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
      } catch (err) {
        console.error('[WA SessionManager] QR generation error:', err);
      }
    });

    g.waSession.on('status', (data: { status: string }) => {
      if (data.status === 'connected' || data.status === 'disconnected' || data.status === 'failed') {
        g.waQrDataUrl = null;
      }
    });
  }

  return g.waSession;
}

export function getQrDataUrl(): string | null {
  return g.waQrDataUrl ?? null;
}
