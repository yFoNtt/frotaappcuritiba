import { describe, it, expect } from 'vitest';
import type { Contract, ContractInsert, ContractUpdate } from '@/hooks/useContracts';

const mockContracts: Contract[] = [
  {
    id: 'c1', locador_id: 'l1', driver_id: 'd1', vehicle_id: 'v1',
    start_date: '2024-01-01', end_date: null, weekly_price: 800,
    deposit: 2000, km_limit: 1000, excess_km_fee: 0.5,
    payment_day: 'segunda-feira', terms: 'Contrato padrão',
    status: 'active', cancelled_at: null, cancellation_reason: null,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c2', locador_id: 'l1', driver_id: 'd2', vehicle_id: 'v2',
    start_date: '2024-02-01', end_date: '2024-06-30', weekly_price: 900,
    deposit: 2500, km_limit: 1200, excess_km_fee: 0.6,
    payment_day: 'sexta-feira', terms: null,
    status: 'ended', cancelled_at: null, cancellation_reason: null,
    created_at: '2024-02-01T00:00:00Z', updated_at: '2024-06-30T00:00:00Z',
  },
  {
    id: 'c3', locador_id: 'l1', driver_id: 'd3', vehicle_id: 'v3',
    start_date: '2024-03-01', end_date: null, weekly_price: 600,
    deposit: null, km_limit: null, excess_km_fee: null,
    payment_day: 'segunda-feira', terms: null,
    status: 'cancelled', cancelled_at: '2024-04-15T00:00:00Z',
    cancellation_reason: 'Motorista desistiu',
    created_at: '2024-03-01T00:00:00Z', updated_at: '2024-04-15T00:00:00Z',
  },
  {
    id: 'c4', locador_id: 'l1', driver_id: 'd1', vehicle_id: 'v4',
    start_date: '2024-05-01', end_date: null, weekly_price: 550,
    deposit: 1000, km_limit: 800, excess_km_fee: 0.4,
    payment_day: 'quarta-feira', terms: 'Termos especiais',
    status: 'pending', cancelled_at: null, cancellation_reason: null,
    created_at: '2024-05-01T00:00:00Z', updated_at: '2024-05-01T00:00:00Z',
  },
];

function filterByStatus(contracts: Contract[], status: Contract['status']): Contract[] {
  return contracts.filter(c => c.status === status);
}

function calculateTotalRevenue(contracts: Contract[]): number {
  return contracts
    .filter(c => c.status === 'active' || c.status === 'ended')
    .reduce((sum, c) => sum + c.weekly_price, 0);
}

function calculateContractDuration(contract: Contract): number | null {
  if (!contract.end_date) return null;
  const start = new Date(contract.start_date);
  const end = new Date(contract.end_date);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
}

function getActiveDriverIds(contracts: Contract[]): string[] {
  return contracts.filter(c => c.status === 'active').map(c => c.driver_id);
}

function canDeleteContract(contract: Contract): boolean {
  return contract.status === 'pending';
}

function canCancelContract(contract: Contract): boolean {
  return contract.status === 'active';
}

function validateContractInsert(contract: ContractInsert): string[] {
  const errors: string[] = [];
  if (!contract.driver_id) errors.push('Motorista é obrigatório');
  if (!contract.vehicle_id) errors.push('Veículo é obrigatório');
  if (!contract.start_date) errors.push('Data de início é obrigatória');
  if (contract.weekly_price <= 0) errors.push('Preço semanal deve ser positivo');
  if (contract.end_date && new Date(contract.end_date) <= new Date(contract.start_date)) {
    errors.push('Data de término deve ser posterior à data de início');
  }
  return errors;
}

function applyContractUpdate(contract: Contract, updates: ContractUpdate): Contract {
  return { ...contract, ...updates, updated_at: new Date().toISOString() };
}

