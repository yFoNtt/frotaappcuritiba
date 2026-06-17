/**
 * Canonical status values for vehicles and contracts.
 * Use these constants instead of string literals to avoid typos that
 * silently produce zero counts in dashboards and reports.
 */

export const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  MAINTENANCE: 'maintenance',
} as const;

export type VehicleStatusValue = typeof VEHICLE_STATUS[keyof typeof VEHICLE_STATUS];

export const VEHICLE_STATUS_VALUES: readonly VehicleStatusValue[] = Object.freeze([
  VEHICLE_STATUS.AVAILABLE,
  VEHICLE_STATUS.RENTED,
  VEHICLE_STATUS.MAINTENANCE,
]);

export const VEHICLE_STATUS_LABELS: Record<VehicleStatusValue, string> = {
  available: 'Disponíveis',
  rented: 'Alugados',
  maintenance: 'Manutenção',
};

export const CONTRACT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
} as const;

export type ContractStatusValue = typeof CONTRACT_STATUS[keyof typeof CONTRACT_STATUS];

export const CONTRACT_STATUS_VALUES: readonly ContractStatusValue[] = Object.freeze([
  CONTRACT_STATUS.ACTIVE,
  CONTRACT_STATUS.COMPLETED,
  CONTRACT_STATUS.CANCELLED,
  CONTRACT_STATUS.PENDING,
]);

export const CONTRACT_STATUS_LABELS: Record<ContractStatusValue, string> = {
  active: 'Ativos',
  completed: 'Finalizados',
  cancelled: 'Cancelados',
  pending: 'Pendentes',
};

/**
 * Returns true when value matches a known vehicle status.
 * Helps to flag unexpected DB values (e.g. typos, legacy rows).
 */
export function isVehicleStatus(value: unknown): value is VehicleStatusValue {
  return typeof value === 'string' && (VEHICLE_STATUS_VALUES as readonly string[]).includes(value);
}

export function isContractStatus(value: unknown): value is ContractStatusValue {
  return typeof value === 'string' && (CONTRACT_STATUS_VALUES as readonly string[]).includes(value);
}

/**
 * Counts items by status using the canonical list, returning 0 for any
 * missing keys. Items with unknown status values are bucketed under
 * `__unknown` and logged in development to surface data inconsistencies.
 */
export function countByStatus<T extends string>(
  items: ReadonlyArray<{ status?: string | null }>,
  validValues: readonly T[],
): Record<T, number> & { __unknown: number } {
  const counts = Object.fromEntries(validValues.map(v => [v, 0])) as Record<T, number>;
  let unknown = 0;

  for (const item of items) {
    const s = item.status;
    if (s && (validValues as readonly string[]).includes(s)) {
      counts[s as T] += 1;
    } else {
      unknown += 1;
    }
  }

  if (unknown > 0 && import.meta.env.DEV) {
    console.warn(`[status] ${unknown} item(s) with unknown status ignored from counters`);
  }

  return { ...counts, __unknown: unknown };
}
