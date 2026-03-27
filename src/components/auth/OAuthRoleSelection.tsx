import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RoleSelector } from './RoleSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type AppRole = 'locador' | 'motorista';

export function OAuthRoleSelection() {
  const { user, refreshRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<AppRole>('locador');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleConfirm = async () => {
    if (!user) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Check if role already exists (idempotent)
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: selectedRole });

        if (roleError) {
          console.error('Error assigning role:', roleError);
          const msg = roleError.code === '23505'
            ? 'Sua conta já possui um tipo definido. Recarregue a página.'
            : 'Erro ao definir tipo de conta. Tente novamente.';
          setErrorMessage(msg);
          setSubmitting(false);
          setRetryCount((c) => c + 1);
          return;
        }
      }

      // Check if profile already exists (idempotent)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Non-blocking — role was set, profile can be completed later
        }
      }

      // Refresh role in auth context to trigger redirect
      await refreshRole();
      toast.success('Conta configurada com sucesso!');
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrorMessage('Erro inesperado de conexão. Verifique sua internet e tente novamente.');
      setSubmitting(false);
      setRetryCount((c) => c + 1);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Bem-vindo ao FrotaApp!</CardTitle>
            <CardDescription className="mt-1.5">
              Para continuar, selecione o tipo de conta que deseja criar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RoleSelector selectedRole={selectedRole} onRoleChange={setSelectedRole} />
            <Button onClick={handleConfirm} disabled={submitting} className="w-full" size="lg">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                'Confirmar e continuar'
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
