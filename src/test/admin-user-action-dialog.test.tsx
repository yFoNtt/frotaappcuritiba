import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminUserActionDialog } from '@/components/admin/AdminUserActionDialog';

const user = { id: '00000000-0000-4000-8000-000000000001', email: 'test@example.com', role: 'locador' as const, created_at: '', last_sign_in_at: null, blocked_at: null, blocked_reason: null };

describe('Admin user action confirmations', () => {
  it('keeps destructive confirmation open when reason is missing', async () => {
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    render(<AdminUserActionDialog open action="delete" user={user} pending={false} onSubmit={onSubmit} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await screen.findByText('Informe o motivo');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('submits deletion with reason and closes only after success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(<AdminUserActionDialog open action="delete" user={user} pending={false} onSubmit={onSubmit} onOpenChange={onOpenChange} />);
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Solicitação do titular' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ action: 'delete_user', user_id: user.id, reason: 'Solicitação do titular' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('rejects weak temporary passwords before calling the service', async () => {
    const onSubmit = vi.fn();
    render(<AdminUserActionDialog open action="temporary-password" user={user} pending={false} onSubmit={onSubmit} onOpenChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Senha temporária'), { target: { value: 'weak' } });
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Sem acesso ao e-mail' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await screen.findByText('Use 8 caracteres, maiúscula, minúscula, número e especial');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});