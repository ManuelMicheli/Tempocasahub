import Link from 'next/link';
import { Bell, User, Upload, MessageCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const settingsLinks = [
  {
    href: '/settings/follow-up',
    icon: Bell,
    title: 'Regole Follow-up',
    description:
      'Configura le regole automatiche di follow-up, template e coda messaggi',
  },
  {
    href: '/settings/whatsapp',
    icon: MessageCircle,
    title: 'WhatsApp',
    description:
      'Collega il tuo WhatsApp per sincronizzare automaticamente le conversazioni con i lead',
  },
  {
    href: '/settings/import',
    icon: Upload,
    title: 'Importa Dati',
    description:
      'Importa lead e immobili da file CSV, Excel o export da portali e gestionali',
  },
  {
    href: '/settings',
    icon: User,
    title: 'Profilo',
    description: 'Gestisci il tuo profilo e le preferenze account',
    disabled: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-sm text-muted-foreground">
          Gestisci le impostazioni del tuo account e le regole automatiche
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsLinks.map((item) => {
          const Icon = item.icon;
          const content = (
            <Card
              className={`transition-colors ${
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-muted/50 cursor-pointer'
              }`}
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <div className="rounded-lg bg-muted p-2">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </div>
                {!item.disabled && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                {item.disabled && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Prossimamente
                  </p>
                )}
              </CardContent>
            </Card>
          );

          if (item.disabled) {
            return <div key={item.title}>{content}</div>;
          }

          return (
            <Link key={item.title} href={item.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
