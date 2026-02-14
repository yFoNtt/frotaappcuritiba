import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Mail, Lock, Building2, Truck, Loader2, Eye, EyeOff, FileText, CheckCircle2, XCircle, CreditCard, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { validateDocument, formatDocument, validateCNHDocument, formatCNH } from '@/lib/documentValidation';
import { format, isAfter, startOfDay, addDays } from 'date-fns';

type AppRole = 'locador' | 'motorista';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading: authLoading, signIn, signUp } = useAuth();
  
  // Set initial mode based on route
  const initialMode = location.pathname === '/cadastro' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [document, setDocument] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [documentValid, setDocumentValid] = useState(false);
  const [cnh, setCnh] = useState('');
  const [cnhError, setCnhError] = useState('');
  const [cnhValid, setCnhValid] = useState(false);
  const [cnhExpiry, setCnhExpiry] = useState('');
  const [cnhExpiryError, setCnhExpiryError] = useState('');
  const [cnhExpiryValid, setCnhExpiryValid] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>('locador');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Update mode when route changes
  useEffect(() => {
    setMode(location.pathname === '/cadastro' ? 'register' : 'login');
  }, [location.pathname]);

  // Redirect if already logged in (delayed to avoid DOM conflict with toast)
  useEffect(() => {
    if (user && role && !authLoading) {
      const redirectPath = role === 'admin' ? '/admin' : role === 'locador' ? '/locador' : '/motorista';
      const timer = setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, role, authLoading, navigate]);

  // Clear CNH fields when switching to locador
  useEffect(() => {
    if (selectedRole === 'locador') {
      setCnh('');
      setCnhError('');
      setCnhValid(false);
      setCnhExpiry('');
      setCnhExpiryError('');
      setCnhExpiryValid(false);
    }
  }, [selectedRole]);

  const handleDocumentChange = (value: string) => {
    const formatted = formatDocument(value);
    setDocument(formatted);
    
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 11) {
      const validation = validateDocument(cleanValue);
      setDocumentValid(validation.isValid);
      setDocumentError(validation.isValid ? '' : validation.message);
    } else {
      setDocumentValid(false);
      setDocumentError('');
    }
  };

  const handleCnhChange = (value: string) => {
    const formatted = formatCNH(value);
    setCnh(formatted);
    
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 11) {
      const validation = validateCNHDocument(cleanValue);
      setCnhValid(validation.isValid);
      setCnhError(validation.isValid ? '' : validation.message);
    } else if (cleanValue.length > 0 && cleanValue.length < 11) {
      setCnhValid(false);
      setCnhError('');
    } else {
      setCnhValid(false);
      setCnhError('');
    }
  };

  const handleCnhExpiryChange = (value: string) => {
    setCnhExpiry(value);
    
    if (!value) {
      setCnhExpiryValid(false);
      setCnhExpiryError('');
      return;
    }

    const expiryDate = new Date(value);
    const today = startOfDay(new Date());
    
    if (isAfter(expiryDate, today)) {
      setCnhExpiryValid(true);
      setCnhExpiryError('');
    } else {
      setCnhExpiryValid(false);
      setCnhExpiryError('CNH vencida. Renove sua habilitação antes de continuar.');
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  };

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

    // Validate document
    const docValidation = validateDocument(document);
    if (!docValidation.isValid) {
      toast.error(docValidation.message);
      setDocumentError(docValidation.message);
      setLoading(false);
      return;
    }

    // Validate CNH for motorista
    if (selectedRole === 'motorista') {
      const cnhValidation = validateCNHDocument(cnh);
      if (!cnhValidation.isValid) {
        toast.error(cnhValidation.message);
        setCnhError(cnhValidation.message);
        setLoading(false);
        return;
      }

      // Validate CNH expiry
      if (!cnhExpiry) {
        toast.error('Data de validade da CNH é obrigatória');
        setCnhExpiryError('Data de validade é obrigatória');
        setLoading(false);
        return;
      }

      const expiryDate = new Date(cnhExpiry);
      const today = startOfDay(new Date());
      if (!isAfter(expiryDate, today)) {
        toast.error('CNH vencida. Renove sua habilitação antes de continuar.');
        setCnhExpiryError('CNH vencida. Renove sua habilitação antes de continuar.');
        setLoading(false);
        return;
      }
    }

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

    // Prepare profile data
    const cleanDocument = document.replace(/\D/g, '');
    const profileData = {
      documentType: cleanDocument.length === 11 ? 'cpf' as const : 'cnpj' as const,
      documentNumber: cleanDocument,
      cnhNumber: selectedRole === 'motorista' ? cnh.replace(/\D/g, '') : undefined,
      cnhExpiry: selectedRole === 'motorista' ? cnhExpiry : undefined
    };

    const { error } = await signUp(email, password, selectedRole, profileData);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      // Clear form and switch to login mode
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDocument('');
      setDocumentError('');
      setDocumentValid(false);
      setCnh('');
      setCnhError('');
      setCnhValid(false);
      setCnhExpiry('');
      setCnhExpiryError('');
      setCnhExpiryValid(false);
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
                <Label className="mb-3 block text-sm font-medium">Selecione o tipo de conta</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('locador')}
                    className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                      selectedRole === 'locador'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    {selectedRole === 'locador' && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      selectedRole === 'locador' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold ${selectedRole === 'locador' ? 'text-primary' : 'text-foreground'}`}>
                        Locador
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tenho veículos para alugar
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('motorista')}
                    className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                      selectedRole === 'motorista'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    {selectedRole === 'motorista' && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      selectedRole === 'motorista' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Truck className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold ${selectedRole === 'motorista' ? 'text-primary' : 'text-foreground'}`}>
                        Motorista
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Quero alugar um veículo
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {/* CPF/CNPJ Field (only for register) */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="document">
                    {selectedRole === 'locador' ? 'CPF ou CNPJ' : 'CPF'}
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="document"
                      type="text"
                      placeholder={selectedRole === 'locador' ? '000.000.000-00 ou 00.000.000/0000-00' : '000.000.000-00'}
                      value={document}
                      onChange={(e) => handleDocumentChange(e.target.value)}
                      className={`pl-10 pr-10 ${
                        documentError ? 'border-destructive focus-visible:ring-destructive' : 
                        documentValid ? 'border-green-500 focus-visible:ring-green-500' : ''
                      }`}
                      required
                      disabled={loading}
                      maxLength={selectedRole === 'locador' ? 18 : 14}
                    />
                    {document.replace(/\D/g, '').length >= 11 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {documentValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                  {documentError && (
                    <p className="text-xs text-destructive">{documentError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {selectedRole === 'locador' 
                      ? 'Pessoa física: CPF | Pessoa jurídica: CNPJ'
                      : 'Digite seu CPF (apenas números)'
                    }
                  </p>
                </div>
              )}

              {/* CNH Field (only for motorista) */}
              {mode === 'register' && selectedRole === 'motorista' && (
                <div className="space-y-2">
                  <Label htmlFor="cnh">CNH (Carteira de Habilitação)</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="cnh"
                      type="text"
                      placeholder="000 0000 0000"
                      value={cnh}
                      onChange={(e) => handleCnhChange(e.target.value)}
                      className={`pl-10 pr-10 ${
                        cnhError ? 'border-destructive focus-visible:ring-destructive' : 
                        cnhValid ? 'border-green-500 focus-visible:ring-green-500' : ''
                      }`}
                      required
                      disabled={loading}
                      maxLength={13}
                    />
                    {cnh.replace(/\D/g, '').length === 11 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {cnhValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                  {cnhError && (
                    <p className="text-xs text-destructive">{cnhError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Digite o número da sua CNH (11 dígitos)
                  </p>
                </div>
              )}

              {/* CNH Expiry Date (only for motorista) */}
              {mode === 'register' && selectedRole === 'motorista' && (
                <div className="space-y-2">
                  <Label htmlFor="cnhExpiry">Validade da CNH</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="cnhExpiry"
                      type="date"
                      value={cnhExpiry}
                      onChange={(e) => handleCnhExpiryChange(e.target.value)}
                      min={getMinDate()}
                      className={`pl-10 pr-10 ${
                        cnhExpiryError ? 'border-destructive focus-visible:ring-destructive' : 
                        cnhExpiryValid ? 'border-green-500 focus-visible:ring-green-500' : ''
                      }`}
                      required
                      disabled={loading}
                    />
                    {cnhExpiry && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {cnhExpiryValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                  {cnhExpiryError && (
                    <p className="text-xs text-destructive">{cnhExpiryError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    A CNH deve estar válida para cadastro
                  </p>
                </div>
              )}

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
                {mode === 'login' && (
                  <div className="flex justify-end">
                    <Link 
                      to="/esqueci-senha" 
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                )}
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
