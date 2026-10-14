import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Drivers from '@/pages/locador/Drivers';

const mutations = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), remove: vi.fn() }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/hooks/useDrivers', () => ({
  useLocadorDrivers: () => ({ data: [
    { id: 'd1', name: 'Motorista livre', email: 'free@example.test', cnh_number: '12345678901', cnh_expiry: '2030-12-31', vehicle_id: null, created_at: '2026-01-01', user_id: 'u1' },
    { id: 'd2', name: 'Motorista com veículo', email: 'linked@example.test', cnh_number: '12345678901', cnh_expiry: '2030-12-31', vehicle_id: 'v1', created_at: '2026-01-01', user_id: 'u2' },
  ], isLoading: false }),
  useCreateDriver: () => ({ mutateAsync: mutations.create }),
  useUpdateDriver: () => ({ mutateAsync: mutations.update }),
  useDeleteDriver: () => ({ mutateAsync: mutations.remove }),
  useGenerateDriverInvite: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/hooks/useVehicles', () => ({ useLocadorVehicles: () => ({ data: [{ id: 'v1', brand: 'Fiat', model: 'Argo' }], isLoading: false }) }));
vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn() } }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Driver links use contracts, never direct mutations', () => {
  function open() {
    render(<MemoryRouter initialEntries={['/locador/motoristas']}><Routes>
      <Route path="/locador/motoristas" element={<Drivers />} />
      <Route path="/locador/contratos" element={<h1>Contratos</h1>} />
    </Routes></MemoryRouter>);
  }
  it.each([
    'Para vincular um veículo, crie e ative um contrato',
    'Para desvincular, encerre o contrato',
  ])('navigates to contracts without writing when choosing %s', name => {
    open();
    fireEvent.click(screen.getAllByRole('button', { name })[0]);
    expect(screen.getByRole('heading', { name: 'Contratos' })).toBeInTheDocument();
    expect(mutations.create).not.toHaveBeenCalled();
    expect(mutations.update).not.toHaveBeenCalled();
    expect(mutations.remove).not.toHaveBeenCalled();
  });
});