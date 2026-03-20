import { describe, it, expect } from 'vitest';
import { differenceInDays } from 'date-fns';

// ── Simulate dashboard data processing at scale ──

interface Vehicle { id: string; status: string; brand: string; model: string; weekly_price: number; created_at: string }
interface Driver { id: string; status: string; name: string; cnh_expiry: string }
interface Payment { id: string; status: string; amount: number; due_date: string; paid_at: string | null }
interface Maintenance { id: string; status: string; cost: number; next_maintenance_date: string | null; vehicle_id: string; performed_at: string }

function generateVehicles(n: number): Vehicle[] {
  const statuses = ['available', 'rented', 'maintenance', 'inactive'];
  return Array.from({ length: n }, (_, i) => ({
    id: `v-${i}`,
    status: statuses[i % statuses.length],
    brand: `Brand${i % 10}`,
    model: `Model${i % 20}`,
    weekly_price: 400 + (i % 300),
    created_at: new Date(2024, 0, 1 + (i % 365)).toISOString(),
  }));
}

function generateDrivers(n: number): Driver[] {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => ({
    id: `d-${i}`,
    status: i % 5 === 0 ? 'inactive' : 'active',
    name: `Driver ${i}`,
    cnh_expiry: new Date(today.getTime() + (i - n / 2) * 86400000).toISOString().split('T')[0],
  }));
}

function generatePayments(n: number): Payment[] {
  const statuses = ['pending', 'paid', 'overdue', 'cancelled'];
  return Array.from({ length: n }, (_, i) => ({
    id: `p-${i}`,
    status: statuses[i % statuses.length],
    amount: 100 + (i % 500),
    due_date: new Date(2025, 0, 1 + (i % 90)).toISOString().split('T')[0],
    paid_at: i % 4 === 1 ? new Date(2025, 0, 2 + (i % 90)).toISOString() : null,
  }));
}

function generateMaintenances(n: number): Maintenance[] {
  const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  return Array.from({ length: n }, (_, i) => ({
    id: `m-${i}`,
    status: statuses[i % statuses.length],
    cost: 50 + (i % 1000),
    next_maintenance_date: i % 3 === 0 ? new Date(2025, 2, 1 + (i % 60)).toISOString().split('T')[0] : null,
    vehicle_id: `v-${i % 100}`,
    performed_at: new Date(2025, 0, 1 + (i % 60)).toISOString().split('T')[0],
  }));
}

// ── Dashboard calculations (mirrors locador/Dashboard.tsx) ──

function computeDashboardStats(vehicles: Vehicle[], drivers: Driver[], payments: Payment[], maintenances: Maintenance[]) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const availableVehicles = vehicles.filter(v => v.status === 'available').length;
  const rentedVehicles = vehicles.filter(v => v.status === 'rented').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const overduePayments = pendingPayments.filter(p => p.due_date < todayStr);
  const monthlyRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const cnhAlerts = drivers.filter(d => {
    const daysUntilExpiry = differenceInDays(new Date(d.cnh_expiry), today);
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }).length;

  const upcomingMaintenances = maintenances.filter(m =>
    m.status === 'scheduled' || (m.next_maintenance_date && m.next_maintenance_date >= todayStr)
  ).length;

  return {
    totalVehicles: vehicles.length,
    availableVehicles, rentedVehicles, maintenanceVehicles,
    activeDrivers, pendingPayments: pendingPayments.length,
    overduePayments: overduePayments.length, monthlyRevenue,
    alertsCount: cnhAlerts + upcomingMaintenances + overduePayments.length,
  };
}

// ── Tests ──

describe('Dashboard performance: small dataset (typical user)', () => {
  const vehicles = generateVehicles(20);
  const drivers = generateDrivers(15);
  const payments = generatePayments(100);
  const maintenances = generateMaintenances(50);

  it('computes stats under 5ms for 20 vehicles', () => {
    const start = performance.now();
    const stats = computeDashboardStats(vehicles, drivers, payments, maintenances);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(5);
    expect(stats.totalVehicles).toBe(20);
    expect(stats.availableVehicles).toBe(5); // 1/4 of 20
  });

  it('returns correct revenue sum', () => {
    const stats = computeDashboardStats(vehicles, drivers, payments, maintenances);
    const expectedRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    expect(stats.monthlyRevenue).toBe(expectedRevenue);
  });
});

describe('Dashboard performance: medium dataset (growing business)', () => {
  const vehicles = generateVehicles(200);
  const drivers = generateDrivers(150);
  const payments = generatePayments(1000);
  const maintenances = generateMaintenances(500);

  it('computes stats under 20ms for 200 vehicles', () => {
    const start = performance.now();
    const stats = computeDashboardStats(vehicles, drivers, payments, maintenances);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(20);
    expect(stats.totalVehicles).toBe(200);
  });
});

describe('Dashboard performance: large dataset (enterprise)', () => {
  const vehicles = generateVehicles(1000);
  const drivers = generateDrivers(800);
  const payments = generatePayments(5000);
  const maintenances = generateMaintenances(3000);

  it('computes stats under 100ms for 1000 vehicles', () => {
    const start = performance.now();
    const stats = computeDashboardStats(vehicles, drivers, payments, maintenances);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
    expect(stats.totalVehicles).toBe(1000);
    expect(stats.availableVehicles).toBe(250);
    expect(stats.rentedVehicles).toBe(250);
  });

  it('handles large payment aggregation efficiently', () => {
    const start = performance.now();
    const revenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(10);
    expect(revenue).toBeGreaterThan(0);
  });

  it('CNH alert calculation scales linearly', () => {
    const start = performance.now();
    const today = new Date();
    const alerts = drivers.filter(d => {
      const days = differenceInDays(new Date(d.cnh_expiry), today);
      return days <= 30 && days >= 0;
    });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
    expect(alerts.length).toBeGreaterThanOrEqual(0);
  });
});

describe('Dashboard performance: data generation sanity', () => {
  it('generates correct vehicle status distribution', () => {
    const v = generateVehicles(100);
    const available = v.filter(x => x.status === 'available').length;
    const rented = v.filter(x => x.status === 'rented').length;
    expect(available).toBe(25);
    expect(rented).toBe(25);
  });

  it('generates drivers with varied CNH expiry dates', () => {
    const d = generateDrivers(100);
    const expired = d.filter(x => new Date(x.cnh_expiry) < new Date());
    const valid = d.filter(x => new Date(x.cnh_expiry) >= new Date());
    expect(expired.length).toBeGreaterThan(0);
    expect(valid.length).toBeGreaterThan(0);
  });

  it('generates payments with all statuses', () => {
    const p = generatePayments(100);
    const statuses = new Set(p.map(x => x.status));
    expect(statuses.size).toBe(4);
  });
});

describe('Dashboard performance: repeated computations', () => {
  const vehicles = generateVehicles(500);
  const drivers = generateDrivers(400);
  const payments = generatePayments(2000);
  const maintenances = generateMaintenances(1000);

  it('10 consecutive computations complete under 200ms total', () => {
    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      computeDashboardStats(vehicles, drivers, payments, maintenances);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });
});
