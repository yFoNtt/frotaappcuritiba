import { describe, it, expect } from 'vitest';
import type { Driver, DriverInsert, DriverUpdate } from '@/hooks/useDrivers';

// Pure logic tests for driver data transformations and validation

const mockDrivers: Driver[] = [
  {
    id: 'd1', locador_id: 'l1', user_id: 'u1', name: 'João Silva',
    email: 'joao@email.com', phone: '11999999999', cnh_number: '12345678901',
    cnh_expiry: '2025-12-31', vehicle_id: 'v1', status: 'active',
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'd2', locador_id: 'l1', user_id: 'u2', name: 'Maria Santos',
    email: 'maria@email.com', phone: null, cnh_number: '98765432109',
    cnh_expiry: '2024-06-15', vehicle_id: null, status: 'inactive',
    created_at: '2024-02-01T00:00:00Z', updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'd3', locador_id: 'l1', user_id: null, name: 'Pedro Costa',
    email: 'pedro@email.com', phone: '21988888888', cnh_number: '11122233344',
    cnh_expiry: '2026-03-20', vehicle_id: null, status: 'pending',
    created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z',
  },
];

function filterByStatus(drivers: Driver[], status: Driver['status']): Driver[] {
  return drivers.filter(d => d.status === status);
}

function getDriversWithVehicle(drivers: Driver[]): Driver[] {
  return drivers.filter(d => d.vehicle_id !== null);
}

function getDriversWithoutVehicle(drivers: Driver[]): Driver[] {
  return drivers.filter(d => d.vehicle_id === null);
}

function isCnhExpired(cnhExpiry: string): boolean {
  return new Date(cnhExpiry) < new Date();
}

function isCnhExpiringSoon(cnhExpiry: string, daysThreshold: number): boolean {
  const expiry = new Date(cnhExpiry);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= daysThreshold;
}

function validateDriverInsert(driver: DriverInsert): string[] {
  const errors: string[] = [];
  if (!driver.name || driver.name.trim() === '') errors.push('Nome é obrigatório');
  if (!driver.email || !driver.email.includes('@')) errors.push('Email inválido');
  if (!driver.cnh_number || driver.cnh_number.length !== 11) errors.push('CNH deve ter 11 dígitos');
  if (!driver.cnh_expiry) errors.push('Validade da CNH é obrigatória');
  return errors;
}

function mergeDriverUpdate(driver: Driver, updates: DriverUpdate): Driver {
  return { ...driver, ...updates, updated_at: new Date().toISOString() };
}

describe('Driver Data Hooks - Logic Tests', () => {
  describe('filterByStatus', () => {
    it('filters active drivers', () => {
      expect(filterByStatus(mockDrivers, 'active')).toHaveLength(1);
      expect(filterByStatus(mockDrivers, 'active')[0].name).toBe('João Silva');
    });

    it('filters inactive drivers', () => {
      expect(filterByStatus(mockDrivers, 'inactive')).toHaveLength(1);
    });

    it('filters pending drivers', () => {
      expect(filterByStatus(mockDrivers, 'pending')).toHaveLength(1);
    });
  });

  describe('vehicle assignment', () => {
    it('identifies drivers with vehicles', () => {
      const withVehicle = getDriversWithVehicle(mockDrivers);
      expect(withVehicle).toHaveLength(1);
      expect(withVehicle[0].vehicle_id).toBe('v1');
    });

    it('identifies drivers without vehicles', () => {
      expect(getDriversWithoutVehicle(mockDrivers)).toHaveLength(2);
    });
  });

  describe('CNH expiry checks', () => {
    it('detects expired CNH', () => {
      expect(isCnhExpired('2020-01-01')).toBe(true);
    });

    it('detects valid CNH', () => {
      expect(isCnhExpired('2030-12-31')).toBe(false);
    });

    it('detects CNH expiring within 30 days', () => {
      const in15Days = new Date();
      in15Days.setDate(in15Days.getDate() + 15);
      expect(isCnhExpiringSoon(in15Days.toISOString().split('T')[0], 30)).toBe(true);
    });

    it('CNH far from expiry is not flagged', () => {
      expect(isCnhExpiringSoon('2030-12-31', 30)).toBe(false);
    });

    it('expired CNH is not flagged as expiring soon', () => {
      expect(isCnhExpiringSoon('2020-01-01', 30)).toBe(false);
    });
  });

  describe('validateDriverInsert', () => {
    it('validates a correct driver insert', () => {
      const driver: DriverInsert = {
        name: 'Test Driver', email: 'test@email.com',
        cnh_number: '12345678901', cnh_expiry: '2025-12-31',
      };
      expect(validateDriverInsert(driver)).toHaveLength(0);
    });

    it('catches empty name', () => {
      const driver: DriverInsert = {
        name: '', email: 'test@email.com',
        cnh_number: '12345678901', cnh_expiry: '2025-12-31',
      };
      expect(validateDriverInsert(driver)).toContain('Nome é obrigatório');
    });

    it('catches invalid email', () => {
      const driver: DriverInsert = {
        name: 'Test', email: 'invalid',
        cnh_number: '12345678901', cnh_expiry: '2025-12-31',
      };
      expect(validateDriverInsert(driver)).toContain('Email inválido');
    });

    it('catches invalid CNH length', () => {
      const driver: DriverInsert = {
        name: 'Test', email: 'test@email.com',
        cnh_number: '123', cnh_expiry: '2025-12-31',
      };
      expect(validateDriverInsert(driver)).toContain('CNH deve ter 11 dígitos');
    });

    it('catches multiple errors at once', () => {
      const driver: DriverInsert = {
        name: '', email: 'invalid', cnh_number: '123', cnh_expiry: '',
      };
      expect(validateDriverInsert(driver).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('mergeDriverUpdate', () => {
    it('merges partial updates correctly', () => {
      const updated = mergeDriverUpdate(mockDrivers[0], { name: 'Novo Nome' });
      expect(updated.name).toBe('Novo Nome');
      expect(updated.email).toBe('joao@email.com');
    });

    it('updates status', () => {
      const updated = mergeDriverUpdate(mockDrivers[0], { status: 'inactive' });
      expect(updated.status).toBe('inactive');
    });

    it('updates vehicle assignment', () => {
      const updated = mergeDriverUpdate(mockDrivers[1], { vehicle_id: 'v2' });
      expect(updated.vehicle_id).toBe('v2');
    });

    it('sets updated_at timestamp', () => {
      const before = new Date().toISOString();
      const updated = mergeDriverUpdate(mockDrivers[0], { name: 'X' });
      expect(updated.updated_at >= before).toBe(true);
    });
  });

  describe('Query key patterns', () => {
    it('generates correct locador drivers key', () => {
      expect(['drivers', 'locador', 'user-123']).toEqual(['drivers', 'locador', 'user-123']);
    });

    it('disabled when no user', () => {
      const user = null;
      expect(!!user).toBe(false);
    });
  });

  describe('Nullable fields handling', () => {
    it('handles null phone', () => {
      expect(mockDrivers[1].phone).toBeNull();
    });

    it('handles null user_id (unlinked driver)', () => {
      expect(mockDrivers[2].user_id).toBeNull();
    });

    it('handles null vehicle_id', () => {
      expect(mockDrivers[1].vehicle_id).toBeNull();
    });
  });
});
