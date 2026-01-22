import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MotoristaVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  fuel_type: string;
  status: string;
  images: string[];
  weekly_price: number;
}

export interface MotoristaContract {
  id: string;
  start_date: string;
  end_date: string | null;
  weekly_price: number;
  payment_day: string;
  status: string;
  deposit: number | null;
  km_limit: number | null;
}

export interface MotoristaLocador {
  id: string;
  email: string;
}

export interface MotoristaFullData {
  driver: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    cnh_number: string;
    cnh_expiry: string;
  } | null;
  vehicle: MotoristaVehicle | null;
  contract: MotoristaContract | null;
  locador: MotoristaLocador | null;
}

// Fetch the current motorista's driver record
export function useMotoristaDriver() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['motorista', 'driver', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching motorista driver:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });
}

// Fetch the motorista's assigned vehicle
export function useMotoristaVehicle() {
  const { data: driver } = useMotoristaDriver();

  return useQuery({
    queryKey: ['motorista', 'vehicle', driver?.vehicle_id],
    queryFn: async () => {
      if (!driver?.vehicle_id) return null;

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', driver.vehicle_id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching motorista vehicle:', error);
        throw error;
      }

      return data as MotoristaVehicle | null;
    },
    enabled: !!driver?.vehicle_id,
  });
}

// Fetch the motorista's active contract
export function useMotoristaContract() {
  const { data: driver } = useMotoristaDriver();

  return useQuery({
    queryKey: ['motorista', 'contract', driver?.id],
    queryFn: async () => {
      if (!driver?.id) return null;

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching motorista contract:', error);
        throw error;
      }

      return data as MotoristaContract | null;
    },
    enabled: !!driver?.id,
  });
}

// Fetch complete motorista data
export function useMotoristaFullData() {
  const { user } = useAuth();
  const { data: driver, isLoading: driverLoading } = useMotoristaDriver();
  const { data: vehicle, isLoading: vehicleLoading } = useMotoristaVehicle();
  const { data: contract, isLoading: contractLoading } = useMotoristaContract();

  const isLoading = driverLoading || vehicleLoading || contractLoading;

  return {
    driver: driver ? {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      cnh_number: driver.cnh_number,
      cnh_expiry: driver.cnh_expiry,
    } : null,
    vehicle,
    contract,
    locador: driver ? { id: driver.locador_id, email: '' } : null,
    isLoading,
    isAuthenticated: !!user,
  };
}

// Calculate motorista stats from payments
export function useMotoristaStats() {
  const { user } = useAuth();
  const { data: driver } = useMotoristaDriver();
  const { data: contract } = useMotoristaContract();

  return useQuery({
    queryKey: ['motorista', 'stats', driver?.id],
    queryFn: async () => {
      if (!driver?.id) {
        return {
          totalPago: 0,
          pendente: 0,
          atrasado: 0,
          proximoVencimento: null,
          diasRestantesContrato: 0,
        };
      }

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('driver_id', driver.id);

      if (error) {
        console.error('Error fetching payments for stats:', error);
        throw error;
      }

      const totalPago = payments
        ?.filter(p => p.status === 'paid')
        .reduce((acc, p) => acc + Number(p.amount), 0) || 0;

      const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
      const overduePayments = payments?.filter(p => 
        p.status === 'pending' && p.due_date < todayStr
      ) || [];

      const pendente = pendingPayments
        .filter(p => p.due_date >= todayStr)
        .reduce((acc, p) => acc + Number(p.amount), 0);

      const atrasado = overduePayments
        .reduce((acc, p) => acc + Number(p.amount), 0);

      // Find next due date
      const upcomingPayments = pendingPayments
        .filter(p => p.due_date >= todayStr)
        .sort((a, b) => a.due_date.localeCompare(b.due_date));

      const proximoVencimento = upcomingPayments[0]?.due_date || null;

      // Calculate remaining days in contract
      let diasRestantesContrato = 0;
      if (contract?.end_date) {
        const endDate = new Date(contract.end_date);
        const diffTime = endDate.getTime() - today.getTime();
        diasRestantesContrato = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      return {
        totalPago,
        pendente,
        atrasado,
        proximoVencimento,
        diasRestantesContrato,
      };
    },
    enabled: !!driver?.id,
  });
}

// Fetch motorista history (payments, maintenances, contract events)
export function useMotoristaHistory() {
  const { data: driver } = useMotoristaDriver();

  return useQuery({
    queryKey: ['motorista', 'history', driver?.id],
    queryFn: async () => {
      if (!driver?.id) return [];

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      // Build history items
      const history: Array<{
        id: string;
        tipo: 'pagamento' | 'contrato' | 'manutencao';
        descricao: string;
        data: string;
        valor: number | null;
      }> = [];

      // Add payments to history
      payments?.forEach(payment => {
        if (payment.status === 'paid' && payment.paid_at) {
          history.push({
            id: `payment-${payment.id}`,
            tipo: 'pagamento',
            descricao: 'Pagamento semanal realizado',
            data: payment.paid_at.split('T')[0],
            valor: Number(payment.amount),
          });
        }
      });

      // Add contract events to history
      contracts?.forEach(contract => {
        history.push({
          id: `contract-start-${contract.id}`,
          tipo: 'contrato',
          descricao: 'Contrato de locação iniciado',
          data: contract.start_date,
          valor: null,
        });

        if (contract.status === 'ended' && contract.end_date) {
          history.push({
            id: `contract-end-${contract.id}`,
            tipo: 'contrato',
            descricao: 'Contrato de locação encerrado',
            data: contract.end_date,
            valor: null,
          });
        }
      });

      // Sort by date descending
      history.sort((a, b) => b.data.localeCompare(a.data));

      return history;
    },
    enabled: !!driver?.id,
  });
}

// Fetch documents linked to the motorista
export function useMotoristaDocuments() {
  const { data: driver } = useMotoristaDriver();

  return useQuery({
    queryKey: ['motorista', 'documents', driver?.id],
    queryFn: async () => {
      if (!driver?.id) return [];

      // Using type assertion until Supabase types are refreshed
      const { data, error } = await (supabase
        .from('documents' as any)
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false }) as any);

      if (error) {
        console.error('Error fetching motorista documents:', error);
        throw error;
      }

      return (data || []) as Array<{
        id: string;
        locador_id: string;
        driver_id: string | null;
        vehicle_id: string | null;
        contract_id: string | null;
        type: string;
        name: string;
        file_path: string;
        file_size: number | null;
        mime_type: string | null;
        description: string | null;
        expires_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
    },
    enabled: !!driver?.id,
  });
}
