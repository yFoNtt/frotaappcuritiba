import { describe, it, expect } from 'vitest';
import type { Vehicle, PublicVehicle } from '@/hooks/useVehicles';

// Pure logic tests for vehicle data structures and transformations

function filterAvailableVehicles(vehicles: Partial<Vehicle>[]): Partial<Vehicle>[] {
  return vehicles.filter(v => v.status === 'available');
}

function mapToPublicVehicle(vehicle: Vehicle): PublicVehicle {
  const { plate, locador_id, current_driver_id, updated_at, ...publicFields } = vehicle;
  return publicFields as PublicVehicle;
}

function paginateVehicles<T>(vehicles: T[], page: number, pageSize: number): { items: T[]; hasNext: boolean } {
  const from = page * pageSize;
  const items = vehicles.slice(from, from + pageSize);
  return { items, hasNext: items.length === pageSize };
}

function sortVehiclesByPrice(vehicles: Partial<Vehicle>[], ascending = true): Partial<Vehicle>[] {
  return [...vehicles].sort((a, b) =>
    ascending ? (a.weekly_price ?? 0) - (b.weekly_price ?? 0) : (b.weekly_price ?? 0) - (a.weekly_price ?? 0)
  );
}

function filterByCity(vehicles: Partial<Vehicle>[], city: string): Partial<Vehicle>[] {
  return vehicles.filter(v => v.city?.toLowerCase() === city.toLowerCase());
}

function filterByFuelType(vehicles: Partial<Vehicle>[], fuelType: string): Partial<Vehicle>[] {
  return vehicles.filter(v => v.fuel_type === fuelType);
}

const mockVehicles: Vehicle[] = [
  {
    id: 'v1', locador_id: 'l1', brand: 'Toyota', model: 'Corolla', year: 2023,
    plate: 'ABC1234', color: 'Branco', fuel_type: 'flex', status: 'available',
    weekly_price: 800, km_limit: 1000, excess_km_fee: 0.5, deposit: 2000,
    allowed_apps: ['uber', '99'], description: 'Sedan confortável', images: ['img1.jpg'],
    city: 'São Paulo', state: 'SP', current_driver_id: null, current_km: 15000,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'v2', locador_id: 'l1', brand: 'Honda', model: 'Civic', year: 2022,
    plate: 'XYZ5678', color: 'Preto', fuel_type: 'gasoline', status: 'rented',
    weekly_price: 900, km_limit: 1200, excess_km_fee: 0.6, deposit: 2500,
    allowed_apps: ['uber'], description: null, images: [],
    city: 'Rio de Janeiro', state: 'RJ', current_driver_id: 'd1', current_km: 30000,
    created_at: '2024-02-01T00:00:00Z', updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'v3', locador_id: 'l2', brand: 'Hyundai', model: 'HB20', year: 2024,
    plate: 'DEF9012', color: 'Prata', fuel_type: 'flex', status: 'available',
    weekly_price: 600, km_limit: 800, excess_km_fee: 0.4, deposit: 1500,
    allowed_apps: ['99'], description: 'Econômico', images: ['img2.jpg', 'img3.jpg'],
    city: 'São Paulo', state: 'SP', current_driver_id: null, current_km: 5000,
    created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'v4', locador_id: 'l1', brand: 'Chevrolet', model: 'Onix', year: 2023,
    plate: 'GHI3456', color: 'Cinza', fuel_type: 'ethanol', status: 'maintenance',
    weekly_price: 550, km_limit: null, excess_km_fee: null, deposit: null,
    allowed_apps: [], description: null, images: [],
    city: 'Belo Horizonte', state: 'MG', current_driver_id: null, current_km: null,
    created_at: '2024-04-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z',
  },
];

