import { ReactNode, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar collapsed={collapsed} onCollapseChange={setCollapsed} />
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
