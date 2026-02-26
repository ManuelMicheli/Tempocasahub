'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Zap,
  Calendar,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAgent } from '@/components/providers/agent-provider';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Lead', href: '/leads', icon: Users },
  { label: 'Immobili', href: '/properties', icon: Building2 },
  { label: 'Match', href: '/matches', icon: Zap },
  { label: 'Calendario', href: '/calendar', icon: Calendar },
  { label: 'Impostazioni', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const agent = useAgent();

  return (
    <aside className="flex h-full w-[250px] flex-col border-r bg-background">
      {/* Logo / Brand */}
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">TempoCasa</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Agent info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {agent.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">{agent.full_name}</p>
            <Badge variant="secondary" className="mt-0.5 text-[10px] capitalize">
              {agent.role}
            </Badge>
          </div>
        </div>
      </div>
    </aside>
  );
}
