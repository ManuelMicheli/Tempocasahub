import { Building2 } from 'lucide-react';
import { MotionProvider } from '@/components/motion';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-[0_0_15px_rgba(0,166,80,0.3)]">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">TempoCasa</h1>
            <p className="text-sm text-muted-foreground">
              CRM Agenti Immobiliari
            </p>
          </div>
          {children}
        </div>
      </div>
    </MotionProvider>
  );
}
