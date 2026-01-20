import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  locador_id: string;
  driver_id: string;
  contract_id: string | null;
  vehicle_id: string | null;
  amount: number;
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  reference_week: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentInsert {
  driver_id: string;
  contract_id?: string | null;
  vehicle_id?: string | null;
  amount: number;
  due_date: string;
  reference_week: string;
  notes?: string;
}

export interface PaymentUpdate {
  amount?: number;
  due_date?: string;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_at?: string | null;
  payment_method?: string | null;
  notes?: string;
}

// Fetch all payments for the current locador
export function useLocadorPayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payments', 'locador', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('locador_id', user.id)
        .order('due_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      return data as Payment[];
    },
    enabled: !!user,
  });
}

// Fetch payments for a specific driver
export function useDriverPayments(driverId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'driver', driverId],
    queryFn: async () => {
      if (!driverId) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('driver_id', driverId)
        .order('due_date', { ascending: false });

      if (error) {
        console.error('Error fetching driver payments:', error);
        throw error;
      }

      return data as Payment[];
    },
    enabled: !!driverId,
  });
}

// Create a new payment
export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payment: PaymentInsert) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...payment,
          locador_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payment:', error);
        throw error;
      }

      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança registrada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao registrar cobrança. Tente novamente.');
    },
  });
}

// Update a payment
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PaymentUpdate }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating payment:', error);
        throw error;
      }

      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar cobrança. Tente novamente.');
    },
  });
}

// Mark payment as paid
export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: string; paymentMethod?: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error marking payment as paid:', error);
        throw error;
      }

      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Pagamento confirmado!');
    },
    onError: () => {
      toast.error('Erro ao confirmar pagamento. Tente novamente.');
    },
  });
}

// Cancel a payment
export function useCancelPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling payment:', error);
        throw error;
      }

      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança cancelada.');
    },
    onError: () => {
      toast.error('Erro ao cancelar cobrança. Tente novamente.');
    },
  });
}

// Delete a payment (only pending)
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting payment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Cobrança removida com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover cobrança. Tente novamente.');
    },
  });
}

// Generate weekly payments for active contracts
export function useGenerateWeeklyPayments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (referenceWeek: string) => {
      if (!user) throw new Error('User not authenticated');

      // Fetch active contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('locador_id', user.id)
        .eq('status', 'active');

      if (contractsError) throw contractsError;

      if (!contracts || contracts.length === 0) {
        throw new Error('Nenhum contrato ativo encontrado');
      }

      // Check for existing payments for this week
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('contract_id')
        .eq('locador_id', user.id)
        .eq('reference_week', referenceWeek);

      const existingContractIds = new Set(existingPayments?.map(p => p.contract_id) || []);

      // Create payments for contracts without payment this week
      const paymentsToCreate = contracts
        .filter(c => !existingContractIds.has(c.id))
        .map(contract => ({
          locador_id: user.id,
          driver_id: contract.driver_id,
          contract_id: contract.id,
          vehicle_id: contract.vehicle_id,
          amount: contract.weekly_price,
          due_date: referenceWeek,
          reference_week: referenceWeek,
          status: 'pending' as const,
        }));

      if (paymentsToCreate.length === 0) {
        throw new Error('Cobranças já geradas para esta semana');
      }

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentsToCreate)
        .select();

      if (error) throw error;

      return data as Payment[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(`${data.length} cobrança(s) gerada(s) com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao gerar cobranças.');
    },
  });
}
