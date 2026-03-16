import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { sanitizeFields } from '@/lib/sanitize';

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
  created_at: string;
  updated_at: string;
}

export interface DriverInsert {
  name: string;
  email: string;
  phone?: string;
  cnh_number: string;
  cnh_expiry: string;
  vehicle_id?: string | null;
  status?: 'active' | 'inactive' | 'pending';
}

export interface DriverUpdate {
  name?: string;
  email?: string;
  phone?: string;
  cnh_number?: string;
  cnh_expiry?: string;
  vehicle_id?: string | null;
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
        toast.error('Já existe um motorista com este email ou CNH.');
      } else {
        toast.error('Erro ao cadastrar motorista. Tente novamente.');
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
    onError: () => {
      toast.error('Erro ao atualizar motorista. Tente novamente.');
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
    onError: () => {
      toast.error('Erro ao remover motorista. Tente novamente.');
    },
  });
}

// Assign vehicle to driver
export function useAssignVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ driverId, vehicleId }: { driverId: string; vehicleId: string | null }) => {
      // First, update the driver's vehicle_id
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ vehicle_id: vehicleId })
        .eq('id', driverId);

      if (driverError) {
        console.error('Error assigning vehicle to driver:', driverError);
        throw driverError;
      }

      // If assigning a vehicle, update the vehicle's current_driver_id and status
      if (vehicleId) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({ 
            current_driver_id: driverId,
            status: 'rented' 
          })
          .eq('id', vehicleId);

        if (vehicleError) {
          console.error('Error updating vehicle:', vehicleError);
          throw vehicleError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo vinculado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao vincular veículo. Tente novamente.');
    },
  });
}

// Unassign vehicle from driver
export function useUnassignVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ driverId, vehicleId }: { driverId: string; vehicleId: string }) => {
      // Update driver to remove vehicle
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ vehicle_id: null })
        .eq('id', driverId);

      if (driverError) {
        console.error('Error unassigning vehicle from driver:', driverError);
        throw driverError;
      }

      // Update vehicle to remove driver and set as available
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ 
          current_driver_id: null,
          status: 'available' 
        })
        .eq('id', vehicleId);

      if (vehicleError) {
        console.error('Error updating vehicle:', vehicleError);
        throw vehicleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo desvinculado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao desvincular veículo. Tente novamente.');
    },
  });
}
