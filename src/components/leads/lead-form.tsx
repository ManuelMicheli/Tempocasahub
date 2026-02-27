'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { createLead, updateLead } from '@/lib/actions/leads';
import type { Lead } from '@/types/database';

interface LeadFormProps {
  initialData?: Lead;
  leadId?: string;
}

const SOURCES = [
  { value: 'portale', label: 'Portale immobiliare' },
  { value: 'passaparola', label: 'Passaparola' },
  { value: 'social', label: 'Social media' },
  { value: 'sito_web', label: 'Sito web' },
  { value: 'cartello', label: 'Cartello' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'telefono', label: 'Telefono' },
  { value: 'evento', label: 'Evento' },
  { value: 'altro', label: 'Altro' },
];

const TIMELINES = [
  { value: 'urgente', label: 'Urgente' },
  { value: '1-3_mesi', label: '1-3 mesi' },
  { value: '3-6_mesi', label: '3-6 mesi' },
  { value: 'esplorativo', label: 'Esplorativo' },
];

export function LeadForm({ initialData, leadId }: LeadFormProps) {
  const isEdit = !!leadId;
  const [leadType, setLeadType] = useState(initialData?.type || 'buyer');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showBuyer = leadType === 'buyer' || leadType === 'both';
  const showSeller = leadType === 'seller' || leadType === 'both';

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      let result;
      if (isEdit && leadId) {
        result = await updateLead(leadId, formData);
      } else {
        result = await createLead(formData);
      }
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Sezione Anagrafica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Anagrafica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input
              id="full_name"
              name="full_name"
              required
              defaultValue={initialData?.full_name || ''}
              placeholder="Mario Rossi"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={initialData?.phone || ''}
                placeholder="+39 333 1234567"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initialData?.email || ''}
                placeholder="mario@email.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sezione Classificazione */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Classificazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo *</Label>
            <Select
              name="type"
              defaultValue={initialData?.type || 'buyer'}
              onValueChange={(val) => setLeadType(val as 'buyer' | 'seller' | 'both')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Acquirente</SelectItem>
                <SelectItem value="seller">Venditore</SelectItem>
                <SelectItem value="both">Entrambi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="source">Fonte</Label>
            <Select name="source" defaultValue={initialData?.source || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona fonte" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Temperatura</Label>
            <RadioGroup
              name="temperature"
              defaultValue={initialData?.temperature || 'warm'}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hot" id="temp-hot" />
                <Label htmlFor="temp-hot" className="font-normal cursor-pointer">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
                  Caldo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="warm" id="temp-warm" />
                <Label htmlFor="temp-warm" className="font-normal cursor-pointer">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" />
                  Tiepido
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cold" id="temp-cold" />
                <Label htmlFor="temp-cold" className="font-normal cursor-pointer">
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1" />
                  Freddo
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Sezione Ricerca (buyer / both) */}
      {showBuyer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Ricerca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search_zones">Zone di ricerca</Label>
              <Input
                id="search_zones"
                name="search_zones"
                defaultValue={initialData?.search_zones?.join(', ') || ''}
                placeholder="Milano Centro, Navigli, Isola (separate con virgola)"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="budget_min">Budget minimo (&euro;)</Label>
                <Input
                  id="budget_min"
                  name="budget_min"
                  type="number"
                  defaultValue={initialData?.budget_min ?? ''}
                  placeholder="100000"
                />
              </div>
              <div>
                <Label htmlFor="budget_max">Budget massimo (&euro;)</Label>
                <Input
                  id="budget_max"
                  name="budget_max"
                  type="number"
                  defaultValue={initialData?.budget_max ?? ''}
                  placeholder="250000"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="property_types">Tipologia immobile</Label>
              <Input
                id="property_types"
                name="property_types"
                defaultValue={initialData?.property_types?.join(', ') || ''}
                placeholder="Appartamento, Bilocale, Trilocale (separate con virgola)"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="min_rooms">Locali minimi</Label>
                <Input
                  id="min_rooms"
                  name="min_rooms"
                  type="number"
                  defaultValue={initialData?.min_rooms ?? ''}
                  placeholder="2"
                />
              </div>
              <div>
                <Label htmlFor="min_sqm">Metratura minima (mq)</Label>
                <Input
                  id="min_sqm"
                  name="min_sqm"
                  type="number"
                  defaultValue={initialData?.min_sqm ?? ''}
                  placeholder="60"
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="must_have">Must have</Label>
              <Input
                id="must_have"
                name="must_have"
                defaultValue={initialData?.must_have?.join(', ') || ''}
                placeholder="box, balcone, ascensore, giardino, cantina"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suggerimenti: box, balcone, ascensore, giardino, cantina
              </p>
            </div>
            <div>
              <Label htmlFor="nice_to_have">Nice to have</Label>
              <Input
                id="nice_to_have"
                name="nice_to_have"
                defaultValue={initialData?.nice_to_have?.join(', ') || ''}
                placeholder="terrazzo, doppi servizi"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suggerimenti: terrazzo, doppi servizi
              </p>
            </div>
            <div>
              <Label htmlFor="timeline">Timeline</Label>
              <Select name="timeline" defaultValue={initialData?.timeline || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona timeline" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sezione Vendita (seller / both) */}
      {showSeller && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Vendita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="selling_address">Indirizzo immobile</Label>
              <Input
                id="selling_address"
                name="selling_address"
                defaultValue={initialData?.selling_address || ''}
                placeholder="Via Roma 1, Milano"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="selling_price_requested">Prezzo richiesto (&euro;)</Label>
                <Input
                  id="selling_price_requested"
                  name="selling_price_requested"
                  type="number"
                  defaultValue={initialData?.selling_price_requested ?? ''}
                  placeholder="200000"
                />
              </div>
              <div>
                <Label htmlFor="selling_price_estimated">Prezzo stimato (&euro;)</Label>
                <Input
                  id="selling_price_estimated"
                  name="selling_price_estimated"
                  type="number"
                  defaultValue={initialData?.selling_price_estimated ?? ''}
                  placeholder="180000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="mandate_type">Tipo mandato</Label>
                <Select name="mandate_type" defaultValue={initialData?.mandate_type || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo mandato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="esclusiva">Esclusiva</SelectItem>
                    <SelectItem value="non_esclusiva">Non esclusiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mandate_expiry">Scadenza mandato</Label>
                <Input
                  id="mandate_expiry"
                  name="mandate_expiry"
                  type="date"
                  defaultValue={initialData?.mandate_expiry || ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sezione Note */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Note</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="notes"
            rows={4}
            defaultValue={initialData?.notes || ''}
            placeholder="Note aggiuntive sul lead..."
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? 'Salvataggio...' : isEdit ? 'Salva Modifiche' : 'Crea Lead'}
        </Button>
      </div>
    </form>
  );
}
