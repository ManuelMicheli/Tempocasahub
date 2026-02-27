import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ImportWizard } from '@/components/import/import-wizard';

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="rounded-full p-2 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Importa Dati</h1>
          <p className="text-sm text-muted-foreground">
            Importa lead e immobili da file CSV o Excel
          </p>
        </div>
      </div>

      <ImportWizard />
    </div>
  );
}
