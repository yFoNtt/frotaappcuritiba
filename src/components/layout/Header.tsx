import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { preloadRoute, preloadCriticalRoutes } from '@/lib/routePreload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutConfirmDialog } from '@/components/auth/LogoutConfirmDialog';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  // Preload critical routes on idle after first render
  useEffect(() => {
    preloadCriticalRoutes();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Início' },
    { path: '/veiculos', label: 'Veículos' },
    { path: '/como-funciona', label: 'Como Funciona' },
    { path: '/para-locadores', label: 'Para Locadores' },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso!');
    navigate('/');
  };

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'locador') return '/locador';
    if (role === 'motorista') return '/motorista';
    return '/';
  };

  const getRoleName = () => {
    if (role === 'admin') return 'Administrador';
    if (role === 'locador') return 'Locador';
    if (role === 'motorista') return 'Motorista';
    return 'Usuário';
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 sm:h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary">
            <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-foreground">
            Frota<span className="text-primary">App</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onMouseEnter={() => preloadRoute(link.path)}
              onFocus={() => preloadRoute(link.path)}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                isActive(link.path)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{getRoleName()}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild onFocus={() => preloadRoute(getDashboardPath())}>
                  <Link to={getDashboardPath()} className="cursor-pointer" onMouseEnter={() => preloadRoute(getDashboardPath())}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Meu Painel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <LogoutConfirmDialog onConfirm={handleLogout}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </LogoutConfirmDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login" onMouseEnter={() => preloadRoute('/login')} onFocus={() => preloadRoute('/login')}>
                  <User className="mr-2 h-4 w-4" />
                  Entrar
                </Link>
              </Button>
              <Button asChild>
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-0.5 sm:gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden animate-slide-up">
          <nav className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
                  isActive(link.path)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 px-4">
              {user ? (
                <>
                  <div className="mb-2 rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{getRoleName()}</p>
                  </div>
                  <Button variant="outline" asChild className="w-full">
                    <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Meu Painel
                    </Link>
                  </Button>
                  <LogoutConfirmDialog onConfirm={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </Button>
                  </LogoutConfirmDialog>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Entrar
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                      Cadastrar
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
