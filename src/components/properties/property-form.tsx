'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createProperty, updateProperty } from '@/lib/actions/properties';
import type { Property } from '@/types/database';

const PROPERTY_TYPES = [
  { value: 'appartamento', label: 'Appartamento' },
  { value: 'villa', label: 'Villa' },
  { value: 'loft', label: 'Loft' },
  { value: 'bilocale', label: 'Bilocale' },
  { value: 'trilocale', label: 'Trilocale' },
  { value: 'attico', label: 'Attico' },
  { value: 'monolocale', label: 'Monolocale' },
  { value: 'casa_indipendente', label: 'Casa indipendente' },
];

const ENERGY_CLASSES = ['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G'];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Bozza' },
  { value: 'available', label: 'Disponibile' },
  { value: 'reserved', label: 'Riservato' },
  { value: 'sold', label: 'Venduto' },
  { value: 'withdrawn', label: 'Ritirato' },
];

const CONDITION_OPTIONS = [
  { value: 'nuovo', label: 'Nuovo' },
  { value: 'ristrutturato', label: 'Ristrutturato' },
  { value: 'buono', label: 'Buono' },
  { value: 'da_ristrutturare', label: 'Da ristrutturare' },
];

const HEATING_OPTIONS = [
  { value: 'autonomo', label: 'Autonomo' },
  { value: 'centralizzato', label: 'Centralizzato' },
];

const FEATURES_LIST = [
  { value: 'box', label: 'Box' },
  { value: 'balcone', label: 'Balcone' },
  { value: 'ascensore', label: 'Ascensore' },
  { value: 'giardino', label: 'Giardino' },
  { value: 'cantina', label: 'Cantina' },
  { value: 'terrazzo', label: 'Terrazzo' },
  { value: 'doppi_servizi', label: 'Doppi servizi' },
  { value: 'aria_condizionata', label: 'Aria condizionata' },
  { value: 'posto_auto', label: 'Posto auto' },
];

const PORTALS = [
  { value: 'immobiliare.it', label: 'Immobiliare.it' },
  { value: 'idealista', label: 'Idealista' },
  { value: 'casa.it', label: 'Casa.it' },
];

interface PropertyFormProps {
  initialData?: Property;
  propertyId?: string;
}

