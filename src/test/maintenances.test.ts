import { describe, it, expect } from 'vitest';
import type { MaintenanceType, MaintenanceStatus, MaintenanceInsert } from '@/hooks/useMaintenances';

// ── Business rule helpers ──

function validateMaintenanceInsert(data: Partial<MaintenanceInsert>): string[] {
  const errors: string[] = [];
  if (!data.vehicle_id) errors.push('vehicle_id é obrigatório');
  if (!data.type) errors.push('type é obrigatório');
  if (!data.description?.trim()) errors.push('description é obrigatório');
  if (!data.performed_at) errors.push('performed_at é obrigatório');
  if (data.cost !== undefined && data.cost < 0) errors.push('cost não pode ser negativo');
  if (data.km_at_maintenance !== undefined && data.km_at_maintenance < 0) errors.push('km não pode ser negativo');
  if (data.next_maintenance_km !== undefined && data.km_at_maintenance !== undefined && data.next_maintenance_km <= data.km_at_maintenance) {
    errors.push('próxima km deve ser maior que km atual');
  }
  return errors;
}

const VALID_TYPES: MaintenanceType[] = ['oil_change', 'tire_change', 'revision', 'repair', 'inspection', 'other'];
const VALID_STATUSES: MaintenanceStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];

function isValidStatusTransition(from: MaintenanceStatus, to: MaintenanceStatus): boolean {
  const transitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  return transitions[from]?.includes(to) ?? false;
}

// ── Tests ──

describe('Maintenance: validation rules', () => {
  it('requires vehicle_id, type, description, performed_at', () => {
    const errors = validateMaintenanceInsert({});
    expect(errors).toContain('vehicle_id é obrigatório');
    expect(errors).toContain('type é obrigatório');
    expect(errors).toContain('description é obrigatório');
    expect(errors).toContain('performed_at é obrigatório');
  });

  it('accepts valid complete maintenance', () => {
    const errors = validateMaintenanceInsert({
      vehicle_id: 'v1',
      type: 'oil_change',
      description: 'Troca de óleo 5W30',
      performed_at: '2025-01-15',
      cost: 250,
      km_at_maintenance: 45000,
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects negative cost', () => {
    const errors = validateMaintenanceInsert({
      vehicle_id: 'v1', type: 'repair', description: 'Fix', performed_at: '2025-01-01',
      cost: -100,
    });
    expect(errors).toContain('cost não pode ser negativo');
  });

  it('rejects negative km', () => {
    const errors = validateMaintenanceInsert({
      vehicle_id: 'v1', type: 'repair', description: 'Fix', performed_at: '2025-01-01',
      km_at_maintenance: -1,
    });
    expect(errors).toContain('km não pode ser negativo');
  });

  it('rejects next_maintenance_km <= current km', () => {
    const errors = validateMaintenanceInsert({
      vehicle_id: 'v1', type: 'oil_change', description: 'Oil', performed_at: '2025-01-01',
      km_at_maintenance: 50000, next_maintenance_km: 50000,
    });
    expect(errors).toContain('próxima km deve ser maior que km atual');
  });

  it('accepts next_maintenance_km > current km', () => {
    const errors = validateMaintenanceInsert({
      vehicle_id: 'v1', type: 'oil_change', description: 'Oil', performed_at: '2025-01-01',
      km_at_maintenance: 50000, next_maintenance_km: 60000,
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects empty description', () => {
    const errors = validateMaintenanceInsert({
      vehicle_id: 'v1', type: 'repair', description: '   ', performed_at: '2025-01-01',
    });
    expect(errors).toContain('description é obrigatório');
  });
});

describe('Maintenance: types and statuses', () => {
  it('has all expected maintenance types', () => {
    expect(VALID_TYPES).toEqual(['oil_change', 'tire_change', 'revision', 'repair', 'inspection', 'other']);
  });

  it('has all expected statuses', () => {
    expect(VALID_STATUSES).toEqual(['scheduled', 'in_progress', 'completed', 'cancelled']);
  });
});

describe('Maintenance: status transitions', () => {
  it('scheduled → in_progress is valid', () => {
    expect(isValidStatusTransition('scheduled', 'in_progress')).toBe(true);
  });

  it('scheduled → cancelled is valid', () => {
    expect(isValidStatusTransition('scheduled', 'cancelled')).toBe(true);
  });

  it('in_progress → completed is valid', () => {
    expect(isValidStatusTransition('in_progress', 'completed')).toBe(true);
  });

  it('completed → any is invalid (terminal state)', () => {
    expect(isValidStatusTransition('completed', 'scheduled')).toBe(false);
    expect(isValidStatusTransition('completed', 'in_progress')).toBe(false);
    expect(isValidStatusTransition('completed', 'cancelled')).toBe(false);
  });

  it('cancelled → any is invalid (terminal state)', () => {
    expect(isValidStatusTransition('cancelled', 'scheduled')).toBe(false);
    expect(isValidStatusTransition('cancelled', 'completed')).toBe(false);
  });

  it('scheduled → completed is invalid (must go through in_progress)', () => {
    expect(isValidStatusTransition('scheduled', 'completed')).toBe(false);
  });
});
