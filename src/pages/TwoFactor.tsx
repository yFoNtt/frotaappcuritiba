import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ShieldCheck, Loader2, MailCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { toast } from 'sonner';
import {
  isValidMfaCode,
  isMagicLinkReturn,
  parseMagicLinkError,
  magicLinkErrorMessage,
  MFA_CODE_INPUT_ENABLED,
  MFA_LINK_HYDRATION_TIMEOUT_MS,
  MFA_RESEND_SECONDS,
} from '@/lib/mfa';

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
  const [linkError, setLinkError] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : parseMagicLinkError(window.location.hash, window.location.search)
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
    setLinkError(null);
    setSecondsLeft(MFA_RESEND_SECONDS);
    toast.success('E-mail de verificação enviado.');
  }, [user?.email]);

  // Limpa o hash/query assim que a tela abre vinda do e-mail,
  // para que um refresh não repita o mesmo erro.
  useEffect(() => {
    if (returningFromLink && typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/verificacao');
    }
  }, [returningFromLink]);

  // Envia o e-mail automaticamente na primeira abertura da tela
  // (exceto quando o usuário está voltando pelo link — mesmo com erro,
  // o reenvio fica sob controle do usuário para não gastar o limite).
  useEffect(() => {
    if (returningFromLink) return;
    if (!loading && user?.email && !autoSentRef.current) {
      autoSentRef.current = true;
      sendCode();
    }
  }, [loading, user?.email, sendCode, returningFromLink]);

  // Conclui a verificação quando o usuário volta pelo link do e-mail.
  useEffect(() => {
    if (!returningFromLink || linkError || linkHandledRef.current) return;
    if (loading || !user) return;
    linkHandledRef.current = true;
    markMfaVerified();
    toast.success('Verificação concluída!');
  }, [returningFromLink, linkError, loading, user, markMfaVerified]);

  // Link pré-carregado por scanners de e-mail (ou token já usado): a sessão
  // nunca chega. Em vez de travar no carregamento, mostramos o aviso.
  useEffect(() => {
    if (!returningFromLink || linkError || loading || user) return;
    const t = setTimeout(() => setLinkError('otp_expired'), MFA_LINK_HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [returningFromLink, linkError, loading, user]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  useEffect(() => {
    if (loading || user) return;
    // Sem sessão e sem retorno de link: não há o que verificar.
    if (returningFromLink) return;
    navigate('/login', { replace: true });
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

  // Enquanto o link ainda está sendo processado, mostramos o carregamento.
  const processingLink = returningFromLink && !linkError && (loading || !user);

  if (loading || processingLink) {
    return (
      <PublicLayout>
        <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Concluindo sua verificação...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEO
        title="Verificação em duas etapas — Confirme seu acesso"
        description="Confirme o acesso à sua conta FrotaApp pelo e-mail de verificação, com segurança."
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
              {user?.email ? (
                <>
                  Enviamos um e-mail para <strong>{user.email}</strong>. Abra a mensagem e toque no botão de acesso
                  para concluir a entrada.
                </>
              ) : (
                'Abra o e-mail de verificação e toque no botão de acesso para concluir a entrada.'
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {linkError ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-left"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                <p className="text-sm text-destructive">{magicLinkErrorMessage(linkError)}</p>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4 text-left">
                <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Você voltará para esta página já verificado. Se o e-mail não aparecer em alguns instantes, confira a
                  caixa de spam.
                </p>
              </div>
            )}

            {MFA_CODE_INPUT_ENABLED && (
              <>
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
              </>
            )}

            <Button
              className="w-full"
              variant={linkError ? 'default' : 'outline'}
              onClick={sendCode}
              disabled={sending || secondsLeft > 0 || !user?.email}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : secondsLeft > 0 ? (
                `Reenviar e-mail em ${secondsLeft}s`
              ) : (
                'Reenviar e-mail'
              )}
            </Button>

            {!user?.email && (
              <p className="text-center text-sm text-muted-foreground">
                Sua sessão não está mais ativa. Entre novamente para receber um novo e-mail de verificação.
              </p>
            )}
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
              {user ? 'Sair da conta' : 'Ir para o login'}
            </button>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}

