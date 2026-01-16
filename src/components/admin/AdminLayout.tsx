import { ReactNode, useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleResize = () => {
      // Check if sidebar is collapsed based on its width
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        setSidebarCollapsed(sidebar.classList.contains('w-[70px]'));
      }
    };

    // Use MutationObserver to detect class changes on sidebar
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
      <AdminSidebar />
      <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-64'}`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
