// ============================================================
// WebSocket Server — Bridge ↔ CRM UI communication
// Sends QR codes and connection status to the frontend.
// Receives connect/disconnect commands from the frontend.
// ============================================================

import { WebSocketServer, WebSocket } from 'ws';
import QRCode from 'qrcode';
import { WhatsAppSession } from './session';

interface WSMessage {
  action: 'connect' | 'disconnect' | 'ping';
  agentId?: string;
}

export function createBridgeServer(session: WhatsAppSession, port: number): Promise<WebSocketServer> {
  return new Promise((resolve, reject) => {
    const wss = new WebSocketServer({ port }, () => {
      console.log(`[WS] WebSocket server listening on port ${port}`);
      resolve(wss);
    });

    wss.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `[WS] Porta ${port} già in uso. Possibili soluzioni:\n` +
          `  1. Chiudi l'altra istanza del bridge\n` +
          `  2. Usa un'altra porta: WA_BRIDGE_PORT=${port + 1} npm run whatsapp\n` +
          `  3. Su Windows: netstat -ano | findstr :${port}  poi  taskkill /PID <pid> /F`
        );
      } else {
        console.error('[WS] Server error:', err.message);
      }
      reject(err);
    });

    function broadcast(data: Record<string, unknown>) {
      const payload = JSON.stringify(data);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }

    // Forward session events to all connected clients
    session.on('qr', async (qr: string) => {
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
        broadcast({ type: 'qr', qr: qrDataUrl });
      } catch (err) {
        console.error('[WS] QR generation error:', err);
      }
    });

    session.on('status', (data: { status: string; agentId: string | null }) => {
      broadcast({ type: 'status', ...data });
    });

    // Handle incoming WebSocket connections
    wss.on('connection', (ws) => {
      console.log('[WS] Client connected');

      // Send current state immediately
      ws.send(
        JSON.stringify({
          type: 'status',
          status: session.status,
          agentId: session.agentId,
        })
      );

      // If QR is available, send it
      if (session.qr) {
        QRCode.toDataURL(session.qr, { width: 300, margin: 2 }).then((qrDataUrl) => {
          ws.send(JSON.stringify({ type: 'qr', qr: qrDataUrl }));
        });
      }

      ws.on('message', async (raw) => {
        try {
          const msg: WSMessage = JSON.parse(raw.toString());

          switch (msg.action) {
            case 'connect':
              // Allow connection with agentId or fallback to 'default'
              await session.connect(msg.agentId || 'default');
              break;

            case 'disconnect':
              session.disconnect();
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (err) {
          console.error('[WS] Message parse error:', err);
        }
      });

      ws.on('close', () => {
        console.log('[WS] Client disconnected');
      });
    });
  });
}
