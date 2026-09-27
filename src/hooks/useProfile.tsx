import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { sanitizeFields } from '@/lib/sanitize';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  company_name: string | null;
  document_type: string | null;
  document_number: string | null;
  cnh_number: string | null;
  cnh_expiry: string | null;
  city: string | null;
  state: string | null;
  onboarding_tour_seen_at: string | null;
  onboarding_dismissed_at: string | null;
  // Objeto flexível: admin e locador leem/escrevem apenas as chaves que usam.
  notification_preferences: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}

type ProfileRole = 'admin' | 'locador' | 'motorista' | null;

export function isProfileComplete(profile: Profile | null | undefined, role: ProfileRole): boolean {
  if (role === 'admin') return true;
  if (!profile) return false;
  if (role === 'locador') {
    return !!profile.document_type && !!profile.document_number;
  }
  if (role === 'motorista') {
    return !!profile.cnh_number && !!profile.cnh_expiry;
  }
  return false;
}


export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      // Conta antiga sem perfil: usa o mesmo bootstrap idempotente do login.
      if (!data) {
        const { error: bootstrapError } = await supabase.rpc('initialize_own_account', { _role: null });
        if (bootstrapError) throw bootstrapError;
        const { data: bootstrappedProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (profileError) throw profileError;
        return bootstrappedProfile as Profile;
      }

      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');

      const sanitized = sanitizeFields(updates, ['full_name', 'company_name']);
      const { data, error } = await supabase
        .from('profiles')
        .update(sanitized)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Erro ao salvar configurações');
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating password:', error);
      toast.error('Erro ao alterar senha. Verifique sua senha atual.');
    },
  });
}
