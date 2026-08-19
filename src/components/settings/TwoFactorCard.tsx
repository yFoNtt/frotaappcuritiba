import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isMfaMandatory } from '@/lib/mfa';
import { toast } from 'sonner';

export function TwoFactorCard() {
  const { user, role, refreshMfaSettings } = useAuth();
  const mandatory = isMfaMandatory(role);
  const [enabled, setEnabled] = useState(mandatory);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from('profiles')
      .select('mfa_enabled')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setEnabled(mandatory || data?.mfa_enabled === true);
      });
    return () => {
      active = false;
    };
  }, [user, mandatory]);

  const handleToggle = async (value: boolean) => {
    if (!user || mandatory) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ mfa_enabled: value })
      .eq('user_id', user.id);
    setSaving(false);

    if (error) {
      toast.error('Não foi possível atualizar a verificação em duas etapas.');
      return;
    }

    setEnabled(value);
    await refreshMfaSettings();
    toast.success(
      value
        ? 'Verificação em duas etapas ativada. Ela será pedida no próximo acesso.'
        : 'Verificação em duas etapas desativada.'
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Verificação em duas etapas
          {mandatory && <Badge variant="secondary">Obrigatória</Badge>}
        </CardTitle>
        <CardDescription>
          Ao entrar na conta, pedimos um código de 6 dígitos enviado para o seu e-mail cadastrado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="mfa-switch">Exigir código ao entrar</Label>
            <p className="text-sm text-muted-foreground">
              {mandatory
                ? 'Sua função exige a verificação em duas etapas e ela não pode ser desativada.'
                : 'Camada extra de proteção caso alguém descubra sua senha.'}
            </p>
          </div>
          <Switch
            id="mfa-switch"
            checked={enabled}
            disabled={mandatory || saving}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
}
