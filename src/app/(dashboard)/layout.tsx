import { redirect } from 'next/navigation';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { AgentProvider } from '@/components/providers/agent-provider';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { MotionProvider } from '@/components/motion';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let agent;
  try {
    agent = await getCurrentAgent();
  } catch (e) {
    console.error('Failed to get current agent:', e);
    redirect('/login');
  }
  if (!agent) redirect('/login');

  return (
    <AgentProvider agent={agent}>
      <div className="flex min-h-screen">
        {/* Sidebar: visible on tablet landscape (lg) and up */}
        <div className="hidden lg:block">
          <div className="fixed inset-y-0 left-0 z-30 w-[260px]">
            <Sidebar />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col lg:pl-[260px]">
          {/* Header: always visible, hamburger only below lg */}
          <div className="sticky top-0 z-20">
            <Header />
          </div>

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6">
            <MotionProvider>
              {children}
            </MotionProvider>
          </main>
        </div>
      </div>
    </AgentProvider>
  );
}
