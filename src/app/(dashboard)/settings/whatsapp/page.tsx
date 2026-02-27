'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/motion';
import { QrScanner } from '@/components/whatsapp/qr-scanner';
import { ConnectionStatus } from '@/components/whatsapp/connection-status';
import { ContactList } from '@/components/whatsapp/contact-list';

interface StatusData {
  agentId: string;
  monitoredContacts: number;
  totalContacts: number;
  recentSyncs: number;
}

export default function WhatsAppSettingsPage() {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<string>('disconnected');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [contactsKey, setContactsKey] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (data.totalContacts > 0) setShowContacts(true);
      }
    } catch {
      // Status API not available — not blocking, QR scanner works independently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-sync contacts when WhatsApp connects, with retries for delayed contact delivery
  useEffect(() => {
    if (bridgeStatus !== 'connected') return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 5;

    const syncContacts = async () => {
      setSyncing(true);
      try {
        const res = await fetch('/api/whatsapp/sync-contacts', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data.synced > 0) {
            setShowContacts(true);
            setContactsKey((k) => k + 1);
            fetchStatus();
            return true; // Done
          }
        }
      } catch {
        // Ignore
      } finally {
        setSyncing(false);
      }
      return false;
    };

    const trySync = async () => {
      if (cancelled) return;
      attempts++;
      const success = await syncContacts();
      if (!success && attempts < maxAttempts && !cancelled) {
        // Baileys delivers contacts asynchronously; retry with increasing delay
        setTimeout(trySync, 3000 * attempts);
      }
    };

    // First attempt after 2s (give Baileys time to receive contacts)
    const initialTimer = setTimeout(trySync, 2000);
    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
    };
  }, [bridgeStatus, fetchStatus]);

  const agentId = statusData?.agentId || '';

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="rounded-full p-2 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-600" />
            WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground">
            Collega il tuo WhatsApp per sincronizzare automaticamente le conversazioni con i lead
          </p>
        </div>
      </div>

      {/* How it works */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
            Come funziona
          </p>
          <ol className="text-sm text-blue-600 dark:text-blue-500 space-y-1 list-decimal list-inside">
            <li>Connetti il tuo WhatsApp scansionando il QR code (come WhatsApp Web)</li>
            <li>Scegli quali contatti monitorare e abbinali ai lead del CRM</li>
            <li>I messaggi inviati/ricevuti diventano automaticamente interazioni nel CRM</li>
          </ol>
        </CardContent>
      </Card>

      {/* Connection / QR Scanner — always show */}
      {!loading && (
        <>
          <QrScanner
            agentId={agentId}
            onStatusChange={setBridgeStatus}
          />

          {/* Stats (only show when connected or has data) */}
          {statusData &&
            (bridgeStatus === 'connected' || statusData.totalContacts > 0) && (
              <ConnectionStatus
                monitoredContacts={statusData.monitoredContacts}
                totalContacts={statusData.totalContacts}
                recentSyncs={statusData.recentSyncs}
              />
            )}
        </>
      )}

      {loading && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Caricamento...
          </CardContent>
        </Card>
      )}

      {/* Contact list (visible after sync or if DB has contacts) */}
      {showContacts && <ContactList key={contactsKey} />}

      {/* Syncing indicator */}
      {bridgeStatus === 'connected' && syncing && !showContacts && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sincronizzazione contatti WhatsApp in corso...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Connected but contacts not yet loaded */}
      {bridgeStatus === 'connected' && !syncing && !showContacts && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              WhatsApp connesso. I contatti verranno sincronizzati automaticamente a breve.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </PageTransition>
  );
}
