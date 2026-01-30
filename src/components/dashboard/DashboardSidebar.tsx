import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  CreditCard, 
  Wrench, 
  Bell, 
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Gauge,
  FolderOpen,
  Inbox,
  BarChart3,
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
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/locador' },
  { icon: Car, label: 'Veículos', path: '/locador/veiculos' },
  { icon: Users, label: 'Motoristas', path: '/locador/motoristas' },
  { icon: FileText, label: 'Contratos', path: '/locador/contratos' },
  { icon: CreditCard, label: 'Pagamentos', path: '/locador/pagamentos' },
  { icon: Wrench, label: 'Manutenção', path: '/locador/manutencao' },
  { icon: Gauge, label: 'Quilometragem', path: '/locador/quilometragem' },
  { icon: BarChart3, label: 'Relatórios', path: '/locador/relatorios' },
  { icon: FolderOpen, label: 'Documentos', path: '/locador/documentos' },
  { icon: Inbox, label: 'Solicitações', path: '/locador/solicitacoes' },
  { icon: Bell, label: 'Alertas', path: '/locador/alertas' },
  { icon: Settings, label: 'Configurações', path: '/locador/configuracoes' },
];

function SidebarContent({ collapsed, onCollapse, onClose, onLogout }: { 
  collapsed: boolean; 
  onCollapse?: () => void;
  onClose?: () => void;
  onLogout: () => void;
}) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 flex-shrink-0">
        {!collapsed && (
          <Link to="/locador" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Car className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">FrotaApp</span>
          </Link>
        )}
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sidebar-foreground hover:bg-sidebar-accent md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation - Scrollable */}
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section - Fixed at bottom */}
      <div className="border-t border-sidebar-border p-3 flex-shrink-0">
        <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", collapsed && "justify-center")}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
            <span className="text-sm font-semibold">JS</span>
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">João Silva</p>
              <p className="truncate text-xs text-sidebar-foreground/60">JS Locações</p>
            </div>
          )}
        </div>
        <LogoutConfirmDialog onConfirm={onLogout}>
          <button
            className={cn(
              "mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </LogoutConfirmDialog>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Close mobile menu on route change
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
      {/* Mobile Menu Button */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="bg-background">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <SidebarContent 
              collapsed={false} 
              onClose={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </SheetContent>
        </Sheet>
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
          onCollapse={() => setCollapsed(!collapsed)}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}
