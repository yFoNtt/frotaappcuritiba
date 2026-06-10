import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useConsentStatus } from '@/hooks/useConsentStatus';
import { useRecordConsent } from '@/hooks/useConsents';
import { TERMS_VERSION, PRIVACY_VERSION } from '@/lib/consentVersions';

export default function ConsentGate() {
  const navigate = useNavigate();
  const { signOut, role } = useAuth();
  const { status, isLoading } = useConsentStatus();
  const recordConsent = useRecordConsent();
  const [accepted, setAccepted] = useState(false);

  const messages: Record<typeof status, { title: string; description: string }> = {
    valid: { title: 'Tudo certo', description: 'Seu consentimento está válido.' },
    missing: {
      title: 'Aceite necessário',
      description: 'Para continuar usando o FrotaApp, precisamos do seu aceite aos documentos abaixo.',
    },
    revoked: {
      title: 'Consentimento revogado',
      description: 'Você revogou seu consentimento. Para retomar o uso da plataforma, aceite novamente os documentos abaixo.',
    },
    outdated: {
      title: 'Novas versões disponíveis',
      description: `Atualizamos os Termos de Uso (v${TERMS_VERSION}) e a Política de Privacidade (v${PRIVACY_VERSION}). Por favor, revise e aceite as novas versões.`,
    },
  };

  const handleAccept = async () => {
    try {
      await recordConsent.mutateAsync();
      toast.success('Consentimento registrado. Bem-vindo de volta!');
      const dest = role === 'admin' ? '/admin' : role === 'locador' ? '/locador' : '/motorista';
      navigate(dest, { replace: true });
    } catch (err) {
      console.error('Erro ao registrar consentimento:', err);
      toast.error('Não foi possível registrar seu consentimento. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  if (isLoading || status === 'valid') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const msg = messages[status];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{msg.title}</CardTitle>
          <CardDescription>{msg.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Documentos vigentes</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                <a
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Termos de Uso v{TERMS_VERSION}
                </a>
              </li>
              <li>
                <a
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Política de Privacidade v{PRIVACY_VERSION}
                </a>
              </li>
            </ul>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="consent-accept"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="consent-accept" className="text-sm font-normal leading-snug">
              Li e aceito os Termos de Uso e a Política de Privacidade do FrotaApp.
            </Label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleAccept}
              disabled={!accepted || recordConsent.isPending}
              className="flex-1"
            >
              {recordConsent.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Aceitar e continuar
            </Button>
            <Button variant="outline" onClick={handleLogout} disabled={recordConsent.isPending}>
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
