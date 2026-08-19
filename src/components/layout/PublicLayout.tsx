import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface PublicLayoutProps {
  children: ReactNode;
}

// Rotas de autenticação/recuperação: nunca devem ser sequestradas pelo gate
// de "usuário sem papel" (ex.: link de redefinição de senha abre com sessão
// de recuperação e ficaria preso em loop de carregamento).
const ROLE_GATE_EXEMPT = [
  '/login',
  '/cadastro',
  '/esqueci-senha',
  '/redefinir-senha',
  '/verificacao',
  '/consent-required',
];

export function PublicLayout({ children }: PublicLayoutProps) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname;
  const isExempt =
    ROLE_GATE_EXEMPT.includes(pathname) || pathname.startsWith('/convite/');
  const needsRoleSelection = !loading && !!user && !role;

  useEffect(() => {
    if (needsRoleSelection && !isExempt) {
      navigate('/login', { replace: true });
    }
  }, [needsRoleSelection, isExempt, navigate]);

  if (needsRoleSelection && !isExempt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecionando para seleção de perfil...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
