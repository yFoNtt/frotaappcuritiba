import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LocadorDetails {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface LocadorVehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  status: string;
  weekly_price: number;
  current_km: number | null;
  city: string;
  state: string;
  created_at: string;
}

export interface LocadorDriver {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cnh_number: string;
  cnh_expiry: string;
  status: string;
  vehicle_id: string | null;
  created_at: string;
}

export interface LocadorContract {
  id: string;
  vehicle_id: string;
  driver_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  weekly_price: number;
  deposit: number | null;
  km_limit: number | null;
  excess_km_fee: number | null;
  created_at: string;
}

export interface LocadorPayment {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  reference_week: string;
}

// Fetch locador profile details
export function useLocadorDetails(locadorId: string) {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'locador-details', locadorId],
    queryFn: async (): Promise<LocadorDetails | null> => {
      if (!user || role !== 'admin' || !locadorId) return null;

      // Get email from the secure function
      const { data: userEmails, error } = await supabase
        .rpc('get_user_emails_for_admin');

      if (error) {
        console.error('Error fetching locador details:', error);
        throw error;
      }

      const locadorData = userEmails?.find(
        (u: { user_id: string }) => u.user_id === locadorId
      );

      if (!locadorData) return null;

      return {
        id: locadorId,
        email: locadorData.email,
        created_at: locadorData.created_at,
        last_sign_in_at: locadorData.last_sign_in_at,
      };
    },
    enabled: !!user && role === 'admin' && !!locadorId,
  });
}

// Fetch vehicles for a specific locador
export function useLocadorVehicles(locadorId: string) {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'locador-vehicles', locadorId],
    queryFn: async (): Promise<LocadorVehicle[]> => {
      if (!user || role !== 'admin' || !locadorId) return [];

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('locador_id', locadorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching locador vehicles:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && role === 'admin' && !!locadorId,
  });
}

// Fetch drivers for a specific locador
export function useLocadorDrivers(locadorId: string) {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'locador-drivers', locadorId],
    queryFn: async (): Promise<LocadorDriver[]> => {
      if (!user || role !== 'admin' || !locadorId) return [];

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('locador_id', locadorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching locador drivers:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && role === 'admin' && !!locadorId,
  });
}

// Fetch contracts for a specific locador
export function useLocadorContracts(locadorId: string) {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'locador-contracts', locadorId],
    queryFn: async (): Promise<LocadorContract[]> => {
      if (!user || role !== 'admin' || !locadorId) return [];

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('locador_id', locadorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching locador contracts:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && role === 'admin' && !!locadorId,
  });
}

// Fetch payments for a specific locador
export function useLocadorPayments(locadorId: string) {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'locador-payments', locadorId],
    queryFn: async (): Promise<LocadorPayment[]> => {
      if (!user || role !== 'admin' || !locadorId) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('locador_id', locadorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching locador payments:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && role === 'admin' && !!locadorId,
  });
}

// Combined stats for a locador
export function useLocadorStats(locadorId: string) {
  const { data: vehicles = [] } = useLocadorVehicles(locadorId);
  const { data: drivers = [] } = useLocadorDrivers(locadorId);
  const { data: contracts = [] } = useLocadorContracts(locadorId);
  const { data: payments = [] } = useLocadorPayments(locadorId);

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'available').length;
  const rentedVehicles = vehicles.filter(v => v.status === 'rented').length;

  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.status === 'active').length;

  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;

  const totalPayments = payments.length;
  const paidPayments = payments.filter(p => p.status === 'paid').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const overduePayments = payments.filter(p => p.status === 'overdue').length;

  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingRevenue = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    totalVehicles,
    availableVehicles,
    rentedVehicles,
    totalDrivers,
    activeDrivers,
    totalContracts,
    activeContracts,
    totalPayments,
    paidPayments,
    pendingPayments,
    overduePayments,
    totalRevenue,
    pendingRevenue,
  };
}
