import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  changed_by: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  created_at: string;
  changed_by_email?: string;
  changed_by_name?: string;
}

export const TABLE_LABELS: Record<string, string> = {
  contracts: 'Contratos',
  payments: 'Pagamentos',
  drivers: 'Motoristas',
  vehicles: 'Veículos',
  maintenances: 'Manutenções',
  documents: 'Documentos',
  document_requests: 'Solicitações',
  vehicle_inspections: 'Vistorias',
};

export const ACTION_LABELS: Record<string, string> = {
  INSERT: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
};

export function useAuditLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audit-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: !!user,
  });
}

export interface UserInfo {
  user_id: string;
  email: string;
  full_name: string | null;
}

export function useAuditUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audit-users', user?.id],
    queryFn: async () => {
      // Fetch emails via admin RPC
      const { data: emails, error: emailsError } = await supabase
        .rpc('get_user_emails_for_admin');

      if (emailsError) throw emailsError;

      // Fetch profiles for names
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      if (profilesError) throw profilesError;

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p.full_name])
      );

      const usersMap = new Map<string, UserInfo>();
      for (const e of emails || []) {
        usersMap.set(e.user_id, {
          user_id: e.user_id,
          email: e.email,
          full_name: profileMap.get(e.user_id) || null,
        });
      }

      return usersMap;
    },
    enabled: !!user,
  });
}
