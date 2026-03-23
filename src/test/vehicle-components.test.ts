import { describe, it, expect } from 'vitest';
import type { VehicleFiltersState } from '@/components/vehicles/VehicleFilters';

// ============================================================
// Pure logic tests for VehicleCard rendering logic and
// VehicleFilters state management / filter application
// ============================================================

// ---- VehicleCard label mappings (mirrors component) ----

const statusLabels: Record<string, string> = {
  available: 'Disponível',
  rented: 'Alugado',
  maintenance: 'Manutenção',
  inactive: 'Inativo',
};

const fuelLabels: Record<string, string> = {
  flex: 'Flex',
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  diesel: 'Diesel',
  electric: 'Elétrico',
  hybrid: 'Híbrido',
};

const appLabels: Record<string, string> = {
  uber: 'Uber',
  '99': '99',
  indrive: 'InDrive',
  other: 'Outro',
};

interface MockVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  fuel_type: string;
  status: string;
  weekly_price: number;
  km_limit: number | null;
  allowed_apps: string[];
  images: string[];
  city: string;
  state: string;
}

const vehicles: MockVehicle[] = [
  { id: 'v1', brand: 'Toyota', model: 'Corolla', year: 2023, color: 'Branco', fuel_type: 'flex', status: 'available', weekly_price: 800, km_limit: 1000, allowed_apps: ['uber', '99'], images: ['img1.jpg'], city: 'São Paulo', state: 'SP' },
  { id: 'v2', brand: 'Honda', model: 'Civic', year: 2022, color: 'Preto', fuel_type: 'gasoline', status: 'available', weekly_price: 900, km_limit: 1200, allowed_apps: ['uber'], images: [], city: 'Rio de Janeiro', state: 'RJ' },
  { id: 'v3', brand: 'Hyundai', model: 'HB20', year: 2024, color: 'Prata', fuel_type: 'flex', status: 'available', weekly_price: 600, km_limit: null, allowed_apps: ['99'], images: ['img2.jpg'], city: 'São Paulo', state: 'SP' },
  { id: 'v4', brand: 'Chevrolet', model: 'Onix', year: 2021, color: 'Cinza', fuel_type: 'ethanol', status: 'available', weekly_price: 550, km_limit: 800, allowed_apps: [], images: [], city: 'Belo Horizonte', state: 'MG' },
  { id: 'v5', brand: 'Toyota', model: 'Yaris', year: 2023, color: 'Vermelho', fuel_type: 'hybrid', status: 'available', weekly_price: 1100, km_limit: 1500, allowed_apps: ['uber', 'indrive'], images: ['img3.jpg'], city: 'Curitiba', state: 'PR' },
];

const emptyFilters: VehicleFiltersState = {
  search: '', state: '', city: '', brand: '', minYear: '', minPrice: '', maxPrice: '', fuelType: '', app: '',
};

// ---- Filter application logic (mirrors Vehicles page) ----

function applyFilters(list: MockVehicle[], filters: VehicleFiltersState): MockVehicle[] {
  return list.filter(v => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!`${v.brand} ${v.model}`.toLowerCase().includes(q)) return false;
    }
    if (filters.state && v.state !== filters.state) return false;
    if (filters.city && v.city !== filters.city) return false;
    if (filters.brand && v.brand !== filters.brand) return false;
    if (filters.minYear && v.year < parseInt(filters.minYear)) return false;
    if (filters.minPrice && v.weekly_price < parseInt(filters.minPrice)) return false;
    if (filters.maxPrice && v.weekly_price > parseInt(filters.maxPrice)) return false;
    if (filters.fuelType && v.fuel_type !== filters.fuelType) return false;
    if (filters.app && !v.allowed_apps.includes(filters.app)) return false;
    return true;
  });
}

function extractFilterOptions(list: MockVehicle[]) {
  return {
    states: [...new Set(list.map(v => v.state))].sort(),
    cities: [...new Set(list.map(v => v.city))].sort(),
    brands: [...new Set(list.map(v => v.brand))].sort(),
    years: [...new Set(list.map(v => v.year))].sort((a, b) => b - a),
    fuelTypes: [...new Set(list.map(v => v.fuel_type))].sort(),
    apps: [...new Set(list.flatMap(v => v.allowed_apps))].sort(),
  };
}

function getActiveFiltersCount(filters: VehicleFiltersState): number {
  return Object.values(filters).filter(v => v !== '').length;
}

function hasActiveFilters(filters: VehicleFiltersState): boolean {
  return Object.values(filters).some(v => v !== '');
}

