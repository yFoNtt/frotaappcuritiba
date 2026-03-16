import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { sanitizeFields } from '@/lib/sanitize';

export interface Contract {
  id: string;
  locador_id: string;
  driver_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string | null;
  weekly_price: number;
  deposit: number | null;
  km_limit: number | null;
  excess_km_fee: number | null;
  payment_day: string;
  terms: string | null;
  status: 'active' | 'ended' | 'cancelled' | 'pending';
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractInsert {
  driver_id: string;
  vehicle_id: string;
  start_date: string;
  end_date?: string | null;
  weekly_price: number;
  deposit?: number;
  km_limit?: number;
  excess_km_fee?: number;
  payment_day?: string;
  terms?: string;
  status?: 'active' | 'ended' | 'cancelled' | 'pending';
}

export interface ContractUpdate {
  end_date?: string | null;
  weekly_price?: number;
  deposit?: number;
  km_limit?: number;
  excess_km_fee?: number;
  payment_day?: string;
  terms?: string;
  status?: 'active' | 'ended' | 'cancelled' | 'pending';
  cancelled_at?: string;
  cancellation_reason?: string;
}

// Fetch all contracts for the current locador
export function useLocadorContracts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contracts', 'locador', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('locador_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contracts:', error);
        throw error;
      }

      return data as Contract[];
    },
    enabled: !!user,
  });
}

// Fetch active contract for a specific driver
export function useDriverContract(driverId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contracts', 'driver', driverId],
    queryFn: async () => {
      if (!user || !driverId) return null;

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('driver_id', driverId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching driver contract:', error);
        throw error;
      }

      return data as Contract | null;
    },
    enabled: !!user && !!driverId,
  });
}

// Create a new contract
export function useCreateContract() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contract: ContractInsert) => {
      if (!user) throw new Error('User not authenticated');

      const sanitized = sanitizeFields(contract, ['terms', 'cancellation_reason']);
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          ...sanitized,
          locador_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating contract:', error);
        throw error;
      }

      return data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Contrato criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar contrato. Tente novamente.');
      console.error(error);
    },
  });
}

// Update a contract
export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ContractUpdate }) => {
      const sanitized = sanitizeFields(updates, ['terms', 'cancellation_reason']);
      const { data, error } = await supabase
        .from('contracts')
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating contract:', error);
        throw error;
      }

      return data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar contrato. Tente novamente.');
    },
  });
}

// End a contract
export function useEndContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, endDate }: { id: string; endDate: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update({ 
          status: 'ended',
          end_date: endDate 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error ending contract:', error);
        throw error;
      }

      return data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Contrato encerrado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao encerrar contrato. Tente novamente.');
    },
  });
}

// Cancel a contract
export function useCancelContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling contract:', error);
        throw error;
      }

      return data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Contrato cancelado.');
    },
    onError: () => {
      toast.error('Erro ao cancelar contrato. Tente novamente.');
    },
  });
}