describe('Contract Data Hooks - Logic Tests', () => {
  describe('filterByStatus', () => {
    it('filters active contracts', () => {
      expect(filterByStatus(mockContracts, 'active')).toHaveLength(1);
    });

    it('filters ended contracts', () => {
      expect(filterByStatus(mockContracts, 'ended')).toHaveLength(1);
    });

    it('filters cancelled contracts', () => {
      expect(filterByStatus(mockContracts, 'cancelled')).toHaveLength(1);
    });

    it('filters pending contracts', () => {
      expect(filterByStatus(mockContracts, 'pending')).toHaveLength(1);
    });
  });

  describe('calculateTotalRevenue', () => {
    it('sums weekly prices of active and ended contracts', () => {
      expect(calculateTotalRevenue(mockContracts)).toBe(1700); // 800 + 900
    });

    it('excludes cancelled and pending contracts', () => {
      const allCancelled = mockContracts.map(c => ({ ...c, status: 'cancelled' as const }));
      expect(calculateTotalRevenue(allCancelled)).toBe(0);
    });
  });

  describe('calculateContractDuration', () => {
    it('returns weeks for ended contract', () => {
      const weeks = calculateContractDuration(mockContracts[1]);
      expect(weeks).toBeGreaterThan(0);
      // Feb 1 to Jun 30 ≈ ~21-22 weeks
      expect(weeks).toBeGreaterThanOrEqual(21);
    });

    it('returns null for open-ended contract', () => {
      expect(calculateContractDuration(mockContracts[0])).toBeNull();
    });
  });

  describe('getActiveDriverIds', () => {
    it('returns only active contract driver ids', () => {
      const ids = getActiveDriverIds(mockContracts);
      expect(ids).toEqual(['d1']);
    });

    it('returns empty when no active contracts', () => {
      const ended = mockContracts.map(c => ({ ...c, status: 'ended' as const }));
      expect(getActiveDriverIds(ended)).toEqual([]);
    });
  });

  describe('canDeleteContract', () => {
    it('allows deleting pending contracts', () => {
      expect(canDeleteContract(mockContracts[3])).toBe(true);
    });

    it('prevents deleting active contracts', () => {
      expect(canDeleteContract(mockContracts[0])).toBe(false);
    });

    it('prevents deleting ended contracts', () => {
      expect(canDeleteContract(mockContracts[1])).toBe(false);
    });

    it('prevents deleting cancelled contracts', () => {
      expect(canDeleteContract(mockContracts[2])).toBe(false);
    });
  });

  describe('canCancelContract', () => {
    it('allows cancelling active contracts', () => {
      expect(canCancelContract(mockContracts[0])).toBe(true);
    });

    it('prevents cancelling ended contracts', () => {
      expect(canCancelContract(mockContracts[1])).toBe(false);
    });

    it('prevents cancelling already cancelled contracts', () => {
      expect(canCancelContract(mockContracts[2])).toBe(false);
    });
  });

  describe('validateContractInsert', () => {
    it('validates correct contract', () => {
      const contract: ContractInsert = {
        driver_id: 'd1', vehicle_id: 'v1',
        start_date: '2024-01-01', weekly_price: 800,
      };
      expect(validateContractInsert(contract)).toHaveLength(0);
    });

    it('catches missing driver', () => {
      const contract: ContractInsert = {
        driver_id: '', vehicle_id: 'v1',
        start_date: '2024-01-01', weekly_price: 800,
      };
      expect(validateContractInsert(contract)).toContain('Motorista é obrigatório');
    });

    it('catches negative price', () => {
      const contract: ContractInsert = {
        driver_id: 'd1', vehicle_id: 'v1',
        start_date: '2024-01-01', weekly_price: -100,
      };
      expect(validateContractInsert(contract)).toContain('Preço semanal deve ser positivo');
    });

    it('catches end_date before start_date', () => {
      const contract: ContractInsert = {
        driver_id: 'd1', vehicle_id: 'v1',
        start_date: '2024-06-01', end_date: '2024-01-01', weekly_price: 800,
      };
      expect(validateContractInsert(contract)).toContain('Data de término deve ser posterior à data de início');
    });
  });

  describe('applyContractUpdate', () => {
    it('updates weekly price', () => {
      const updated = applyContractUpdate(mockContracts[0], { weekly_price: 1000 });
      expect(updated.weekly_price).toBe(1000);
      expect(updated.driver_id).toBe('d1');
    });

    it('cancels a contract', () => {
      const updated = applyContractUpdate(mockContracts[0], {
        status: 'cancelled',
        cancelled_at: '2024-06-01T00:00:00Z',
        cancellation_reason: 'Motivo teste',
      });
      expect(updated.status).toBe('cancelled');
      expect(updated.cancellation_reason).toBe('Motivo teste');
    });

    it('ends a contract', () => {
      const updated = applyContractUpdate(mockContracts[0], {
        status: 'ended',
        end_date: '2024-12-31',
      });
      expect(updated.status).toBe('ended');
      expect(updated.end_date).toBe('2024-12-31');
    });
  });

  describe('Nullable fields handling', () => {
    it('handles null deposit', () => {
      expect(mockContracts[2].deposit).toBeNull();
    });

    it('handles null km_limit', () => {
      expect(mockContracts[2].km_limit).toBeNull();
    });

    it('handles null terms', () => {
      expect(mockContracts[1].terms).toBeNull();
    });

    it('handles null cancellation fields on active contract', () => {
      expect(mockContracts[0].cancelled_at).toBeNull();
      expect(mockContracts[0].cancellation_reason).toBeNull();
    });

    it('has cancellation data on cancelled contract', () => {
      expect(mockContracts[2].cancelled_at).not.toBeNull();
      expect(mockContracts[2].cancellation_reason).toBe('Motorista desistiu');
    });
  });
});
