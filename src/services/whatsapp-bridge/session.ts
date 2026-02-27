/* eslint-disable react-hooks/rules-of-hooks */
// ============================================================
// WhatsApp Session Manager — Baileys wrapper
// Note: useMultiFileAuthState is a Baileys utility, not a React hook.
// ============================================================

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  WASocket,
  Browsers,
  type ConnectionState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import { EventEmitter } from 'events';
import { syncMessage } from './sync';
import { type Contact } from './contacts';

const AUTH_DIR = path.join(process.cwd(), '.whatsapp-auth');
const MAX_RECONNECT_ATTEMPTS = 3;

export type BridgeStatus = 'disconnected' | 'connecting' | 'qr' | 'connected' | 'failed';

export class WhatsAppSession extends EventEmitter {
  private socket: WASocket | null = null;
  private _status: BridgeStatus = 'disconnected';
  private _qr: string | null = null;
  private _agentId: string | null = null;
  private _lastError: string | null = null;
  private reconnectAttempts = 0;
  private _contacts: Map<string, Contact> = new Map();

  get status(): BridgeStatus {
    return this._status;
  }

  get qr(): string | null {
    return this._qr;
  }

  get agentId(): string | null {
    return this._agentId;
  }

  get lastError(): string | null {
    return this._lastError;
  }

  get isConnected(): boolean {
    return this._status === 'connected' && this.socket !== null;
  }

  async connect(agentId: string): Promise<void> {
    // Only skip if already connected or showing QR
    if (this._status === 'connected' || this._status === 'qr') {
      return;
    }

    this._agentId = agentId;
    this._status = 'connecting';
    this._lastError = null;
    this.emitStatus();

    try {
      const { state, saveCreds } = await useMultiFileAuthState(
        path.join(AUTH_DIR, agentId)
      );

      // Fetch the latest WA version so the handshake doesn't get rejected
      let version: [number, number, number] | undefined;
      try {
        const vInfo = await fetchLatestBaileysVersion();
        version = vInfo.version;
        console.log('[WA Session] Using WA version:', version);
      } catch {
        console.log('[WA Session] Could not fetch latest version, using default');
      }

      console.log('[WA Session] Creating socket, waiting for QR...');

      this.socket = makeWASocket({
        auth: state,
        browser: Browsers.appropriate('Chrome'),
        ...(version ? { version } : {}),
      });

      // Connection updates (QR, connected, disconnected)
      this.socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('[WA Session] QR code received, send to UI');
          this._qr = qr;
          this._status = 'qr';
          this._lastError = null;
          this.reconnectAttempts = 0;
          this.emit('qr', qr);
          this.emitStatus();
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.log(`[WA Session] Connection closed. Status code: ${statusCode}, reconnect: ${shouldReconnect}`);

          this._qr = null;

          if (shouldReconnect && this._agentId) {
            this.reconnectAttempts++;
            if (this.reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
              const delay = Math.min(3000 * this.reconnectAttempts, 15000);
              console.log(`[WA Session] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
              const retryAgentId = this._agentId;
              // Keep status as 'connecting' for the UI, but reset internal state
              // so connect() can proceed
              this._status = 'disconnected';
              setTimeout(() => {
                this.connect(retryAgentId);
              }, delay);
            } else {
              console.log('[WA Session] Max reconnect attempts reached.');
              this._status = 'failed';
              this._lastError = statusCode === 405
                ? 'WhatsApp ha rifiutato la connessione. I server potrebbero essere temporaneamente non disponibili. Riprova tra qualche minuto.'
                : `Connessione a WhatsApp fallita dopo ${MAX_RECONNECT_ATTEMPTS} tentativi (codice: ${statusCode}).`;
              this.reconnectAttempts = 0;
              this.emitStatus();
            }
          } else {
            this._status = 'disconnected';
            this._lastError = null;
            this.emitStatus();
          }
        }

        if (connection === 'open') {
          this._status = 'connected';
          this._qr = null;
          this._lastError = null;
          this.reconnectAttempts = 0;
          console.log('[WA Session] Connected!');
          this.emitStatus();
        }
      });

      // Save credentials on update
      this.socket.ev.on('creds.update', saveCreds);

      // Listen for contacts from Baileys and store in memory
      this.socket.ev.on('contacts.upsert', (contacts) => {
        console.log(`[WA Session] Received ${contacts.length} contacts`);
        for (const c of contacts) {
          if (!c.id || c.id === 'status@broadcast') continue;
          const phone = '+' + c.id.split('@')[0];
          this._contacts.set(c.id, {
            jid: c.id,
            name: c.name || c.notify || null,
            phone,
          });
        }
        this.emit('contacts', this.getContacts());
      });

      this.socket.ev.on('contacts.update', (updates) => {
        for (const u of updates) {
          if (!u.id) continue;
          const existing = this._contacts.get(u.id);
          if (existing) {
            if (u.notify) existing.name = u.notify;
            this._contacts.set(u.id, existing);
          }
        }
      });

      // Listen for incoming/outgoing messages + extract contacts from messages
      this.socket.ev.on('messages.upsert', (upsert) => {
        if (!this._agentId) return;
        const agentId = this._agentId;
        for (const msg of upsert.messages) {
          // Extract contact from message sender if not already known
          const jid = msg.key.remoteJid;
          if (jid && !jid.endsWith('@g.us') && jid !== 'status@broadcast' && !this._contacts.has(jid)) {
            const phone = '+' + jid.split('@')[0];
            const pushName = msg.pushName || null;
            this._contacts.set(jid, { jid, name: pushName, phone });
            console.log(`[WA Session] Contact from message: ${pushName || phone}`);
          }

          const waMsg = {
            key: {
              remoteJid: msg.key.remoteJid || undefined,
              fromMe: msg.key.fromMe || false,
              id: msg.key.id || undefined,
            },
            message: msg.message as Record<string, unknown> | undefined,
            messageTimestamp: typeof msg.messageTimestamp === 'number'
              ? msg.messageTimestamp
              : Number(msg.messageTimestamp) || undefined,
          };
          syncMessage(waMsg, agentId).catch((err: Error) => {
            console.error('[WA Sync] Error syncing message:', err.message);
          });
        }
      });
    } catch (err) {
      console.error('[WA Session] Connection error:', err);
      this._status = 'failed';
      this._lastError = 'Errore di connessione a WhatsApp. Verifica la connessione internet e riprova.';
      this.emitStatus();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.end(undefined);
      this.socket = null;
    }
    this._status = 'disconnected';
    this._qr = null;
    this._agentId = null;
    this._lastError = null;
    this.reconnectAttempts = 0;
    this._contacts.clear();
    this.emitStatus();
  }

  getContacts(): Contact[] {
    return Array.from(this._contacts.values());
  }

  async checkNumbersOnWhatsApp(phones: string[]): Promise<{ jid: string; exists: boolean }[]> {
    if (!this.socket || !this.isConnected) return [];
    try {
      const results = await this.socket.onWhatsApp(...phones);
      return (results || []).map((r) => ({ jid: r.jid, exists: Boolean(r.exists) }));
    } catch {
      return [];
    }
  }

  private emitStatus(): void {
    this.emit('status', {
      status: this._status,
      agentId: this._agentId,
      error: this._lastError,
    });
  }
}
