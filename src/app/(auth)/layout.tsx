import { Building2 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TempoCasa</h1>
          <p className="text-sm text-muted-foreground">
            CRM Agenti Immobiliari
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
