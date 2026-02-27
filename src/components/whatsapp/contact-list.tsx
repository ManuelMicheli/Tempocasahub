'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Link2, Link2Off, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ContactMatcher } from './contact-matcher';

interface WAContact {
  id: string;
  wa_jid: string;
  wa_name: string | null;
  wa_phone: string | null;
  lead_id: string | null;
  lead_name: string | null;
  is_monitored: boolean;
  last_sync_at: string | null;
}

export function ContactList() {
  const [contacts, setContacts] = useState<WAContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'monitored' | 'unmatched'>('all');
  const [matchingContact, setMatchingContact] = useState<WAContact | null>(null);
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const toggleMonitored = async (contact: WAContact) => {
    setUpdating((prev) => new Set(prev).add(contact.id));

    try {
      const res = await fetch('/api/whatsapp/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          is_monitored: !contact.is_monitored,
        }),
      });

      if (res.ok) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id ? { ...c, is_monitored: !c.is_monitored } : c
          )
        );
      }
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(contact.id);
        return next;
      });
    }
  };

  const handleLeadLinked = (contactId: string, leadId: string, leadName: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, lead_id: leadId, lead_name: leadName } : c
      )
    );
    setMatchingContact(null);
  };

  const handleLeadUnlinked = async (contact: WAContact) => {
    setUpdating((prev) => new Set(prev).add(contact.id));
    try {
      const res = await fetch('/api/whatsapp/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id, lead_id: null }),
      });
      if (res.ok) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id
              ? { ...c, lead_id: null, lead_name: null, is_monitored: false }
              : c
          )
        );
      }
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(contact.id);
        return next;
      });
    }
  };

  // Filter contacts
  const filtered = contacts.filter((c) => {
    const matchesSearch =
      !search ||
      c.wa_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.wa_phone?.includes(search) ||
      c.lead_name?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'monitored' && c.is_monitored) ||
      (filter === 'unmatched' && !c.lead_id);

    return matchesSearch && matchesFilter;
  });

  const monitoredCount = contacts.filter((c) => c.is_monitored).length;
  const matchedCount = contacts.filter((c) => c.lead_id).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Caricamento contatti...</p>
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Nessun contatto WhatsApp trovato. Collega il tuo WhatsApp per vedere i contatti.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Contatti WhatsApp ({contacts.length})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-green-600 border-green-200">
                {matchedCount} abbinati
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {monitoredCount} monitorati
              </Badge>
            </div>
          </div>

          {/* Search + filter */}
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome o numero..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'monitored', 'unmatched'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="h-9"
                >
                  {f === 'all' && 'Tutti'}
                  {f === 'monitored' && (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Monitorati
                    </>
                  )}
                  {f === 'unmatched' && 'Senza lead'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto divide-y">
            {filtered.map((contact) => {
              const isUpdating = updating.has(contact.id);
              return (
                <div
                  key={contact.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                    contact.is_monitored ? 'bg-green-50/50 dark:bg-green-950/10' : ''
                  }`}
                >
                  {/* Contact info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {contact.wa_name || contact.wa_phone || contact.wa_jid}
                      </p>
                      {contact.is_monitored && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200 text-xs flex-shrink-0"
                        >
                          Monitorato
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.wa_phone}
                      {contact.last_sync_at && (
                        <span className="ml-2">
                          Ultimo sync:{' '}
                          {new Date(contact.last_sync_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Lead link */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {contact.lead_id ? (
                      <Badge variant="secondary" className="text-xs gap-1 max-w-[140px]">
                        <Link2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{contact.lead_name}</span>
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setMatchingContact(contact)}
                      >
                        <Link2 className="h-3.5 w-3.5 mr-1" />
                        Abbina lead
                      </Button>
                    )}

                    {contact.lead_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Scollega lead"
                        onClick={() => handleLeadUnlinked(contact)}
                        disabled={isUpdating}
                      >
                        <Link2Off className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>

                  {/* Monitor toggle */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={contact.is_monitored}
                      onCheckedChange={() => toggleMonitored(contact)}
                      disabled={isUpdating || !contact.lead_id}
                      title={
                        !contact.lead_id
                          ? 'Abbina un lead per attivare il monitoraggio'
                          : contact.is_monitored
                          ? 'Disattiva monitoraggio'
                          : 'Attiva monitoraggio'
                      }
                    />
                    {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nessun contatto trovato con questi filtri
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manual matching dialog */}
      {matchingContact && (
        <ContactMatcher
          contact={matchingContact}
          onLinked={handleLeadLinked}
          onClose={() => setMatchingContact(null)}
        />
      )}
    </>
  );
}
