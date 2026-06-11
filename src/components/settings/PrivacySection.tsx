import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Trash2, ShieldCheck, ExternalLink, Loader2, RefreshCw, Ban, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLatestConsent, useRecordConsent, useRevokeConsent, useConsentHistory } from '@/hooks/useConsents';
import { TERMS_VERSION, PRIVACY_VERSION } from '@/lib/consentVersions';

export function PrivacySection() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: consent, isLoading: loadingConsent } = useLatestConsent();
  const recordConsent = useRecordConsent();
  const revokeConsent = useRevokeConsent();
  const { data: history = [], isLoading: loadingHistory } = useConsentHistory();
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isRevoked = !!consent?.revoked_at;
  const isOutdated =
    !!consent &&
    !consent.revoked_at &&
    (consent.terms_version !== TERMS_VERSION || consent.privacy_version !== PRIVACY_VERSION);

  const handleRevoke = async () => {
    if (!consent) return;
    try {
      await revokeConsent.mutateAsync(consent.id);
      toast.success('Consentimento revogado. Para continuar usando o serviço, aceite novamente os termos.');
      setRevokeOpen(false);
    } catch (err) {
      console.error('Erro ao revogar consentimento:', err);
      toast.error('Não foi possível revogar seu consentimento. Tente novamente.');
    }
  };

  const handleReaccept = async () => {
    try {
      await recordConsent.mutateAsync();
      toast.success('Consentimento atualizado com sucesso.');
    } catch (err) {
      console.error('Erro ao registrar consentimento:', err);
      toast.error('Não foi possível registrar seu consentimento. Tente novamente.');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data');
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meus-dados-frotaapp.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Seus dados foram exportados com sucesso.');
    } catch (err) {
      console.error('Erro ao exportar dados:', err);
      toast.error('Não foi possível exportar seus dados. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_own_account' as never);
      if (error) throw error;
      toast.success('Conta excluída. Você será desconectado.');
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Erro ao excluir conta:', err);
      toast.error('Não foi possível excluir sua conta. Tente novamente.');
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Privacidade e seus dados
        </CardTitle>
        <CardDescription>
          Em conformidade com a LGPD, você pode consultar seu consentimento,
          exportar seus dados ou excluir sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consentimento ativo */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Consentimento ativo</Label>
          {loadingConsent ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : consent ? (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p>
                  Termos de Uso <span className="font-medium">v{consent.terms_version}</span> e
                  Política de Privacidade <span className="font-medium">v{consent.privacy_version}</span>
                </p>
                <p className="text-muted-foreground">
                  Aceito em{' '}
                  {format(new Date(consent.accepted_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                {isRevoked && (
                  <p className="mt-2 text-destructive">
                    Revogado em{' '}
                    {format(new Date(consent.revoked_at!), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
                {isOutdated && (
                  <p className="mt-2 text-warning-soft-foreground">
                    Há novas versões disponíveis (Termos v{TERMS_VERSION} / Privacidade v{PRIVACY_VERSION}).
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(isRevoked || isOutdated) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReaccept}
                    disabled={recordConsent.isPending}
                  >
                    {recordConsent.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isRevoked ? 'Aceitar novamente' : 'Atualizar consentimento'}
                  </Button>
                )}
                {!isRevoked && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRevokeOpen(true)}
                    disabled={revokeConsent.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Revogar consentimento
                  </Button>
                )}
              </div>
              {isRevoked && (
                <p className="text-xs text-muted-foreground">
                  Sem consentimento válido, o uso da plataforma fica limitado. Aceite novamente para
                  continuar ou exclua sua conta abaixo.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="rounded-md border border-warning/40 bg-warning-soft p-3 text-sm text-warning-soft-foreground">
                Nenhum consentimento registrado. Aceite os Termos de Uso e a Política de Privacidade
                para regularizar sua conta.
              </p>
              <Button size="sm" variant="outline" onClick={handleReaccept} disabled={recordConsent.isPending}>
                {recordConsent.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Registrar consentimento
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Histórico de consentimentos */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <History className="h-4 w-4" />
            Histórico de consentimentos
          </Label>
          <p className="text-sm text-muted-foreground">
            Registro auditável de todos os aceites, atualizações e revogações da sua conta.
          </p>
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Carregando histórico…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {history.map((item) => {
                const revoked = !!item.revoked_at;
                return (
                  <li key={item.id} className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        Termos v{item.terms_version} · Privacidade v{item.privacy_version}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aceito em {format(new Date(item.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {revoked && (
                          <>
                            {' · '}Revogado em{' '}
                            {format(new Date(item.revoked_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </>
                        )}
                      </p>
                      {item.ip_address && (
                        <p className="text-xs text-muted-foreground">IP: {item.ip_address}</p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        revoked
                          ? 'border-destructive/40 bg-destructive/10 text-destructive'
                          : 'border-success/40 bg-success-soft text-success-soft-foreground'
                      }
                    >
                      {revoked ? 'Revogado' : 'Ativo'}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Separator />

        {/* Exportar dados */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Exportar meus dados</Label>
          <p className="text-sm text-muted-foreground">
            Baixe um arquivo JSON com todos os dados que mantemos sobre você.
          </p>
          <Button onClick={handleExport} disabled={exporting} variant="outline">
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar meus dados
          </Button>
        </div>

        <Separator />

        {/* Links rápidos */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Documentos legais</Label>
          <div className="flex flex-wrap gap-3">
            <a
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Política de Privacidade <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Termos de Uso <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <Separator />

        {/* Excluir conta */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-destructive">Excluir minha conta</Label>
          <p className="text-sm text-muted-foreground">
            Remove seus dados pessoais. Dados operacionais (contratos, pagamentos)
            são anonimizados para fins contábeis e legais.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmText('');
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir minha conta
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os seus dados pessoais serão removidos.
              Dados operacionais (contratos, pagamentos) serão anonimizados para fins contábeis.
              Para confirmar, digite <span className="font-semibold">EXCLUIR</span> abaixo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite EXCLUIR"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={confirmText !== 'EXCLUIR' || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar consentimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao revogar, registramos a data e hora da revogação. Sem um consentimento válido
              aos Termos de Uso e à Política de Privacidade, sua experiência na plataforma fica
              limitada — você poderá aceitar novamente a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeConsent.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRevoke();
              }}
              disabled={revokeConsent.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeConsent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Revogar consentimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
