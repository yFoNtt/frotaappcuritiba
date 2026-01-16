import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Mail, Lock, Building2, Truck, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type AppRole = 'locador' | 'motorista';

export default function Auth() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading, signIn, signUp } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('locador');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && role && !authLoading) {
      const redirectPath = role === 'admin' ? '/admin' : role === 'locador' ? '/locador' : '/motorista';
      navigate(redirectPath, { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Login realizado com sucesso!');
    }

    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, selectedRole);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      // Clear form and switch to login mode
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setMode('login');
    }

    setLoading(false);
  };

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
                : 'Cadastre-se para começar a usar a plataforma'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Login/Register Toggle */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Role Selection (only for register) */}
            {mode === 'register' && (
              <div className="mb-6">
                <Label className="mb-2 block text-sm font-medium">Tipo de conta</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={selectedRole === 'locador' ? 'default' : 'outline'}
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => setSelectedRole('locador')}
                  >
                    <Building2 className="h-5 w-5" />
                    <span className="text-xs">Locador</span>
                    <span className="text-xs text-muted-foreground">Alugue veículos</span>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedRole === 'motorista' ? 'default' : 'outline'}
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => setSelectedRole('motorista')}
                  >
                    <Truck className="h-5 w-5" />
                    <span className="text-xs">Motorista</span>
                    <span className="text-xs text-muted-foreground">Alugue carros</span>
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {mode === 'login' && (
                    <Link to="/esqueci-senha" className="text-xs text-primary hover:underline">
                      Esqueceu a senha?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
                  </>
                ) : (
                  mode === 'login' ? 'Entrar' : 'Criar conta'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  Não tem uma conta?{' '}
                  <button 
                    onClick={() => setMode('register')} 
                    className="font-medium text-primary hover:underline"
                  >
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{' '}
                  <button 
                    onClick={() => setMode('login')} 
                    className="font-medium text-primary hover:underline"
                  >
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
