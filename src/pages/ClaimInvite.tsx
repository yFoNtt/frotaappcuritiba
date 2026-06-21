import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';

interface InvitePreview {
  driver_name: string;
  locador_name: string;
  valid: boolean;
}

export default function ClaimInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!token) return;
    supabase
      .rpc('get_driver_invite_preview', { _token: token })
      .then(({ data, error }) => {
        if (error) {
          console.error('[ClaimInvite] preview error', error);
          setPreview(null);
        } else {
          const rows = (data ?? []) as InvitePreview[];
          setPreview(rows[0] ?? null);
        }
        setLoadingPreview(false);
      });
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_driver_invite', { _token: token });
      const result = data as { success: boolean; error?: string } | null;
      if (error || !result?.success) {
        toast.error('Não foi possível confirmar o vínculo. O link pode ter expirado.');
        return;
      }
      toast.success('Conta vinculada com sucesso!');
      navigate('/motorista', { replace: true });
    } catch (err) {
      console.error('[ClaimInvite] claim error', err);
      toast.error('Não foi possível confirmar o vínculo.');
    } finally {
      setClaiming(false);
    }
  };

  if (loadingPreview || authLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (!preview || !preview.valid) {
    return (
      <PublicLayout>
        <SEO title="Convite inválido" description="Convite de acesso inválido ou expirado." />
        <div className="container mx-auto max-w-md px-4 py-12">
          <Card>
            <CardHeader className="text-center">
              <XCircle className="mx-auto mb-2 h-12 w-12 text-destructive" />
              <CardTitle>Convite inválido ou expirado</CardTitle>
              <CardDescription>
                Esse link de convite não é mais válido. Peça ao locador para gerar um novo.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (user && role && role !== 'motorista') {
    return (
      <PublicLayout>
        <SEO title="Conta incompatível" description="Convite válido apenas para conta de motorista." />
        <div className="container mx-auto max-w-md px-4 py-12">
          <Card>
            <CardHeader className="text-center">
              <XCircle className="mx-auto mb-2 h-12 w-12 text-warning" />
              <CardTitle>Conta incompatível</CardTitle>
              <CardDescription>
                Este convite é para uma conta de motorista. Faça login com uma conta de motorista para confirmar.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  const redirectParam = encodeURIComponent(`/convite/${token}`);

  return (
    <PublicLayout>
      <SEO title="Confirmar convite" description="Confirme o vínculo da sua conta de motorista." />
      <div className="container mx-auto max-w-md px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-success" />
            <CardTitle>Você foi convidado!</CardTitle>
            <CardDescription>
              {preview.locador_name} cadastrou {preview.driver_name} no FrotaApp.
              Confirme abaixo para vincular essa conta e acessar seu veículo, contrato e pagamentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <Button className="w-full" onClick={handleConfirm} disabled={claiming}>
                {claiming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar vínculo
              </Button>
            ) : (
              <>
                <Button asChild className="w-full">
                  <Link to={`/cadastro?redirect=${redirectParam}`}>
                    Criar minha conta
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/login?redirect=${redirectParam}`}>
                    Já tenho conta — Entrar
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
