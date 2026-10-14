import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getContractActivationError, canChangeContractParties, canTransitionContract } from '@/lib/contractRules';
import { CONTRACT_STATUS, CONTRACT_STATUS_VALUES, countByStatus, isContractStatus } from '@/lib/statusConstants';
import { useAdminMetricsComputation } from '@/hooks/useAdminMetricsComputation';

describe('Contract client rules', () => {
  const today = new Date(2026, 9, 14, 16);
  it('uses ended as the canonical finished status', () => {
    expect(CONTRACT_STATUS.ENDED).toBe('ended');
    expect(CONTRACT_STATUS_VALUES).toEqual(['active', 'ended', 'cancelled', 'pending']);
    expect(isContractStatus('completed')).toBe(false);
    expect(countByStatus([{ status: 'ended' }], CONTRACT_STATUS_VALUES).ended).toBe(1);
  });
  it('includes ended contracts in admin chart/export datasets', () => {
    const { result } = renderHook(() => useAdminMetricsComputation({ filteredVehicles: [], filteredContracts: [{ status: 'ended' }] }));
    expect(result.current.completedContractsCount).toBe(1);
    expect(result.current.unknownContracts).toBe(0);
    expect(result.current.contractStatusData[1].value).toBe(1);
  });
  it.each(['rented', 'maintenance', 'inactive'])('blocks activation for %s vehicles', status => {
    expect(getContractActivationError({ status }, { cnh_expiry: '2030-12-31' }, today)?.field).toBe('vehicle_id');
  });
  it('blocks expired CNH before activation', () => {
    expect(getContractActivationError({ status: 'available' }, { cnh_expiry: '2026-10-13' }, today)?.field).toBe('driver_id');
  });
  it('allows available vehicle and valid CNH', () => {
    expect(getContractActivationError({ status: 'available' }, { cnh_expiry: '2030-12-31' }, today)).toBeNull();
  });
  it('keeps date-only CNH valid throughout expiration day', () => {
    expect(getContractActivationError({ status: 'available' }, { cnh_expiry: '2026-10-14' }, today)).toBeNull();
  });
  it('allows party changes only for pending contracts', () => {
    expect(CONTRACT_STATUS_VALUES.filter(canChangeContractParties)).toEqual(['pending']);
  });
  it('blocks reopening ended contracts', () => expect(canTransitionContract('ended', 'active')).toBe(false));
  it('blocks reopening cancelled contracts', () => expect(canTransitionContract('cancelled', 'active')).toBe(false));
  it('blocks active contracts returning to draft', () => expect(canTransitionContract('active', 'pending')).toBe(false));
  it('permits closing active contracts', () => expect(canTransitionContract('active', 'ended')).toBe(true));
});