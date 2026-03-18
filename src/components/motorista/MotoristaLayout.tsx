import { ReactNode, useState } from 'react';
import { MotoristaSidebar } from './MotoristaSidebar';
import { CnhAlertsBadge } from './CnhAlertsBadge';
import { cn } from '@/lib/utils';

interface MotoristaLayoutProps {
  children: ReactNode;
}

export function MotoristaLayout({ children }: MotoristaLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <MotoristaSidebar collapsed={collapsed} onCollapseChange={setCollapsed} />
      <main className={cn(
        "min-h-screen transition-all duration-300",
        collapsed ? "ml-[70px]" : "ml-64"
      )}>
        {/* Top bar with alerts */}
        <div className="flex h-14 items-center justify-end border-b bg-background px-6">
          <CnhAlertsBadge />
        </div>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
