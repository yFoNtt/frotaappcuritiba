import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ShieldCheck, Loader2, MailCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { toast } from 'sonner';
import { isValidMfaCode, isMagicLinkReturn, MFA_RESEND_SECONDS } from '@/lib/mfa';

export default function TwoFactor() {
  const navigate = useNavigate();
  const { user, role, loading, mfaRequired, mfaVerified, markMfaVerified, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const autoSentRef = useRef(false);

  // Retorno pelo botão do e-mail: a sessão vem no hash/query da URL.
  const [returningFromLink] = useState(() =>
    typeof window === 'undefined' ? false : isMagicLinkReturn(window.location.hash, window.location.search)
  );
  const linkHandledRef = useRef(false);

  const dashboardPath =
    role === 'admin' ? '/admin' : role === 'locador' ? '/locador' : role === 'motorista' ? '/motorista' : '/';

  const sendCode = useCallback(async () => {
    if (!user?.email) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/verificacao`,
      },
    });
    setSending(false);

    if (error) {
      toast.error('Não foi possível enviar o e-mail de verificação. Tente novamente em instantes.');
      return;
    }
    setSecondsLeft(MFA_RESEND_SECONDS);
    toast.success('E-mail de verificação enviado.');
  }, [user?.email]);

  // Envia o e-mail automaticamente na primeira abertura da tela
  // (exceto quando o usuário está justamente voltando pelo link).
  useEffect(() => {
    if (returningFromLink) return;
    if (!loading && user?.email && !autoSentRef.current) {
      autoSentRef.current = true;
      sendCode();
    }
  }, [loading, user?.email, sendCode, returningFromLink]);

  // Conclui a verificação quando o usuário volta pelo link do e-mail.
  useEffect(() => {
    if (!returningFromLink || linkHandledRef.current) return;
    if (loading || !user) return;
    linkHandledRef.current = true;
    markMfaVerified();
    window.history.replaceState(null, '', '/verificacao');
    toast.success('Verificação concluída!');
  }, [returningFromLink, loading, user, markMfaVerified]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  useEffect(() => {
    if (loading || user) return;
    // Ao voltar pelo link, a sessão leva alguns instantes para ser hidratada.
    const delay = returningFromLink ? 5000 : 0;
    const t = setTimeout(() => navigate('/login', { replace: true }), delay);
    return () => clearTimeout(t);
  }, [loading, user, navigate, returningFromLink]);

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
              Enviamos um e-mail para <strong>{user?.email}</strong>. Clique no botão do e-mail para concluir o acesso
              — ou, se o e-mail trouxer um código de 6 dígitos, digite-o abaixo.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4 text-left">
              <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Abra o e-mail e clique no botão de acesso. Você voltará para esta página já verificado. Se não
                encontrar, confira a caixa de spam.
              </p>
            </div>

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
