import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TERMS_VERSION, PRIVACY_VERSION } from '@/lib/consentVersions';

export interface Consent {
  id: string;
  user_id: string;
  terms_version: string;
  privacy_version: string;
  ip_address: string | null;
  user_agent: string | null;
  accepted_at: string;
  revoked_at: string | null;
}

export function useLatestConsent() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['consents', 'latest', user?.id],
    queryFn: async (): Promise<Consent | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('consents' as never)
        .select('*')
        .eq('user_id', user.id)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Consent) ?? null;
    },
    enabled: !!user,
  });
}

export function useRecordConsent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase.functions.invoke('record-consent', {
        body: {
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
        },
      });
      if (error) throw error;
      if (data && (data as { error?: string }).error) {
        throw new Error((data as { error: string }).error);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consents'] });
    },
  });
}


export function useRevokeConsent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (consentId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('consents' as never)
        .update({ revoked_at: new Date().toISOString() } as never)
        .eq('id', consentId)
        .eq('user_id', user.id)
        .is('revoked_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consents'] });
    },
  });
}

