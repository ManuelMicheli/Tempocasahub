'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CensusContactForm } from './census-contact-form';
import { CensusCreateLeadForm } from './census-create-lead-form';
import { CensusOwnerCard } from './census-owner-card';
import { CensusTransactionList } from './census-transaction-list';
import { CensusContactLog } from './census-contact-log';
import type {
  CensusUnit,
  CensusBuilding,
  CensusOwner,
  CensusTransaction,
  CensusContactLog as ContactLogType,
} from '@/types/database';

interface CensusUnitDetailProps {
  unit: CensusUnit;
  building: CensusBuilding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_LABELS: Record<string, string> = {
  not_contacted: 'Non contattato',
  contacted: 'Contattato',
  interested: 'Interessato',
  not_interested: 'Non interessato',
  callback: 'Da richiamare',
  lead_created: 'Lead creato',
};

export function CensusUnitDetail({
  unit,
  building,
  open,
  onOpenChange,
}: CensusUnitDetailProps) {
  const [owners, setOwners] = useState<CensusOwner[]>([]);
  const [transactions, setTransactions] = useState<CensusTransaction[]>([]);
  const [contactLog, setContactLog] = useState<ContactLogType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function loadDetailData() {
      setLoading(true);
      try {
        const [ownersRes, transRes, logRes] = await Promise.all([
          fetch(`/api/census/units/${unit.id}/owners`),
          fetch(`/api/census/units/${unit.id}/transactions`),
          fetch(`/api/census/units/${unit.id}/contact-log`),
        ]);

        if (ownersRes.ok) setOwners(await ownersRes.json());
        if (transRes.ok) setTransactions(await transRes.json());
        if (logRes.ok) setContactLog(await logRes.json());
      } catch {
        // Silently fail — data simply won't show
      } finally {
        setLoading(false);
      }
    }

    loadDetailData();
  }, [open, unit.id]);

  const fullAddress = `${building.address} ${building.civic_number}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {unit.internal || `Sub. ${unit.sub || '?'}`} — {fullAddress}
            <Badge variant="outline" className="ml-2 text-xs">
              {STATUS_LABELS[unit.contact_status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Catastale</TabsTrigger>
            <TabsTrigger value="owners">Proprietari</TabsTrigger>
            <TabsTrigger value="contact">Contatto</TabsTrigger>
            <TabsTrigger value="history">Storico</TabsTrigger>
          </TabsList>

          {/* Tab: Dati Catastali */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoField label="Foglio" value={unit.sheet} />
              <InfoField label="Particella" value={unit.parcel} />
              <InfoField label="Subalterno" value={unit.sub} />
              <InfoField label="Categoria" value={unit.category} />
              <InfoField label="Classe" value={unit.class} />
              <InfoField label="Consistenza" value={unit.consistency} />
              <InfoField label="Piano" value={unit.floor === 'T' ? 'Terra' : unit.floor} />
              <InfoField label="Interno" value={unit.internal} />
              <InfoField label="Superficie" value={unit.sqm ? `${unit.sqm} mq` : null} />
              <InfoField label="Vani" value={unit.rooms?.toString()} />
              <InfoField
                label="Rendita Catastale"
                value={
                  unit.cadastral_income
                    ? `€ ${Number(unit.cadastral_income).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
                    : null
                }
              />
            </div>
          </TabsContent>

          {/* Tab: Proprietari */}
          <TabsContent value="owners" className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Caricamento...</p>
            ) : owners.length > 0 ? (
              owners.map((owner) => (
                <CensusOwnerCard key={owner.id} owner={owner} />
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                <p>Nessun proprietario caricato.</p>
                <p className="mt-1">I dati proprietari vengono caricati on-demand dalla API catastale.</p>
              </div>
            )}

            {!loading && transactions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Storico Compravendite</h4>
                <CensusTransactionList transactions={transactions} />
              </div>
            )}
          </TabsContent>

          {/* Tab: Contatto */}
          <TabsContent value="contact" className="space-y-4">
            {unit.contact_status === 'interested' && !unit.lead_id ? (
              <CensusCreateLeadForm
                unit={unit}
                building={building}
                owners={owners}
              />
            ) : unit.lead_id ? (
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm font-medium text-green-500">Lead già creato</p>
                <a
                  href={`/leads/${unit.lead_id}`}
                  className="mt-1 text-sm text-primary underline"
                >
                  Vai al lead →
                </a>
              </div>
            ) : (
              <CensusContactForm unit={unit} />
            )}
          </TabsContent>

          {/* Tab: Storico */}
          <TabsContent value="history" className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Caricamento...</p>
            ) : (
              <CensusContactLog logs={contactLog} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}
