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
