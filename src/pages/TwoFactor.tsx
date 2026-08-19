import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { toast } from 'sonner';
import { isValidMfaCode, MFA_RESEND_SECONDS } from '@/lib/mfa';

export default function TwoFactor() {
  const navigate = useNavigate();
  const { user, role, loading, mfaRequired, mfaVerified, markMfaVerified, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const autoSentRef = useRef(false);

  const dashboardPath =
    role === 'admin' ? '/admin' : role === 'locador' ? '/locador' : role === 'motorista' ? '/motorista' : '/';

  const sendCode = useCallback(async () => {
    if (!user?.email) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: { shouldCreateUser: false },
    });
    setSending(false);

    if (error) {
      toast.error('Não foi possível enviar o código. Tente novamente em instantes.');
      return;
    }
    setSecondsLeft(MFA_RESEND_SECONDS);
    toast.success('Código enviado para o seu e-mail.');
  }, [user?.email]);

  // Envia o código automaticamente na primeira abertura da tela.
  useEffect(() => {
    if (!loading && user?.email && !autoSentRef.current) {
      autoSentRef.current = true;
      sendCode();
    }
  }, [loading, user?.email, sendCode]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && (!mfaRequired || mfaVerified)) {
      navigate(dashboardPath, { replace: true });
    }
  }, [loading, user, mfaRequired, mfaVerified, dashboardPath, navigate]);

  const handleVerify = async (value: string) => {
    if (!user?.email) return;
    if (!isValidMfaCode(value)) {
      toast.error('Digite os 6 dígitos do código.');
      return;
    }

    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: user.email,
      token: value.trim(),
      type: 'email',
    });
    setVerifying(false);

    if (error) {
      setCode('');
      toast.error('Código inválido ou expirado. Solicite um novo código.');
      return;
    }

    markMfaVerified();
    toast.success('Verificação concluída!');
    navigate(dashboardPath, { replace: true });
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEO
        title="Verificação em duas etapas — Confirme seu acesso"
        description="Confirme o código enviado para o seu e-mail para concluir o acesso à sua conta FrotaApp com segurança."
        canonical="/verificacao"
        noindex
      />
      <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="sr-only">Verificação em duas etapas</h1>
            <CardTitle className="text-2xl">Verificação em duas etapas</CardTitle>
            <CardDescription>
              Enviamos um código de 6 dígitos para <strong>{user?.email}</strong>. Digite-o abaixo para concluir o
              acesso.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => {
                  setCode(value);
                  if (value.length === 6) handleVerify(value);
                }}
                disabled={verifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button className="w-full" onClick={() => handleVerify(code)} disabled={verifying || code.length < 6}>
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Confirmar código'
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={sendCode}
              disabled={sending || secondsLeft > 0}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : secondsLeft > 0 ? (
                `Reenviar código em ${secondsLeft}s`
              ) : (
                'Reenviar código'
              )}
            </Button>
          </CardContent>

          <CardFooter className="flex justify-center">
            <button
              type="button"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
              onClick={async () => {
                await signOut();
                navigate('/login', { replace: true });
              }}
            >
              Sair da conta
            </button>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}
