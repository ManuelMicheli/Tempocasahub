import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateBrief } from '@/lib/brief/generate-brief';
import { AppointmentBrief } from '@/components/brief/appointment-brief';
import { BriefShareButton } from '@/components/brief/brief-share-button';

interface BriefPageProps {
  params: Promise<{ id: string }>;
}

export default async function BriefPage({ params }: BriefPageProps) {
  const { id } = await params;
  const brief = await generateBrief(id);

  if (!brief) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/calendar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Brief non trovato</h1>
        </div>
        <p className="text-muted-foreground">
          L&apos;appuntamento richiesto non esiste o non e&apos; stato possibile
          generare il brief.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/calendar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Brief appuntamento</h1>
        </div>
        <BriefShareButton />
      </div>

      <AppointmentBrief brief={brief} />
    </div>
  );
}
