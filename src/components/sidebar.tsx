'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Zap,
  Calendar,
  MapPin,
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
  { label: 'Censimento', href: '/censimento', icon: MapPin },
  { label: 'Impostazioni', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const agent = useAgent();

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-r-border/50 bg-background/60 backdrop-blur-xl">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">TempoCasa</span>
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Agent info */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary border border-primary/30">
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
