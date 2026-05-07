import { useMemo } from 'react';
import {
  VEHICLE_STATUS,
  VEHICLE_STATUS_VALUES,
  VEHICLE_STATUS_LABELS,
  CONTRACT_STATUS,
  CONTRACT_STATUS_VALUES,
  CONTRACT_STATUS_LABELS,
  countByStatus,
} from '@/lib/statusConstants';

interface VehicleLike {
  status?: string | null;
  created_at?: string | null;
}

interface ContractLike {
  status?: string | null;
  created_at?: string | null;
}

interface Options {
  filteredVehicles: VehicleLike[];
  filteredContracts: ContractLike[];
  totalDrivers?: number;
}

/**
 * Centralizes all derived counters, rates and chart datasets for the
 * Admin → Indicadores page so cards and charts can never diverge.
 * Uses canonical status constants + validation to avoid silently
 * miscounting rows with unknown/legacy status values.
 */
export function useAdminMetricsComputation({
  filteredVehicles,
  filteredContracts,
  totalDrivers = 0,
}: Options) {
  return useMemo(() => {
    const vCounts = countByStatus(filteredVehicles, VEHICLE_STATUS_VALUES);
    const cCounts = countByStatus(filteredContracts, CONTRACT_STATUS_VALUES);

    const totalVehicles = filteredVehicles.length;
    const availableCount = vCounts[VEHICLE_STATUS.AVAILABLE];
    const rentedCount = vCounts[VEHICLE_STATUS.RENTED];
    const maintenanceCount = vCounts[VEHICLE_STATUS.MAINTENANCE];

    const totalContracts = filteredContracts.length;
    const activeContractsCount = cCounts[CONTRACT_STATUS.ACTIVE];
    const completedContractsCount = cCounts[CONTRACT_STATUS.COMPLETED];
    const cancelledContractsCount = cCounts[CONTRACT_STATUS.CANCELLED];
    const pendingContractsCount = cCounts[CONTRACT_STATUS.PENDING];

    const occupancyRate = totalVehicles > 0
      ? Math.round((rentedCount / totalVehicles) * 100)
      : 0;
    const contractConversionRate = totalDrivers > 0
      ? Math.round((activeContractsCount / totalDrivers) * 100)
      : 0;
    const vehicleUtilization = totalVehicles > 0
      ? Math.round(((rentedCount + maintenanceCount) / totalVehicles) * 100)
      : 0;

    const vehicleStatusData = [
      { name: VEHICLE_STATUS_LABELS.available, value: availableCount, color: 'hsl(var(--success))' },
      { name: VEHICLE_STATUS_LABELS.rented, value: rentedCount, color: 'hsl(var(--primary))' },
      { name: VEHICLE_STATUS_LABELS.maintenance, value: maintenanceCount, color: 'hsl(var(--warning))' },
    ];

    const contractStatusData = [
      { name: CONTRACT_STATUS_LABELS.active, value: activeContractsCount, color: 'hsl(var(--success))' },
      { name: CONTRACT_STATUS_LABELS.completed, value: completedContractsCount, color: 'hsl(var(--muted-foreground))' },
      { name: CONTRACT_STATUS_LABELS.cancelled, value: cancelledContractsCount, color: 'hsl(var(--destructive))' },
    ];

    return {
      totalVehicles,
      availableCount,
      rentedCount,
      maintenanceCount,
      totalContracts,
      activeContractsCount,
      completedContractsCount,
      cancelledContractsCount,
      pendingContractsCount,
      unknownVehicles: vCounts.__unknown,
      unknownContracts: cCounts.__unknown,
      occupancyRate,
      contractConversionRate,
      vehicleUtilization,
      vehicleStatusData,
      contractStatusData,
    };
  }, [filteredVehicles, filteredContracts, totalDrivers]);
}
