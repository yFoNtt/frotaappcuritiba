import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { sanitizeFields } from '@/lib/sanitize';
import { getBusinessErrorMessage } from '@/lib/businessErrors';

export interface Driver {
  id: string;
  locador_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  cnh_number: string;
  cnh_expiry: string;
  vehicle_id: string | null;
  status: 'active' | 'inactive' | 'pending';
  invite_token: string | null;
  invite_expires_at: string | null;
  invite_claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverInsert {
  name: string;
  email: string;
  phone?: string;
  cnh_number: string;
  cnh_expiry: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface DriverUpdate {
  name?: string;
  email?: string;
  phone?: string;
  cnh_number?: string;
  cnh_expiry?: string;
  status?: 'active' | 'inactive' | 'pending';
}

// Fetch all drivers for the current locador
export function useLocadorDrivers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['drivers', 'locador', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('locador_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching drivers:', error);
        throw error;
      }

      return data as Driver[];
    },
    enabled: !!user,
  });
}

// Create a new driver
export function useCreateDriver() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (driver: DriverInsert) => {
      if (!user) throw new Error('User not authenticated');

      const sanitized = sanitizeFields(driver, ['name']);
      const { data, error } = await supabase
        .from('drivers')
        .insert({
          ...sanitized,
          locador_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating driver:', error);
        throw error;
      }

      return data as Driver;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Motorista cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      if (error.message.includes('unique')) {
        toast.error(getBusinessErrorMessage(error, 'Já existe um motorista com este email ou CNH.'));
      } else {
        toast.error(getBusinessErrorMessage(error, 'Erro ao cadastrar motorista. Tente novamente.'));
      }
    },
  });
}

// Update a driver
export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DriverUpdate }) => {
      const sanitized = sanitizeFields(updates, ['name']);
      const { data, error } = await supabase
        .from('drivers')
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating driver:', error);
        throw error;
      }

      return data as Driver;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Motorista atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(getBusinessErrorMessage(error, 'Erro ao atualizar motorista. Tente novamente.'));
    },
  });
}

// Generate driver invite token
export function useGenerateDriverInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (driverId: string) => {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('drivers')
        .update({ invite_token: token, invite_expires_at: expiresAt })
        .eq('id', driverId);

      if (error) {
        console.error('Error generating driver invite:', error);
        throw error;
      }

      return { token, expiresAt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
    onError: () => {
      toast.error('Não foi possível gerar o convite. Tente novamente.');
    },
  });
}

// Delete a driver
export function useDeleteDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting driver:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Motorista removido com sucesso!');
    },
    onError: (error) => {
      toast.error(getBusinessErrorMessage(error, 'Erro ao remover motorista. Tente novamente.'));
    },
  });
}
