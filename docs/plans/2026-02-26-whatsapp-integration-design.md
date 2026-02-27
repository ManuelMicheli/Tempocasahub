# WhatsApp Integration Design

## Overview
WhatsApp Web Bridge via Baileys per sync automatico messaggi → interazioni CRM.
L'agente scansiona QR, seleziona contatti da monitorare, il sistema crea interazioni automaticamente.

## Architecture
- Bridge service: Node.js process (Baileys) → writes to Supabase
- WebSocket: QR code + connection status to frontend
- API routes: status, contacts, disconnect
- UI: /settings/whatsapp page with QR, contact list, monitoring toggles

## Database
- New table: whatsapp_contacts (agent_id, wa_jid, lead_id, is_monitored)
- Alter interactions: add wa_message_id TEXT

## Dependencies
- @whiskeysockets/baileys
- ws
- qrcode
