'use client';

import { useState, useEffect } from 'react';
import { Search, User, Phone, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface WAContact {
  id: string;
  wa_name: string | null;
  wa_phone: string | null;
}

interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  type: string;
}

interface ContactMatcherProps {
  contact: WAContact;
  onLinked: (contactId: string, leadId: string, leadName: string) => void;
  onClose: () => void;
}

export function ContactMatcher({ contact, onLinked, onClose }: ContactMatcherProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);

  // Fetch agent's leads
  useEffect(() => {
    const fetchLeads = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('leads')
        .select('id, full_name, phone, email, type')
        .order('full_name');

      setLeads(data || []);
      setLoading(false);
    };
    fetchLeads();
  }, []);

  const filtered = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      lead.full_name.toLowerCase().includes(q) ||
      lead.phone?.includes(q) ||
      lead.email?.toLowerCase().includes(q)
    );
  });

  const handleLink = async (lead: Lead) => {
    setLinking(lead.id);
    try {
      const res = await fetch('/api/whatsapp/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id, lead_id: lead.id }),
      });
      if (res.ok) {
        onLinked(contact.id, lead.id, lead.full_name);
      }
    } finally {
      setLinking(null);
    }
  };

  const typeLabel = (type: string) => {
    if (type === 'buyer') return 'Acquirente';
    if (type === 'seller') return 'Venditore';
    return 'Acq+Vend';
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Abbina a un lead</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Seleziona il lead da associare a{' '}
            <strong>{contact.wa_name || contact.wa_phone}</strong>
          </p>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca lead per nome, telefono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto divide-y rounded-md border">
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nessun lead trovato
            </div>
          ) : (
            filtered.map((lead) => (
              <button
                key={lead.id}
                onClick={() => handleLink(lead)}
                disabled={linking === lead.id}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{lead.full_name}</p>
                    <Badge variant="outline" className="text-xs">
                      {typeLabel(lead.type)}
                    </Badge>
                  </div>
                  {lead.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </p>
                  )}
                </div>
                {linking === lead.id ? (
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                ) : (
                  <Button variant="ghost" size="sm" className="flex-shrink-0 h-7">
                    Abbina
                  </Button>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
