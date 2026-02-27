import { getCurrentAgent } from '@/lib/supabase/agent';
import { createCensusZone } from '@/lib/actions/census';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTransition } from '@/components/motion';

export default async function NewCensusZonePage() {
  const agent = await getCurrentAgent();

  if (!agent) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Non autenticato. Effettua il login.
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Nuova Zona di Censimento</h1>
        <p className="text-sm text-muted-foreground">
          Crea una nuova zona per il censimento porta a porta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dati Zona</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCensusZone} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Zona *</Label>
              <Input
                id="name"
                name="name"
                placeholder="es. Cornaredo Centro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipality_code">Codice Catastale</Label>
              <Input
                id="municipality_code"
                name="municipality_code"
                placeholder="es. D019"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  name="province"
                  placeholder="es. MI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Regione</Label>
                <Input
                  id="region"
                  name="region"
                  placeholder="es. Lombardia"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Crea Zona
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}
