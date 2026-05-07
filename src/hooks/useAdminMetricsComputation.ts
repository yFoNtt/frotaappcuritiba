import { useMemo } from 'react';

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
 */
export function useAdminMetricsComputation({
  filteredVehicles,
  filteredContracts,
  totalDrivers = 0,
}: Options) {
  return useMemo(() => {
    const totalVehicles = filteredVehicles.length;
    const availableCount = filteredVehicles.filter(v => v.status === 'available').length;
    const rentedCount = filteredVehicles.filter(v => v.status === 'rented').length;
    const maintenanceCount = filteredVehicles.filter(v => v.status === 'maintenance').length;

    const totalContracts = filteredContracts.length;
    const activeContractsCount = filteredContracts.filter(c => c.status === 'active').length;
    const completedContractsCount = filteredContracts.filter(c => c.status === 'completed').length;
    const cancelledContractsCount = filteredContracts.filter(c => c.status === 'cancelled').length;

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
      { name: 'Disponíveis', value: availableCount, color: 'hsl(var(--success))' },
      { name: 'Alugados', value: rentedCount, color: 'hsl(var(--primary))' },
      { name: 'Manutenção', value: maintenanceCount, color: 'hsl(var(--warning))' },
    ];

    const contractStatusData = [
      { name: 'Ativos', value: activeContractsCount, color: 'hsl(var(--success))' },
      { name: 'Finalizados', value: completedContractsCount, color: 'hsl(var(--muted-foreground))' },
      { name: 'Cancelados', value: cancelledContractsCount, color: 'hsl(var(--destructive))' },
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
      occupancyRate,
      contractConversionRate,
      vehicleUtilization,
      vehicleStatusData,
      contractStatusData,
    };
  }, [filteredVehicles, filteredContracts, totalDrivers]);
}
