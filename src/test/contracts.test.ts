import { describe, it, expect } from 'vitest';

// Test contract business logic / type constraints
type ContractStatus = 'active' | 'ended' | 'cancelled' | 'pending';

interface ContractInsert {
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
  status?: ContractStatus;
}

function validateContractInsert(c: ContractInsert): string[] {
  const errors: string[] = [];
  if (!c.driver_id) errors.push('driver_id é obrigatório');
  if (!c.vehicle_id) errors.push('vehicle_id é obrigatório');
  if (!c.start_date) errors.push('start_date é obrigatório');
  if (c.weekly_price <= 0) errors.push('weekly_price deve ser positivo');
  if (c.deposit !== undefined && c.deposit < 0) errors.push('deposit não pode ser negativo');
  if (c.km_limit !== undefined && c.km_limit < 0) errors.push('km_limit não pode ser negativo');
  if (c.excess_km_fee !== undefined && c.excess_km_fee < 0) errors.push('excess_km_fee não pode ser negativo');
  if (c.end_date && c.start_date && new Date(c.end_date) < new Date(c.start_date)) {
    errors.push('end_date não pode ser anterior a start_date');
  }
  return errors;
}

describe('Contract validation', () => {
  const validContract: ContractInsert = {
    driver_id: 'uuid-1',
    vehicle_id: 'uuid-2',
    start_date: '2025-01-01',
    weekly_price: 500,
  };

  it('accepts valid contract', () => {
    expect(validateContractInsert(validContract)).toEqual([]);
  });

  it('rejects missing driver_id', () => {
    expect(validateContractInsert({ ...validContract, driver_id: '' })).toContain('driver_id é obrigatório');
  });

  it('rejects missing vehicle_id', () => {
    expect(validateContractInsert({ ...validContract, vehicle_id: '' })).toContain('vehicle_id é obrigatório');
  });

  it('rejects zero/negative weekly_price', () => {
    expect(validateContractInsert({ ...validContract, weekly_price: 0 })).toContain('weekly_price deve ser positivo');
    expect(validateContractInsert({ ...validContract, weekly_price: -100 })).toContain('weekly_price deve ser positivo');
  });

  it('rejects negative deposit', () => {
    expect(validateContractInsert({ ...validContract, deposit: -1 })).toContain('deposit não pode ser negativo');
  });

  it('rejects end_date before start_date', () => {
    const errors = validateContractInsert({
      ...validContract,
      start_date: '2025-06-01',
      end_date: '2025-01-01',
    });
    expect(errors).toContain('end_date não pode ser anterior a start_date');
  });

  it('accepts contract with valid end_date', () => {
    expect(validateContractInsert({
      ...validContract,
      end_date: '2025-12-31',
    })).toEqual([]);
  });

  it('accepts contract with null end_date', () => {
    expect(validateContractInsert({
      ...validContract,
      end_date: null,
    })).toEqual([]);
  });
});

describe('Contract status transitions', () => {
  const validTransitions: Record<ContractStatus, ContractStatus[]> = {
    pending: ['active', 'cancelled'],
    active: ['ended', 'cancelled'],
    ended: [],
    cancelled: [],
  };

  function canTransition(from: ContractStatus, to: ContractStatus): boolean {
    return validTransitions[from]?.includes(to) ?? false;
  }

  it('allows pending -> active', () => {
    expect(canTransition('pending', 'active')).toBe(true);
  });

  it('allows pending -> cancelled', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true);
  });

  it('allows active -> ended', () => {
    expect(canTransition('active', 'ended')).toBe(true);
  });

  it('allows active -> cancelled', () => {
    expect(canTransition('active', 'cancelled')).toBe(true);
  });

  it('blocks ended -> active', () => {
    expect(canTransition('ended', 'active')).toBe(false);
  });

  it('blocks cancelled -> active', () => {
    expect(canTransition('cancelled', 'active')).toBe(false);
  });

  it('blocks ended -> any', () => {
    expect(canTransition('ended', 'cancelled')).toBe(false);
    expect(canTransition('ended', 'pending')).toBe(false);
  });
});
