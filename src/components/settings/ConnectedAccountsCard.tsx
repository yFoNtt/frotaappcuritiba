import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link2, Loader2, Unlink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { signInWithGoogle } from '@/components/auth/useGoogleSignIn';
import { translateAuthError } from '@/components/auth/authErrors';
import { toast } from 'sonner';

interface Identity {
  identity_id: string;
  provider: string;
  email?: string | null;
  created_at?: string | null;
}

const providerLabel = (provider: string) =>
  ({ google: 'Google', email: 'E-mail e senha', apple: 'Apple', azure: 'Microsoft' } as Record<string, string>)[
    provider
  ] ?? provider;

export function ConnectedAccountsCard() {
  const { user } = useAuth();
  const [identities, setIdentities] = useState<Identity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.getUserIdentities();
    if (error) {
      console.error('Erro ao carregar contas vinculadas:', error);
      toast.error('Não foi possível carregar as contas vinculadas.');
      setIdentities([]);
    } else {
      setIdentities(
        (data?.identities ?? []).map((i) => ({
          identity_id: i.identity_id,
          provider: i.provider,
          email: (i.identity_data?.email as string | undefined) ?? null,
          created_at: i.created_at ?? null,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const google = identities?.find((i) => i.provider === 'google');
  const canUnlink = (identities?.length ?? 0) > 1;

  const handleConnect = async () => {
    setWorking(true);
    const outcome = await signInWithGoogle();
    if (outcome !== 'redirected') {
      setWorking(false);
      if (outcome === 'session') {
        await load();
        toast.success('Conta Google vinculada ao seu perfil.');
      }
    }
  };

  const handleDisconnect = async () => {
    if (!google) return;
    setConfirmOpen(false);
    setWorking(true);
    const { data } = await supabase.auth.getUserIdentities();
    const target = data?.identities?.find((i) => i.identity_id === google.identity_id);
    if (!target) {
      setWorking(false);
      await load();
      return;
    }
    const { error } = await supabase.auth.unlinkIdentity(target);
    setWorking(false);
    if (error) {
      console.error('Erro ao desvincular Google:', error);
      toast.error(translateAuthError(error, 'oauth'));
      return;
    }
    toast.success('Conta Google desconectada. Use e-mail e senha para entrar.');
    await load();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Contas conectadas
            </CardTitle>
            <CardDescription>Gerencie o login com Google vinculado ao seu perfil</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={load} disabled={loading || working} aria-label="Atualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando contas vinculadas...
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <GoogleIcon className="h-5 w-5" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Google</p>
                    <Badge variant={google ? 'default' : 'secondary'}>
                      {google ? 'Conectada' : 'Não conectada'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {google
                      ? `${google.email ?? 'Conta Google'}${
                          google.created_at
                            ? ` · vinculada em ${format(new Date(google.created_at), "dd/MM/yyyy", { locale: ptBR })}`
                            : ''
                        }`
                      : 'Entre mais rápido usando sua conta Google.'}
                  </p>
                </div>
              </div>

              {google ? (
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(true)}
                  disabled={working || !canUnlink}
                  className="w-full sm:w-auto"
                >
                  {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlink className="mr-2 h-4 w-4" />}
                  Desconectar
                </Button>
              ) : (
                <Button onClick={handleConnect} disabled={working} className="w-full sm:w-auto">
                  {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                  Conectar Google
                </Button>
              )}
            </div>

            {google && !canUnlink && (
              <Alert>
                <AlertDescription>
                  O Google é o único meio de acesso da sua conta. Defina uma senha em “Segurança” antes de desconectar.
                </AlertDescription>
              </Alert>
            )}

            {identities && identities.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Métodos de acesso ativos: {identities.map((i) => providerLabel(i.provider)).join(', ')}.
              </p>
            )}
          </>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar conta Google?</AlertDialogTitle>
            <AlertDialogDescription>
              Você não poderá mais entrar com o Google. O acesso continuará disponível com e-mail e senha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
