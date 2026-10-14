import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import Contracts from '@/pages/locador/Contracts';

const state = vi.hoisted(() => ({ expiry: '2030-12-31', status: 'available', create: vi.fn().mockResolvedValue({}) }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/contracts/ContractInspectionsSection', () => ({ ContractInspectionsSection: () => null }));
vi.mock('@/components/inspections/InspectionDetailsDialog', () => ({ InspectionDetailsDialog: () => null }));
vi.mock('@/hooks/useContracts', () => ({
  useLocadorContracts: () => ({ data: [], isLoading: false }),
  useCreateContract: () => ({ mutateAsync: state.create, isPending: false }),
  useEndContract: () => ({ mutateAsync: vi.fn() }),
  useCancelContract: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/hooks/useDrivers', () => ({ useLocadorDrivers: () => ({ data: [{ id: 'd1', name: 'Motorista teste', cnh_expiry: state.expiry }], isLoading: false }) }));
vi.mock('@/hooks/useVehicles', () => ({ useLocadorVehicles: () => ({ data: [{ id: 'v1', brand: 'Fiat', model: 'Argo', plate: 'AAA1B23', status: state.status, weekly_price: 800 }], isLoading: false }) }));

// Native selectors exercise form state/submission without coupling to Radix portals.
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => <select value={value} onChange={event => onValueChange(event.target.value)}><option value="">Selecione</option>{children}</select>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

afterEach(() => { cleanup(); state.expiry = '2030-12-31'; state.status = 'available'; vi.clearAllMocks(); });

describe('Contract form activation checks', () => {
  function fill() {
    render(<Contracts />);
    fireEvent.click(screen.getByRole('button', { name: 'Novo Contrato' }));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'd1' } });
    fireEvent.change(selects[2], { target: { value: 'v1' } });
    fireEvent.change(screen.getByLabelText('Data de Início'), { target: { value: '2026-10-14' } });
  }
  it('does not submit an active contract with expired CNH', () => {
    state.expiry = '2020-01-01';
    fill();
    const submit = screen.getByRole('button', { name: 'Criar Contrato' });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(state.create).not.toHaveBeenCalled();
  });
  it('submits available vehicle and valid driver as an active contract', async () => {
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Criar Contrato' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledWith(expect.objectContaining({ driver_id: 'd1', vehicle_id: 'v1', status: 'active', weekly_price: 800 })));
  });
  it('keeps unavailable vehicles out of the activation selector', () => {
    state.status = 'maintenance';
    render(<Contracts />);
    expect(screen.getByRole('button', { name: 'Novo Contrato' })).toBeDisabled();
    expect(state.create).not.toHaveBeenCalled();
  });
});