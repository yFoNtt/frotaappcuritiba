import { describe, it, expect } from 'vitest';
import type { PaymentInsert, PaymentUpdate } from '@/hooks/usePayments';

// ── Business rule helpers ──

type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

function validatePaymentInsert(data: Partial<PaymentInsert>): string[] {
  const errors: string[] = [];
  if (!data.driver_id) errors.push('driver_id é obrigatório');
  if (!data.amount || data.amount <= 0) errors.push('amount deve ser positivo');
  if (!data.due_date) errors.push('due_date é obrigatório');
  if (!data.reference_week) errors.push('reference_week é obrigatório');
  return errors;
}

function validatePaymentUpdate(data: PaymentUpdate, currentStatus: PaymentStatus): string[] {
  const errors: string[] = [];
  if (data.amount !== undefined && data.amount <= 0) errors.push('amount deve ser positivo');
  if (currentStatus === 'paid' && data.status === 'pending') errors.push('não pode reverter pagamento confirmado');
  if (currentStatus === 'cancelled') errors.push('não pode atualizar pagamento cancelado');
  if (data.status === 'paid' && !data.paid_at && !data.payment_method) errors.push('paid_at e payment_method obrigatórios ao confirmar');
  return errors;
}

function isValidPaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  const transitions: Record<PaymentStatus, PaymentStatus[]> = {
    pending: ['paid', 'overdue', 'cancelled'],
    overdue: ['paid', 'cancelled'],
    paid: [],
    cancelled: [],
  };
  return transitions[from]?.includes(to) ?? false;
}

function calculateOverduePayments(payments: { status: PaymentStatus; due_date: string }[], today: string): number {
  return payments.filter(p => p.status === 'pending' && p.due_date < today).length;
}

function calculateTotalRevenue(payments: { status: PaymentStatus; amount: number }[]): number {
  return payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
}

// ── Tests ──

describe('Payment: validation rules', () => {
  it('requires driver_id, amount, due_date, reference_week', () => {
    const errors = validatePaymentInsert({});
    expect(errors).toContain('driver_id é obrigatório');
    expect(errors).toContain('amount deve ser positivo');
    expect(errors).toContain('due_date é obrigatório');
    expect(errors).toContain('reference_week é obrigatório');
  });

  it('accepts valid payment', () => {
    const errors = validatePaymentInsert({
      driver_id: 'd1', amount: 500, due_date: '2025-02-01', reference_week: '2025-01-27',
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects zero amount', () => {
    const errors = validatePaymentInsert({
      driver_id: 'd1', amount: 0, due_date: '2025-02-01', reference_week: '2025-01-27',
    });
    expect(errors).toContain('amount deve ser positivo');
  });

  it('rejects negative amount', () => {
    const errors = validatePaymentInsert({
      driver_id: 'd1', amount: -100, due_date: '2025-02-01', reference_week: '2025-01-27',
    });
    expect(errors).toContain('amount deve ser positivo');
  });
});

describe('Payment: update validation', () => {
  it('prevents reverting confirmed payment', () => {
    const errors = validatePaymentUpdate({ status: 'pending' }, 'paid');
    expect(errors).toContain('não pode reverter pagamento confirmado');
  });

  it('prevents updating cancelled payment', () => {
    const errors = validatePaymentUpdate({ notes: 'test' }, 'cancelled');
    expect(errors).toContain('não pode atualizar pagamento cancelado');
  });

  it('requires paid_at and payment_method when confirming', () => {
    const errors = validatePaymentUpdate({ status: 'paid' }, 'pending');
    expect(errors).toContain('paid_at e payment_method obrigatórios ao confirmar');
  });

  it('accepts valid confirmation', () => {
    const errors = validatePaymentUpdate({
      status: 'paid', paid_at: '2025-02-01T10:00:00Z', payment_method: 'pix',
    }, 'pending');
    expect(errors).toHaveLength(0);
  });
});

describe('Payment: status transitions', () => {
  it('pending → paid is valid', () => {
    expect(isValidPaymentTransition('pending', 'paid')).toBe(true);
  });

  it('pending → overdue is valid', () => {
    expect(isValidPaymentTransition('pending', 'overdue')).toBe(true);
  });

  it('pending → cancelled is valid', () => {
    expect(isValidPaymentTransition('pending', 'cancelled')).toBe(true);
  });

  it('overdue → paid is valid', () => {
    expect(isValidPaymentTransition('overdue', 'paid')).toBe(true);
  });

  it('paid → any is invalid (terminal)', () => {
    expect(isValidPaymentTransition('paid', 'pending')).toBe(false);
    expect(isValidPaymentTransition('paid', 'cancelled')).toBe(false);
  });

  it('cancelled → any is invalid (terminal)', () => {
    expect(isValidPaymentTransition('cancelled', 'pending')).toBe(false);
    expect(isValidPaymentTransition('cancelled', 'paid')).toBe(false);
  });
});

describe('Payment: calculations', () => {
  const payments = [
    { status: 'paid' as PaymentStatus, amount: 500, due_date: '2025-01-01' },
    { status: 'paid' as PaymentStatus, amount: 750, due_date: '2025-01-08' },
    { status: 'pending' as PaymentStatus, amount: 500, due_date: '2025-01-15' },
    { status: 'pending' as PaymentStatus, amount: 500, due_date: '2025-02-01' },
    { status: 'cancelled' as PaymentStatus, amount: 300, due_date: '2025-01-01' },
  ];

  it('calculates total revenue from paid payments', () => {
    expect(calculateTotalRevenue(payments)).toBe(1250);
  });

  it('identifies overdue payments', () => {
    expect(calculateOverduePayments(payments, '2025-01-20')).toBe(1);
  });

  it('no overdue if all pending are in the future', () => {
    expect(calculateOverduePayments(payments, '2025-01-10')).toBe(0);
  });

  it('counts multiple overdue payments', () => {
    expect(calculateOverduePayments(payments, '2025-03-01')).toBe(2);
  });
});