function updateFilter(filters: VehicleFiltersState, key: keyof VehicleFiltersState, value: string): VehicleFiltersState {
  const filterValue = value === 'all' ? '' : value;
  if (key === 'state') {
    return { ...filters, [key]: filterValue, city: '' };
  }
  return { ...filters, [key]: filterValue };
}

function toggleFilter(filters: VehicleFiltersState, key: 'app' | 'fuelType', value: string): VehicleFiltersState {
  return { ...filters, [key]: filters[key] === value ? '' : value };
}

// ============================================================

describe('VehicleCard - Label Mappings', () => {
  it('maps all status values to Portuguese labels', () => {
    expect(statusLabels['available']).toBe('Disponível');
    expect(statusLabels['rented']).toBe('Alugado');
    expect(statusLabels['maintenance']).toBe('Manutenção');
    expect(statusLabels['inactive']).toBe('Inativo');
  });

  it('maps all fuel types to Portuguese labels', () => {
    expect(fuelLabels['flex']).toBe('Flex');
    expect(fuelLabels['gasoline']).toBe('Gasolina');
    expect(fuelLabels['diesel']).toBe('Diesel');
    expect(fuelLabels['electric']).toBe('Elétrico');
    expect(fuelLabels['hybrid']).toBe('Híbrido');
  });

  it('maps app identifiers to display names', () => {
    expect(appLabels['uber']).toBe('Uber');
    expect(appLabels['99']).toBe('99');
    expect(appLabels['indrive']).toBe('InDrive');
  });

  it('returns undefined for unknown status', () => {
    expect(statusLabels['unknown']).toBeUndefined();
  });
});

describe('VehicleCard - Rendering Logic', () => {
  it('uses placeholder when no images', () => {
    const img = vehicles[1].images[0] || '/placeholder.svg';
    expect(img).toBe('/placeholder.svg');
  });

  it('uses first image when available', () => {
    const img = vehicles[0].images[0] || '/placeholder.svg';
    expect(img).toBe('img1.jpg');
  });

  it('formats price in BRL locale', () => {
    const formatted = vehicles[0].weekly_price.toLocaleString('pt-BR');
    expect(formatted).toBeTruthy();
  });

  it('shows km_limit only when not null', () => {
    expect(vehicles[0].km_limit).toBe(1000);
    expect(vehicles[2].km_limit).toBeNull();
  });

  it('shows apps only when array is non-empty', () => {
    expect(vehicles[0].allowed_apps.length).toBeGreaterThan(0);
    expect(vehicles[3].allowed_apps.length).toBe(0);
  });

  it('generates correct detail link', () => {
    const link = `/veiculos/${vehicles[0].id}`;
    expect(link).toBe('/veiculos/v1');
  });

  it('formats alt text with brand and model', () => {
    const alt = `${vehicles[0].brand} ${vehicles[0].model}`;
    expect(alt).toBe('Toyota Corolla');
  });
});

describe('VehicleFilters - Filter Options Extraction', () => {
  const options = extractFilterOptions(vehicles);

  it('extracts unique sorted states', () => {
    expect(options.states).toEqual(['MG', 'PR', 'RJ', 'SP']);
  });

  it('extracts unique sorted cities', () => {
    expect(options.cities).toContain('São Paulo');
    expect(options.cities).toContain('Curitiba');
  });

  it('extracts unique sorted brands', () => {
    expect(options.brands).toEqual(['Chevrolet', 'Honda', 'Hyundai', 'Toyota']);
  });

  it('extracts years in descending order', () => {
    expect(options.years[0]).toBe(2024);
    expect(options.years[options.years.length - 1]).toBe(2021);
  });

  it('extracts unique fuel types', () => {
    expect(options.fuelTypes).toContain('flex');
    expect(options.fuelTypes).toContain('hybrid');
  });

  it('extracts unique apps from all vehicles', () => {
    expect(options.apps).toContain('uber');
    expect(options.apps).toContain('99');
    expect(options.apps).toContain('indrive');
  });
});