export function PropertyForm({ initialData, propertyId }: PropertyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    initialData?.features ?? []
  );
  const [selectedPortals, setSelectedPortals] = useState<string[]>(
    initialData?.published_on ?? []
  );

  // Select state (controlled to work with hidden inputs)
  const [propertyType, setPropertyType] = useState<string>(
    initialData?.property_type ?? ''
  );
  const [energyClass, setEnergyClass] = useState<string>(
    initialData?.energy_class ?? ''
  );
  const [status, setStatus] = useState<string>(initialData?.status ?? 'available');
  const [condition, setCondition] = useState<string>(initialData?.condition ?? '');
  const [heating, setHeating] = useState<string>(initialData?.heating ?? '');

  function toggleFeature(feature: string) {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  }

  function togglePortal(portal: string) {
    setSelectedPortals((prev) =>
      prev.includes(portal)
        ? prev.filter((p) => p !== portal)
        : [...prev, portal]
    );
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);

    try {
      let result;
      if (propertyId) {
        result = await updateProperty(propertyId, formData);
      } else {
        result = await createProperty(formData);
      }
      // If we get here, redirect didn't happen — meaning there was an error
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect() throws NEXT_REDIRECT — this is expected
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Hidden fields for array/select data */}
      <input type="hidden" name="features" value={selectedFeatures.join(',')} />
      <input
        type="hidden"
        name="published_on"
        value={selectedPortals.join(',')}
      />
      <input type="hidden" name="property_type" value={propertyType} />
      <input type="hidden" name="energy_class" value={energyClass} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="condition" value={condition} />
      <input type="hidden" name="heating" value={heating} />

      {/* Section 1: Dettagli */}
      <Card>
        <CardHeader>
          <CardTitle>Dettagli</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialData?.title ?? ''}
              placeholder="Es. Trilocale luminoso con terrazzo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Indirizzo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              name="address"
              required
              defaultValue={initialData?.address ?? ''}
              placeholder="Via Roma 15"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">
              Citta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              name="city"
              required
              defaultValue={initialData?.city ?? ''}
              placeholder="Milano"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zone">Zona</Label>
            <Input
              id="zone"
              name="zone"
              defaultValue={initialData?.zone ?? ''}
              placeholder="Centro storico"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Tipologia <span className="text-destructive">*</span>
            </Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipologia" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Caratteristiche */}
      <Card>
        <CardHeader>
          <CardTitle>Caratteristiche</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="price">
              Prezzo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              required
              min={0}
              defaultValue={initialData?.price ?? ''}
              placeholder="250000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sqm">Superficie (mq)</Label>
            <Input
              id="sqm"
              name="sqm"
              type="number"
              min={0}
              defaultValue={initialData?.sqm ?? ''}
              placeholder="85"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rooms">Locali</Label>
            <Input
              id="rooms"
              name="rooms"
              type="number"
              min={0}
              defaultValue={initialData?.rooms ?? ''}
              placeholder="3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedrooms">Camere da letto</Label>
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min={0}
              defaultValue={initialData?.bedrooms ?? ''}
              placeholder="2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bathrooms">Bagni</Label>
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min={0}
              defaultValue={initialData?.bathrooms ?? ''}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="floor">Piano</Label>
            <Input
              id="floor"
              name="floor"
              type="number"
              defaultValue={initialData?.floor ?? ''}
              placeholder="3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_floors">Piani totali</Label>
            <Input
              id="total_floors"
              name="total_floors"
              type="number"
              min={0}
              defaultValue={initialData?.total_floors ?? ''}
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year_built">Anno costruzione</Label>
            <Input
              id="year_built"
              name="year_built"
              type="number"
              defaultValue={initialData?.year_built ?? ''}
              placeholder="1990"
            />
          </div>

          <div className="space-y-2">
            <Label>Classe energetica</Label>
            <Select value={energyClass} onValueChange={setEnergyClass}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona" />
              </SelectTrigger>
              <SelectContent>
                {ENERGY_CLASSES.map((ec) => (
                  <SelectItem key={ec} value={ec}>
                    {ec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Features */}
      <Card>
        <CardHeader>
          <CardTitle>Dotazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {FEATURES_LIST.map((feature) => (
              <div key={feature.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${feature.value}`}
                  checked={selectedFeatures.includes(feature.value)}
                  onCheckedChange={() => toggleFeature(feature.value)}
                />
                <Label
                  htmlFor={`feature-${feature.value}`}
                  className="font-normal"
                >
                  {feature.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Stato e Condizioni */}
      <Card>
        <CardHeader>
          <CardTitle>Stato e Condizioni</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Stato</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona stato" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Condizione</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona condizione" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Riscaldamento</Label>
            <Select value={heating} onValueChange={setHeating}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona" />
              </SelectTrigger>
              <SelectContent>
                {HEATING_OPTIONS.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Media */}
      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="photos">Foto (un URL per riga)</Label>
            <Textarea
              id="photos"
              name="photos"
              rows={4}
              defaultValue={initialData?.photos?.join('\n') ?? ''}
              placeholder={
                'https://example.com/foto1.jpg\nhttps://example.com/foto2.jpg'
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="virtual_tour_url">URL Virtual Tour</Label>
            <Input
              id="virtual_tour_url"
              name="virtual_tour_url"
              type="url"
              defaultValue={initialData?.virtual_tour_url ?? ''}
              placeholder="https://example.com/virtual-tour"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Portali */}
      <Card>
        <CardHeader>
          <CardTitle>Portali di pubblicazione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {PORTALS.map((portal) => (
              <div key={portal.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`portal-${portal.value}`}
                  checked={selectedPortals.includes(portal.value)}
                  onCheckedChange={() => togglePortal(portal.value)}
                />
                <Label
                  htmlFor={`portal-${portal.value}`}
                  className="font-normal"
                >
                  {portal.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Descrizione */}
      <Card>
        <CardHeader>
          <CardTitle>Descrizione</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={initialData?.description ?? ''}
              placeholder="Descrizione dettagliata dell'immobile..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_notes">Note interne</Label>
            <Textarea
              id="internal_notes"
              name="internal_notes"
              rows={3}
              defaultValue={initialData?.internal_notes ?? ''}
              placeholder="Note visibili solo all'agente..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_lead_id">ID Proprietario (Lead)</Label>
            <Input
              id="owner_lead_id"
              name="owner_lead_id"
              defaultValue={initialData?.owner_lead_id ?? ''}
              placeholder="UUID del lead proprietario"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? 'Salvataggio...'
            : propertyId
              ? 'Salva Modifiche'
              : 'Crea Immobile'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annulla
        </Button>
      </div>
    </form>
  );
}
