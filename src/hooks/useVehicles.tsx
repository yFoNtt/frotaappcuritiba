import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Vehicle {
  id: string;
  locador_id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  fuel_type: 'flex' | 'gasoline' | 'ethanol' | 'diesel' | 'electric' | 'hybrid';
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
  weekly_price: number;
  km_limit: number | null;
  excess_km_fee: number | null;
  deposit: number | null;
  allowed_apps: string[];
  description: string | null;
  images: string[];
  city: string;
  state: string;
  current_driver_id: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch available vehicles for the public marketplace
export function useAvailableVehicles() {
  return useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching available vehicles:', error);
        throw error;
      }

      return data as Vehicle[];
    },
  });
}

// Fetch all vehicles for the locador (owner) - includes all statuses
export function useLocadorVehicles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vehicles', 'locador', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('locador_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching locador vehicles:', error);
        throw error;
      }

      return data as Vehicle[];
    },
    enabled: !!user,
  });
}

// Fetch a single vehicle by ID
export function useVehicle(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching vehicle:', error);
        throw error;
      }

      return data as Vehicle | null;
    },
    enabled: !!vehicleId,
  });
}