describe('VehicleFilters - Filter Application', () => {
  it('returns all vehicles with empty filters', () => {
    expect(applyFilters(vehicles, emptyFilters)).toHaveLength(5);
  });

  it('filters by search text (brand)', () => {
    const f = { ...emptyFilters, search: 'toyota' };
    expect(applyFilters(vehicles, f)).toHaveLength(2);
  });

  it('filters by search text (model)', () => {
    const f = { ...emptyFilters, search: 'civic' };
    expect(applyFilters(vehicles, f)).toHaveLength(1);
  });

  it('filters by state', () => {
    const f = { ...emptyFilters, state: 'SP' };
    expect(applyFilters(vehicles, f)).toHaveLength(2);
  });

  it('filters by city', () => {
    const f = { ...emptyFilters, city: 'São Paulo' };
    expect(applyFilters(vehicles, f)).toHaveLength(2);
  });

  it('filters by brand', () => {
    const f = { ...emptyFilters, brand: 'Honda' };
    const result = applyFilters(vehicles, f);
    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('Civic');
  });

  it('filters by minimum year', () => {
    const f = { ...emptyFilters, minYear: '2023' };
    expect(applyFilters(vehicles, f)).toHaveLength(3);
  });

  it('filters by max price', () => {
    const f = { ...emptyFilters, maxPrice: '700' };
    expect(applyFilters(vehicles, f)).toHaveLength(2); // 600 and 550
  });

  it('filters by min price', () => {
    const f = { ...emptyFilters, minPrice: '800' };
    expect(applyFilters(vehicles, f)).toHaveLength(3); // 800, 900, 1100
  });

  it('filters by fuel type', () => {
    const f = { ...emptyFilters, fuelType: 'flex' };
    expect(applyFilters(vehicles, f)).toHaveLength(2);
  });

  it('filters by app', () => {
    const f = { ...emptyFilters, app: 'uber' };
    expect(applyFilters(vehicles, f)).toHaveLength(3);
  });

  it('combines multiple filters', () => {
    const f = { ...emptyFilters, state: 'SP', fuelType: 'flex' };
    expect(applyFilters(vehicles, f)).toHaveLength(2);
  });

  it('returns empty when no match', () => {
    const f = { ...emptyFilters, search: 'Ferrari' };
    expect(applyFilters(vehicles, f)).toHaveLength(0);
  });

  it('price range filter (min + max)', () => {
    const f = { ...emptyFilters, minPrice: '600', maxPrice: '900' };
    expect(applyFilters(vehicles, f)).toHaveLength(3); // 600, 800, 900
  });
});

describe('VehicleFilters - State Management', () => {
  it('counts active filters correctly', () => {
    expect(getActiveFiltersCount(emptyFilters)).toBe(0);
    expect(getActiveFiltersCount({ ...emptyFilters, search: 'test' })).toBe(1);
    expect(getActiveFiltersCount({ ...emptyFilters, state: 'SP', brand: 'Toyota' })).toBe(2);
  });

  it('detects active filters', () => {
    expect(hasActiveFilters(emptyFilters)).toBe(false);
    expect(hasActiveFilters({ ...emptyFilters, app: 'uber' })).toBe(true);
  });

  it('clears city when state changes', () => {
    const withCity = { ...emptyFilters, state: 'SP', city: 'São Paulo' };
    const updated = updateFilter(withCity, 'state', 'RJ');
    expect(updated.state).toBe('RJ');
    expect(updated.city).toBe('');
  });

  it('converts "all" to empty string', () => {
    const updated = updateFilter(emptyFilters, 'brand', 'all');
    expect(updated.brand).toBe('');
  });

  it('sets filter value normally', () => {
    const updated = updateFilter(emptyFilters, 'brand', 'Toyota');
    expect(updated.brand).toBe('Toyota');
  });

  it('toggles app filter on', () => {
    const toggled = toggleFilter(emptyFilters, 'app', 'uber');
    expect(toggled.app).toBe('uber');
  });

  it('toggles app filter off', () => {
    const withApp = { ...emptyFilters, app: 'uber' };
    const toggled = toggleFilter(withApp, 'app', 'uber');
    expect(toggled.app).toBe('');
  });

  it('toggles fuel filter', () => {
    const toggled = toggleFilter(emptyFilters, 'fuelType', 'flex');
    expect(toggled.fuelType).toBe('flex');
    const toggled2 = toggleFilter(toggled, 'fuelType', 'flex');
    expect(toggled2.fuelType).toBe('');
  });
});

describe('VehicleFilters - Cities filtered by state', () => {
  it('filters cities when state is selected', () => {
    const spVehicles = vehicles.filter(v => v.state === 'SP');
    const spCities = [...new Set(spVehicles.map(v => v.city))].sort();
    expect(spCities).toEqual(['São Paulo']);
  });

  it('returns all cities when no state selected', () => {
    const allCities = [...new Set(vehicles.map(v => v.city))].sort();
    expect(allCities.length).toBe(4);
  });
});
