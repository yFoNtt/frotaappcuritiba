import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'locador' | 'motorista';
  created_at: string;
  last_sign_in_at: string | null;
}

export interface PlatformStats {
  totalUsers: number;
  totalLocadores: number;
  totalMotoristas: number;
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  totalDrivers: number;
  totalContracts: number;
  activeContracts: number;
}

export interface LocadorWithStats {
  id: string;
  email: string;
  created_at: string;
  vehicleCount: number;
  driverCount: number;
}

// Fetch all users with roles (admin only)
export function useAdminUsers() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      if (!user || role !== 'admin') return [];

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      return roles.map(r => ({
        id: r.user_id,
        role: r.role as 'admin' | 'locador' | 'motorista',
        created_at: r.created_at,
      }));
    },
    enabled: !!user && role === 'admin',
  });
}

// Fetch platform statistics (admin only)
export function useAdminStats() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async (): Promise<PlatformStats> => {
      if (!user || role !== 'admin') {
        return {
          totalUsers: 0,
          totalLocadores: 0,
          totalMotoristas: 0,
          totalVehicles: 0,
          availableVehicles: 0,
          rentedVehicles: 0,
          totalDrivers: 0,
          totalContracts: 0,
          activeContracts: 0,
        };
      }

      // Fetch all data in parallel
      const [
        rolesResult,
        vehiclesResult,
        driversResult,
        contractsResult,
      ] = await Promise.all([
        supabase.from('user_roles').select('role'),
        supabase.from('vehicles').select('status'),
        supabase.from('drivers').select('id'),
        supabase.from('contracts').select('status'),
      ]);

      const roles = rolesResult.data || [];
      const vehicles = vehiclesResult.data || [];
      const drivers = driversResult.data || [];
      const contracts = contractsResult.data || [];

      return {
        totalUsers: roles.length,
        totalLocadores: roles.filter(r => r.role === 'locador').length,
        totalMotoristas: roles.filter(r => r.role === 'motorista').length,
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter(v => v.status === 'available').length,
        rentedVehicles: vehicles.filter(v => v.status === 'rented').length,
        totalDrivers: drivers.length,
        totalContracts: contracts.length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
      };
    },
    enabled: !!user && role === 'admin',
  });
}

// Fetch all vehicles (admin only)
export function useAdminVehicles() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'vehicles'],
    queryFn: async () => {
      if (!user || role !== 'admin') return [];

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin vehicles:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user && role === 'admin',
  });
}

// Fetch all drivers (admin only)
export function useAdminDrivers() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'drivers'],
    queryFn: async () => {
      if (!user || role !== 'admin') return [];

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin drivers:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user && role === 'admin',
  });
}

// Fetch all contracts (admin only)
export function useAdminContracts() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'contracts'],
    queryFn: async () => {
      if (!user || role !== 'admin') return [];

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin contracts:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user && role === 'admin',
  });
}

// Fetch all payments (admin only)
export function useAdminPayments() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: async () => {
      if (!user || role !== 'admin') return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin payments:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user && role === 'admin',
  });
}

// Get locadores with their stats (vehicles and drivers count)
export function useAdminLocadores() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'locadores'],
    queryFn: async (): Promise<LocadorWithStats[]> => {
      if (!user || role !== 'admin') return [];

      // Get all locadores
      const { data: locadorRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, created_at')
        .eq('role', 'locador');

      if (rolesError) {
        console.error('Error fetching locadores:', rolesError);
        throw rolesError;
      }

      // Get vehicles and drivers counts
      const [vehiclesResult, driversResult] = await Promise.all([
        supabase.from('vehicles').select('locador_id'),
        supabase.from('drivers').select('locador_id'),
      ]);

      const vehicles = vehiclesResult.data || [];
      const drivers = driversResult.data || [];

      return locadorRoles.map(l => ({
        id: l.user_id,
        email: '', // We don't have access to auth.users email
        created_at: l.created_at,
        vehicleCount: vehicles.filter(v => v.locador_id === l.user_id).length,
        driverCount: drivers.filter(d => d.locador_id === l.user_id).length,
      }));
    },
    enabled: !!user && role === 'admin',
  });
}

// Monthly growth data for charts
export function useAdminMonthlyData() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['admin', 'monthly-data'],
    queryFn: async () => {
      if (!user || role !== 'admin') return [];

      // Get all data with created_at
      const [rolesResult, vehiclesResult, paymentsResult] = await Promise.all([
        supabase.from('user_roles').select('created_at'),
        supabase.from('vehicles').select('created_at'),
        supabase.from('payments').select('created_at, amount, status'),
      ]);

      const roles = rolesResult.data || [];
      const vehicles = vehiclesResult.data || [];
      const payments = paymentsResult.data || [];

      // Group by month (last 6 months)
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const now = new Date();
      const monthlyData = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const usersCount = roles.filter(r => r.created_at.startsWith(monthKey)).length;
        const vehiclesCount = vehicles.filter(v => v.created_at.startsWith(monthKey)).length;
        const revenue = payments
          .filter(p => p.created_at.startsWith(monthKey) && p.status === 'paid')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        monthlyData.push({
          month: months[date.getMonth()],
          users: usersCount,
          vehicles: vehiclesCount,
          revenue,
        });
      }

      // Calculate cumulative totals
      let cumulativeUsers = 0;
      let cumulativeVehicles = 0;
      
      return monthlyData.map(d => {
        cumulativeUsers += d.users;
        cumulativeVehicles += d.vehicles;
        return {
          ...d,
          totalUsers: cumulativeUsers,
          totalVehicles: cumulativeVehicles,
        };
      });
    },
    enabled: !!user && role === 'admin',
  });
}