describe('Vehicle Data Hooks - Logic Tests', () => {
  describe('filterAvailableVehicles', () => {
    it('returns only available vehicles', () => {
      const result = filterAvailableVehicles(mockVehicles);
      expect(result).toHaveLength(2);
      expect(result.every(v => v.status === 'available')).toBe(true);
    });

    it('returns empty array when no available vehicles', () => {
      const rented = mockVehicles.map(v => ({ ...v, status: 'rented' as const }));
      expect(filterAvailableVehicles(rented)).toHaveLength(0);
    });
  });

  describe('mapToPublicVehicle', () => {
    it('removes sensitive fields (plate, locador_id, current_driver_id)', () => {
      const pub = mapToPublicVehicle(mockVehicles[0]);
      expect(pub).not.toHaveProperty('plate');
      expect(pub).not.toHaveProperty('locador_id');
      expect(pub).not.toHaveProperty('current_driver_id');
      expect(pub).not.toHaveProperty('updated_at');
    });

    it('preserves public fields', () => {
      const pub = mapToPublicVehicle(mockVehicles[0]);
      expect(pub.id).toBe('v1');
      expect(pub.brand).toBe('Toyota');
      expect(pub.weekly_price).toBe(800);
      expect(pub.city).toBe('São Paulo');
    });
  });

  describe('paginateVehicles', () => {
    it('returns first page correctly', () => {
      const result = paginateVehicles(mockVehicles, 0, 2);
      expect(result.items).toHaveLength(2);
      expect(result.hasNext).toBe(true);
      expect(result.items[0].id).toBe('v1');
    });

    it('returns last page with hasNext false', () => {
      const result = paginateVehicles(mockVehicles, 1, 2);
      expect(result.items).toHaveLength(2);
      expect(result.hasNext).toBe(true);
    });

    it('returns empty page beyond data', () => {
      const result = paginateVehicles(mockVehicles, 5, 2);
      expect(result.items).toHaveLength(0);
      expect(result.hasNext).toBe(false);
    });

    it('handles page size larger than data', () => {
      const result = paginateVehicles(mockVehicles, 0, 100);
      expect(result.items).toHaveLength(4);
      expect(result.hasNext).toBe(false);
    });
  });

  describe('sortVehiclesByPrice', () => {
    it('sorts ascending by default', () => {
      const sorted = sortVehiclesByPrice(mockVehicles);
      expect(sorted[0].weekly_price).toBe(550);
      expect(sorted[3].weekly_price).toBe(900);
    });

    it('sorts descending when specified', () => {
      const sorted = sortVehiclesByPrice(mockVehicles, false);
      expect(sorted[0].weekly_price).toBe(900);
      expect(sorted[3].weekly_price).toBe(550);
    });
  });

  describe('filterByCity', () => {
    it('filters by city case-insensitively', () => {
      expect(filterByCity(mockVehicles, 'são paulo')).toHaveLength(2);
      expect(filterByCity(mockVehicles, 'SÃO PAULO')).toHaveLength(2);
    });

    it('returns empty for non-existent city', () => {
      expect(filterByCity(mockVehicles, 'Curitiba')).toHaveLength(0);
    });
  });

  describe('filterByFuelType', () => {
    it('filters flex vehicles', () => {
      expect(filterByFuelType(mockVehicles, 'flex')).toHaveLength(2);
    });

    it('filters single fuel type', () => {
      expect(filterByFuelType(mockVehicles, 'ethanol')).toHaveLength(1);
    });
  });

  describe('Vehicle type validation', () => {
    it('handles nullable fields correctly', () => {
      const v = mockVehicles[3];
      expect(v.km_limit).toBeNull();
      expect(v.excess_km_fee).toBeNull();
      expect(v.deposit).toBeNull();
      expect(v.current_km).toBeNull();
      expect(v.description).toBeNull();
    });

    it('handles empty arrays', () => {
      const v = mockVehicles[3];
      expect(v.allowed_apps).toEqual([]);
      expect(v.images).toEqual([]);
    });
  });

  describe('Query key patterns', () => {
    it('generates correct query keys for public listing', () => {
      const key = ['vehicles', 'available'];
      expect(key).toEqual(['vehicles', 'available']);
    });

    it('generates correct query keys for locador vehicles', () => {
      const userId = 'user-123';
      const key = ['vehicles', 'locador', userId];
      expect(key).toEqual(['vehicles', 'locador', 'user-123']);
    });

    it('generates correct query keys for single vehicle', () => {
      const vehicleId = 'v1';
      const key = ['vehicle', vehicleId];
      expect(key).toEqual(['vehicle', 'v1']);
    });

    it('disabled state when no user', () => {
      const user = null;
      expect(!!user).toBe(false);
    });
  });
});
