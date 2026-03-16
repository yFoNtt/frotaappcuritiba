import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { sanitizeFields } from '@/lib/sanitize';

export interface MileageRecord {
  id: string;
  locador_id: string;
  driver_id: string;
  vehicle_id: string;
  contract_id: string | null;
  km_reading: number;
  recorded_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MileageInsert {
  driver_id: string;
  vehicle_id: string;
  contract_id?: string | null;
  km_reading: number;
  recorded_at?: string;
  notes?: string;
}

export interface MileageUpdate {
  km_reading?: number;
  recorded_at?: string;
  notes?: string;
}

export interface DriverMileageStats {
  driverId: string;
  driverName: string;
  vehicleId: string | null;
  vehicleName: string | null;
  currentKm: number;
  initialKm: number;
  totalKmDriven: number;
  kmLimit: number | null;
  excessKm: number;
  excessKmFee: number | null;
  excessCost: number;
  lastRecordedAt: string | null;
}

// Fetch all mileage records for the current locador
export function useLocadorMileageRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mileage_records', 'locador', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase
        .from('mileage_records' as any)
        .select('*')
        .eq('locador_id', user.id)
        .order('recorded_at', { ascending: false }) as any);

      if (error) {
        console.error('Error fetching mileage records:', error);
        throw error;
      }

      return (data || []) as MileageRecord[];
    },
    enabled: !!user,
  });
}

// Fetch mileage records for a specific driver
export function useDriverMileageRecords(driverId: string | undefined) {
  return useQuery({
    queryKey: ['mileage_records', 'driver', driverId],
    queryFn: async () => {
      if (!driverId) return [];

      const { data, error } = await (supabase
        .from('mileage_records' as any)
        .select('*')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false }) as any);

      if (error) {
        console.error('Error fetching driver mileage records:', error);
        throw error;
      }

      return (data || []) as MileageRecord[];
    },
    enabled: !!driverId,
  });
}

// Fetch mileage records for a specific vehicle
export function useVehicleMileageRecords(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['mileage_records', 'vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];

      const { data, error } = await (supabase
        .from('mileage_records' as any)
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('recorded_at', { ascending: false }) as any);

      if (error) {
        console.error('Error fetching vehicle mileage records:', error);
        throw error;
      }

      return (data || []) as MileageRecord[];
    },
    enabled: !!vehicleId,
  });
}

// Calculate mileage stats for all drivers
export function useDriversMileageStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mileage_stats', 'drivers', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch drivers with their vehicles and contracts
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select('id, name, vehicle_id')
        .eq('locador_id', user.id)
        .eq('status', 'active');

      if (driversError) throw driversError;

      // Fetch vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, brand, model')
        .eq('locador_id', user.id);

      if (vehiclesError) throw vehiclesError;

      // Fetch active contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id, driver_id, vehicle_id, km_limit, excess_km_fee')
        .eq('locador_id', user.id)
        .eq('status', 'active');

      if (contractsError) throw contractsError;

      // Fetch mileage records
      const { data: mileageRecords, error: mileageError } = await (supabase
        .from('mileage_records' as any)
        .select('*')
        .eq('locador_id', user.id)
        .order('recorded_at', { ascending: true }) as any);

      if (mileageError) throw mileageError;

      const records = (mileageRecords || []) as MileageRecord[];

      // Calculate stats for each driver
      const stats: DriverMileageStats[] = (drivers || []).map(driver => {
        const vehicle = vehicles?.find(v => v.id === driver.vehicle_id);
        const contract = contracts?.find(c => c.driver_id === driver.id);
        const driverRecords = records.filter(r => r.driver_id === driver.id);

        const initialKm = driverRecords.length > 0 ? driverRecords[0].km_reading : 0;
        const currentKm = driverRecords.length > 0 
          ? driverRecords[driverRecords.length - 1].km_reading 
          : 0;
        const totalKmDriven = currentKm - initialKm;

        const kmLimit = contract?.km_limit || null;
        const excessKm = kmLimit ? Math.max(0, totalKmDriven - kmLimit) : 0;
        const excessKmFee = contract?.excess_km_fee ? Number(contract.excess_km_fee) : null;
        const excessCost = excessKm > 0 && excessKmFee ? excessKm * excessKmFee : 0;

        const lastRecord = driverRecords.length > 0 
          ? driverRecords[driverRecords.length - 1] 
          : null;

        return {
          driverId: driver.id,
          driverName: driver.name,
          vehicleId: driver.vehicle_id,
          vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : null,
          currentKm,
          initialKm,
          totalKmDriven,
          kmLimit,
          excessKm,
          excessKmFee,
          excessCost,
          lastRecordedAt: lastRecord?.recorded_at || null,
        };
      });

      return stats;
    },
    enabled: !!user,
  });
}

// Create a new mileage record
export function useCreateMileageRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (record: MileageInsert) => {
      if (!user) throw new Error('User not authenticated');

      const sanitized = sanitizeFields(record, ['notes']);
      const { data, error } = await (supabase
        .from('mileage_records' as any)
        .insert({
          ...sanitized,
          locador_id: user.id,
        })
        .select()
        .single() as any);

      if (error) {
        console.error('Error creating mileage record:', error);
        throw error;
      }

      return data as MileageRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage_records'] });
      queryClient.invalidateQueries({ queryKey: ['mileage_stats'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Quilometragem registrada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao registrar quilometragem. Tente novamente.');
    },
  });
}

// Update a mileage record
export function useUpdateMileageRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MileageUpdate }) => {
      const { data, error } = await (supabase
        .from('mileage_records' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single() as any);

      if (error) {
        console.error('Error updating mileage record:', error);
        throw error;
      }

      return data as MileageRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage_records'] });
      queryClient.invalidateQueries({ queryKey: ['mileage_stats'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Registro atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar registro. Tente novamente.');
    },
  });
}

// Delete a mileage record
export function useDeleteMileageRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('mileage_records' as any)
        .delete()
        .eq('id', id) as any);

      if (error) {
        console.error('Error deleting mileage record:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage_records'] });
      queryClient.invalidateQueries({ queryKey: ['mileage_stats'] });
      toast.success('Registro removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover registro. Tente novamente.');
    },
  });
}
