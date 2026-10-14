import type { ContractStatusValue } from './statusConstants';

export function canChangeContractParties(status: ContractStatusValue): boolean {
  return status === 'pending';
}

export function canTransitionContract(from: ContractStatusValue, to: ContractStatusValue): boolean {
  if (from === to) return true;
  if (from === 'ended' || from === 'cancelled') return false;
  return !(from === 'active' && to === 'pending');
}

/** Date-only CNH expiry remains valid throughout its expiration day. */
export function getContractActivationError(
  vehicle: { status: string } | undefined,
  driver: { cnh_expiry: string } | undefined,
  today = new Date(),
): { field: 'vehicle_id' | 'driver_id'; message: string } | null {
  if (!vehicle || vehicle.status !== 'available') {
    return { field: 'vehicle_id', message: 'O veículo precisa estar disponível para ativar o contrato.' };
  }
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (!driver || !/^\d{4}-\d{2}-\d{2}$/.test(driver.cnh_expiry) || driver.cnh_expiry < date) {
    return { field: 'driver_id', message: 'A CNH do motorista está vencida ou inválida. Atualize a validade antes de ativar o contrato.' };
  }
  return null;
}