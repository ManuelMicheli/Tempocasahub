// ============================================================
// WhatsApp Bridge — Entry Point
// Standalone Node.js process that connects to WhatsApp via Baileys
// and syncs messages to Supabase as interactions.
//
// Usage: npm run whatsapp
//   or:  npx tsx src/services/whatsapp-bridge/index.ts
//   or:  WA_BRIDGE_PORT=3002 npm run whatsapp
// ============================================================

import { createBridgeServer } from './ws-server';
import { WhatsAppSession } from './session';

const WS_PORT = parseInt(process.env.WA_BRIDGE_PORT || '3001', 10);

async function main() {
  console.log('[WA Bridge] Starting WhatsApp Bridge service...');

  const session = new WhatsAppSession();

  let server: Awaited<ReturnType<typeof createBridgeServer>>;
  try {
    server = await createBridgeServer(session, WS_PORT);
  } catch {
    process.exit(1);
  }

  console.log('[WA Bridge] Waiting for QR scan from CRM...');

  // Graceful shutdown
  const shutdown = () => {
    console.log('[WA Bridge] Shutting down...');
    session.disconnect();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[WA Bridge] Fatal error:', err);
  process.exit(1);
});
