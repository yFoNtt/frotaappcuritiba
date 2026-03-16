import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { sanitizeFields } from '@/lib/sanitize';

export type MaintenanceType = 'oil_change' | 'tire_change' | 'revision' | 'repair' | 'inspection' | 'other';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Maintenance {
  id: string;
  locador_id: string;
  vehicle_id: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  km_at_maintenance: number | null;
  performed_at: string;
  next_maintenance_date: string | null;
  next_maintenance_km: number | null;
  service_provider: string | null;
  notes: string | null;
  status: MaintenanceStatus;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceInsert {
  vehicle_id: string;
  type: MaintenanceType;
  description: string;
  cost?: number;
  km_at_maintenance?: number;
  performed_at: string;
  next_maintenance_date?: string;
  next_maintenance_km?: number;
  service_provider?: string;
  notes?: string;
  status?: MaintenanceStatus;
}

export interface MaintenanceUpdate {
  type?: MaintenanceType;
  description?: string;
  cost?: number;
  km_at_maintenance?: number;
  performed_at?: string;
  next_maintenance_date?: string | null;
  next_maintenance_km?: number | null;
  service_provider?: string;
  notes?: string;
  status?: MaintenanceStatus;
}

export const MAINTENANCE_TYPES: Record<MaintenanceType, string> = {
  oil_change: 'Troca de Óleo',
  tire_change: 'Troca de Pneus',
  revision: 'Revisão',
  repair: 'Reparo',
  inspection: 'Vistoria',
  other: 'Outro',
};

export const MAINTENANCE_STATUS: Record<MaintenanceStatus, string> = {
  scheduled: 'Agendada',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

// Fetch all maintenances for the current locador
export function useLocadorMaintenances() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['maintenances', 'locador', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('maintenances')
        .select('*')
        .eq('locador_id', user.id)
        .order('performed_at', { ascending: false });

      if (error) {
        console.error('Error fetching maintenances:', error);
        throw error;
      }

      return data as Maintenance[];
    },
    enabled: !!user,
  });
}

// Fetch maintenances for a specific vehicle
export function useVehicleMaintenances(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['maintenances', 'vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];

      const { data, error } = await supabase
        .from('maintenances')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('performed_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicle maintenances:', error);
        throw error;
      }

      return data as Maintenance[];
    },
    enabled: !!vehicleId,
  });
}

// Fetch upcoming maintenances (scheduled or with next_maintenance_date)
export function useUpcomingMaintenances() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['maintenances', 'upcoming', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('maintenances')
        .select('*')
        .eq('locador_id', user.id)
        .or(`status.eq.scheduled,next_maintenance_date.gte.${today}`)
        .order('next_maintenance_date', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming maintenances:', error);
        throw error;
      }

      return data as Maintenance[];
    },
    enabled: !!user,
  });
}

// Create a new maintenance
export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (maintenance: MaintenanceInsert) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('maintenances')
        .insert({
          ...maintenance,
          locador_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating maintenance:', error);
        throw error;
      }

      return data as Maintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast.success('Manutenção registrada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao registrar manutenção. Tente novamente.');
    },
  });
}

// Update a maintenance
export function useUpdateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MaintenanceUpdate }) => {
      const { data, error } = await supabase
        .from('maintenances')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating maintenance:', error);
        throw error;
      }

      return data as Maintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast.success('Manutenção atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar manutenção. Tente novamente.');
    },
  });
}

// Delete a maintenance
export function useDeleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenances')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting maintenance:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast.success('Manutenção removida com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover manutenção. Tente novamente.');
    },
  });
}

// Mark maintenance as completed
export function useCompleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('maintenances')
        .update({ status: 'completed' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error completing maintenance:', error);
        throw error;
      }

      return data as Maintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast.success('Manutenção concluída!');
    },
    onError: () => {
      toast.error('Erro ao concluir manutenção. Tente novamente.');
    },
  });
}
