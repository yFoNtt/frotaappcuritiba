import { Link, useLocation, useNavigate } from 'react-router-dom';
import { preloadRoute } from '@/lib/routePreload';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Car,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Shield,
  History,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { LogoutConfirmDialog } from '@/components/auth/LogoutConfirmDialog';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Usuários', path: '/admin/usuarios' },
  { icon: Building2, label: 'Locadores', path: '/admin/locadores' },
  { icon: Car, label: 'Veículos', path: '/admin/veiculos' },
  { icon: CreditCard, label: 'Planos', path: '/admin/planos' },
  { icon: BarChart3, label: 'Métricas', path: '/admin/metricas' },
  { icon: History, label: 'Auditoria', path: '/admin/auditoria' },
  { icon: Settings, label: 'Configurações', path: '/admin/configuracoes' },
];

function SidebarContent({ collapsed, onCollapse, onClose, onLogout, userEmail }: {
  collapsed: boolean;
  onCollapse?: () => void;
  onClose?: () => void;
  onLogout: () => void;
  userEmail?: string;
}) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 flex-shrink-0">
        {!collapsed && (
          <Link to="/admin" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive">
              <Shield className="h-5 w-5 text-destructive-foreground" />
            </div>
            <span className="text-lg font-bold">Admin</span>
          </Link>
        )}
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-3">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={onClose ? { opacity: 0, x: -20 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.25, ease: "easeOut" }}
              >
                <Link
                  to={item.path}
                  onClick={onClose}
                  onMouseEnter={() => preloadRoute(item.path)}
                  onFocus={() => preloadRoute(item.path)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-destructive text-destructive-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </motion.div>
            );
          })}
          <motion.div
            initial={onClose ? { opacity: 0, x: -20 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: menuItems.length * 0.05, duration: 0.25, ease: "easeOut" }}
          >
            <NotificationBell collapsed={collapsed} />
          </motion.div>
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3 flex-shrink-0">
        <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", collapsed && "justify-center")}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
            <Shield className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">Administrador</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{userEmail}</p>
            </div>
          )}
        </div>
        <div className={cn("mt-2 flex items-center gap-2", collapsed && "flex-col")}>
          <ThemeToggle />
          <LogoutConfirmDialog onConfirm={onLogout}>
            <button
              className={cn(
                "flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center w-full"
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Sair</span>}
            </button>
          </LogoutConfirmDialog>
        </div>
      </div>
    </div>
  );
}

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

export function AdminSidebar({ collapsed, onCollapseChange }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const location = useLocation();
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso!');
    navigate('/');
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed left-0 top-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-background border-b border-border md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="relative">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-[hsl(var(--sidebar-background))] border-sidebar-border [&>button]:text-sidebar-foreground">
            <SidebarContent
              collapsed={false}
              onClose={() => setMobileOpen(false)}
              onLogout={handleLogout}
              userEmail={user?.email}
            />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold text-foreground">Admin</span>
        <ThemeToggle />
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 hidden md:block",
          collapsed ? "w-[70px]" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onCollapse={() => onCollapseChange(!collapsed)}
          onLogout={handleLogout}
          userEmail={user?.email}
        />
      </aside>
    </>
  );
}
