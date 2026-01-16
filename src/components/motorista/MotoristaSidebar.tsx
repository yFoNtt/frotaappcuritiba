import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car,
  CreditCard,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/motorista' },
  { icon: Car, label: 'Meu Veículo', path: '/motorista/veiculo' },
  { icon: CreditCard, label: 'Pagamentos', path: '/motorista/pagamentos' },
  { icon: History, label: 'Histórico', path: '/motorista/historico' },
  { icon: Settings, label: 'Configurações', path: '/motorista/configuracoes' },
];

export function MotoristaSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso!');
    navigate('/');
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300",
        collapsed ? "w-[70px]" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link to="/motorista" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">Motorista</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", collapsed && "justify-center")}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Truck className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">Motorista</p>
                <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
