import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading: authLoading } = useAuth();

  const initialMode = location.pathname === '/cadastro' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    setMode(location.pathname === '/cadastro' ? 'register' : 'login');
  }, [location.pathname]);

  useEffect(() => {
    if (user && role && !authLoading) {
      const redirectPath = role === 'admin' ? '/admin' : role === 'locador' ? '/locador' : '/motorista';
      const timer = setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, role, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PublicLayout>
      <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {mode === 'login' ? 'Entrar no FrotaApp' : 'Criar conta no FrotaApp'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Acesse sua conta para gerenciar veículos e aluguéis'
                : 'Cadastre-se para começar a usar a plataforma'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === 'login' ? (
              <LoginForm />
            ) : (
              <RegisterForm onRegistered={() => setMode('login')} />
            )}
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  Não tem uma conta?{' '}
                  <button onClick={() => setMode('register')} className="font-medium text-primary hover:underline">
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{' '}
                  <button onClick={() => setMode('login')} className="font-medium text-primary hover:underline">
                    Entre aqui
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}
