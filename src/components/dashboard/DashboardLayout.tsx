import { ReactNode, useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
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
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
