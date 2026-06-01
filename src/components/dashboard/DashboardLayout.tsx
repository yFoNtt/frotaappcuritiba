import { ReactNode, useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LocadorAssistant } from '@/components/locador/LocadorAssistant';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar collapsed={collapsed} onCollapseChange={setCollapsed} />
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-16 md:pt-0",
        collapsed ? "md:ml-[70px]" : "md:ml-64"
      )}>
        {/* Top header (desktop only) */}
        <div className="hidden md:flex h-14 items-center justify-end gap-2 border-b bg-background px-6">
          <NotificationBell variant="header" viewAllPath="/locador/notificacoes" />
        </div>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
      <LocadorAssistant />
    </div>
  );
}
