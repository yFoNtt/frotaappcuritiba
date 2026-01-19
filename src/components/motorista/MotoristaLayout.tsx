import { ReactNode, useState, useEffect } from 'react';
import { MotoristaSidebar } from './MotoristaSidebar';
import { CnhAlertsBadge } from './CnhAlertsBadge';

interface MotoristaLayoutProps {
  children: ReactNode;
}

export function MotoristaLayout({ children }: MotoristaLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      const observer = new MutationObserver(() => {
        setSidebarCollapsed(sidebar.classList.contains('w-[70px]'));
      });
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MotoristaSidebar />
      <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-64'}`}>
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
