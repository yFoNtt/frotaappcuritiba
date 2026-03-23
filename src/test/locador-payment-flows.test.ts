import { describe, it, expect } from 'vitest';
import type { Payment, PaymentInsert, PaymentUpdate } from '@/hooks/usePayments';

// ============================================================
// Integration tests for locador payment flows:
// creation, confirmation, cancellation, weekly generation
// ============================================================

type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

// ---- In-memory payment store simulating Supabase operations ----

class PaymentStore {
  private payments: Payment[] = [];
  private locadorId: string;

  constructor(locadorId: string) {
    this.locadorId = locadorId;
  }

  create(input: PaymentInsert): Payment {
    if (!input.driver_id) throw new Error('driver_id é obrigatório');
    if (!input.amount || input.amount <= 0) throw new Error('amount deve ser positivo');
    if (!input.due_date) throw new Error('due_date é obrigatório');
    if (!input.reference_week) throw new Error('reference_week é obrigatório');

    const payment: Payment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      locador_id: this.locadorId,
      driver_id: input.driver_id,
      contract_id: input.contract_id ?? null,
      vehicle_id: input.vehicle_id ?? null,
      amount: input.amount,
      due_date: input.due_date,
      paid_at: null,
      payment_method: null,
      reference_week: input.reference_week,
      status: 'pending',
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.payments.push(payment);
    return payment;
  }

  getById(id: string): Payment | undefined {
    return this.payments.find(p => p.id === id);
  }

  getAll(): Payment[] {
    return [...this.payments].sort((a, b) => b.due_date.localeCompare(a.due_date));
  }

  getByDriver(driverId: string): Payment[] {
    return this.payments.filter(p => p.driver_id === driverId);
  }

  getByContract(contractId: string): Payment[] {
    return this.payments.filter(p => p.contract_id === contractId);
  }

  getByReferenceWeek(week: string): Payment[] {
    return this.payments.filter(p => p.reference_week === week);
  }

  markAsPaid(id: string, paymentMethod?: string): Payment {
    const payment = this.payments.find(p => p.id === id);
    if (!payment) throw new Error('Pagamento não encontrado');
    if (payment.status === 'paid') throw new Error('Pagamento já confirmado');
    if (payment.status === 'cancelled') throw new Error('Não pode confirmar pagamento cancelado');

    payment.status = 'paid';
    payment.paid_at = new Date().toISOString();
    payment.payment_method = paymentMethod || null;
    payment.updated_at = new Date().toISOString();
    return payment;
  }

  cancel(id: string): Payment {
    const payment = this.payments.find(p => p.id === id);
    if (!payment) throw new Error('Pagamento não encontrado');
    if (payment.status === 'paid') throw new Error('Não pode cancelar pagamento já confirmado');
    if (payment.status === 'cancelled') throw new Error('Pagamento já cancelado');

    payment.status = 'cancelled';
    payment.updated_at = new Date().toISOString();
    return payment;
  }

  delete(id: string): void {
    const payment = this.payments.find(p => p.id === id);
    if (!payment) throw new Error('Pagamento não encontrado');
    if (payment.status !== 'pending') throw new Error('Só pode excluir pagamentos pendentes');

    this.payments = this.payments.filter(p => p.id !== id);
  }

  update(id: string, updates: PaymentUpdate): Payment {
    const payment = this.payments.find(p => p.id === id);
    if (!payment) throw new Error('Pagamento não encontrado');
    if (payment.status === 'cancelled') throw new Error('Não pode atualizar pagamento cancelado');
    if (payment.status === 'paid' && updates.status === 'pending') throw new Error('Não pode reverter pagamento confirmado');

    if (updates.amount !== undefined) payment.amount = updates.amount;
    if (updates.due_date !== undefined) payment.due_date = updates.due_date;
    if (updates.status !== undefined) payment.status = updates.status;
    if (updates.paid_at !== undefined) payment.paid_at = updates.paid_at;
    if (updates.payment_method !== undefined) payment.payment_method = updates.payment_method;
    if (updates.notes !== undefined) payment.notes = updates.notes;
    payment.updated_at = new Date().toISOString();
    return payment;
  }

  generateWeeklyPayments(
    contracts: { id: string; driver_id: string; vehicle_id: string; weekly_price: number }[],
    referenceWeek: string
  ): Payment[] {
    const existing = this.getByReferenceWeek(referenceWeek);
    const existingContractIds = new Set(existing.map(p => p.contract_id));

    const newPayments = contracts
      .filter(c => !existingContractIds.has(c.id))
      .map(c => this.create({
        driver_id: c.driver_id,
        contract_id: c.id,
        vehicle_id: c.vehicle_id,
        amount: c.weekly_price,
        due_date: referenceWeek,
        reference_week: referenceWeek,
      }));

    if (newPayments.length === 0) throw new Error('Cobranças já geradas para esta semana');
    return newPayments;
  }

  getSummary() {
    const all = this.payments;
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      total: all.length,
      pending: all.filter(p => p.status === 'pending' && p.due_date >= todayStr).length,
      overdue: all.filter(p => p.status === 'pending' && p.due_date < todayStr).length,
      paid: all.filter(p => p.status === 'paid').length,
      cancelled: all.filter(p => p.status === 'cancelled').length,
      totalReceived: all.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
      totalPending: all.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    };
  }
}

// ---- Mock contracts ----

const mockContracts = [
  { id: 'c1', driver_id: 'd1', vehicle_id: 'v1', weekly_price: 800 },
  { id: 'c2', driver_id: 'd2', vehicle_id: 'v2', weekly_price: 650 },
  { id: 'c3', driver_id: 'd3', vehicle_id: 'v3', weekly_price: 900 },
];

// ============================================================

describe('Locador Payment Flow: Creation', () => {
  it('creates a pending payment with correct fields', () => {
    const store = new PaymentStore('locador-1');
    const payment = store.create({
      driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24',
    });

    expect(payment.status).toBe('pending');
    expect(payment.locador_id).toBe('locador-1');
    expect(payment.amount).toBe(800);
    expect(payment.paid_at).toBeNull();
    expect(payment.payment_method).toBeNull();
  });

  it('rejects creation without driver_id', () => {
    const store = new PaymentStore('locador-1');
    expect(() => store.create({
      driver_id: '', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24',
    })).toThrow('driver_id é obrigatório');
  });

  it('rejects creation with zero amount', () => {
    const store = new PaymentStore('locador-1');
    expect(() => store.create({
      driver_id: 'd1', amount: 0, due_date: '2025-03-01', reference_week: '2025-02-24',
    })).toThrow('amount deve ser positivo');
  });

  it('rejects creation with negative amount', () => {
    const store = new PaymentStore('locador-1');
    expect(() => store.create({
      driver_id: 'd1', amount: -100, due_date: '2025-03-01', reference_week: '2025-02-24',
    })).toThrow('amount deve ser positivo');
  });

  it('creates payment with optional contract and vehicle', () => {
    const store = new PaymentStore('locador-1');
    const payment = store.create({
      driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24',
      contract_id: 'c1', vehicle_id: 'v1', notes: 'Semana 1',
    });

    expect(payment.contract_id).toBe('c1');
    expect(payment.vehicle_id).toBe('v1');
    expect(payment.notes).toBe('Semana 1');
  });

  it('assigns unique IDs to each payment', () => {
    const store = new PaymentStore('locador-1');
    const p1 = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    const p2 = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-08', reference_week: '2025-03-03' });
    expect(p1.id).not.toBe(p2.id);
  });
});

describe('Locador Payment Flow: Confirmation (Mark as Paid)', () => {
  it('marks pending payment as paid', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    const paid = store.markAsPaid(created.id, 'pix');

    expect(paid.status).toBe('paid');
    expect(paid.paid_at).not.toBeNull();
    expect(paid.payment_method).toBe('pix');
  });

  it('marks overdue payment as paid', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2020-01-01', reference_week: '2020-01-01' });
    // Simulate overdue by updating status
    store.update(created.id, { status: 'overdue' });
    // Should not throw since overdue→paid is valid
    const updated = store.getById(created.id)!;
    expect(updated.status).toBe('overdue');
    const paid = store.markAsPaid(created.id, 'dinheiro');
    expect(paid.status).toBe('paid');
  });

  it('rejects double confirmation', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.markAsPaid(created.id, 'pix');
    expect(() => store.markAsPaid(created.id, 'pix')).toThrow('Pagamento já confirmado');
  });

  it('rejects confirmation of cancelled payment', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.cancel(created.id);
    expect(() => store.markAsPaid(created.id)).toThrow('Não pode confirmar pagamento cancelado');
  });

  it('marks paid without explicit payment method', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    const paid = store.markAsPaid(created.id);
    expect(paid.payment_method).toBeNull();
  });

  it('rejects confirmation of non-existent payment', () => {
    const store = new PaymentStore('locador-1');
    expect(() => store.markAsPaid('non-existent')).toThrow('Pagamento não encontrado');
  });
});

describe('Locador Payment Flow: Cancellation', () => {
  it('cancels a pending payment', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    const cancelled = store.cancel(created.id);

    expect(cancelled.status).toBe('cancelled');
  });

  it('rejects cancellation of paid payment', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.markAsPaid(created.id, 'pix');
    expect(() => store.cancel(created.id)).toThrow('Não pode cancelar pagamento já confirmado');
  });

  it('rejects double cancellation', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.cancel(created.id);
    expect(() => store.cancel(created.id)).toThrow('Pagamento já cancelado');
  });

  it('rejects cancellation of non-existent payment', () => {
    const store = new PaymentStore('locador-1');
    expect(() => store.cancel('non-existent')).toThrow('Pagamento não encontrado');
  });
});

describe('Locador Payment Flow: Deletion', () => {
  it('deletes a pending payment', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.delete(created.id);
    expect(store.getById(created.id)).toBeUndefined();
  });

  it('rejects deletion of paid payment', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.markAsPaid(created.id, 'pix');
    expect(() => store.delete(created.id)).toThrow('Só pode excluir pagamentos pendentes');
  });

  it('rejects deletion of cancelled payment', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.cancel(created.id);
    expect(() => store.delete(created.id)).toThrow('Só pode excluir pagamentos pendentes');
  });
});

describe('Locador Payment Flow: Weekly Generation', () => {
  it('generates payments for all active contracts', () => {
    const store = new PaymentStore('locador-1');
    const generated = store.generateWeeklyPayments(mockContracts, '2025-03-03');
    expect(generated).toHaveLength(3);
    expect(generated[0].amount).toBe(800);
    expect(generated[1].amount).toBe(650);
    expect(generated[2].amount).toBe(900);
  });

  it('skips contracts that already have payments for the week', () => {
    const store = new PaymentStore('locador-1');
    store.generateWeeklyPayments(mockContracts, '2025-03-03');
    // Try generating again for same week
    expect(() => store.generateWeeklyPayments(mockContracts, '2025-03-03'))
      .toThrow('Cobranças já geradas para esta semana');
  });

  it('generates only for contracts without existing payment', () => {
    const store = new PaymentStore('locador-1');
    // Pre-create payment for contract c1
    store.create({
      driver_id: 'd1', amount: 800, due_date: '2025-03-10',
      reference_week: '2025-03-10', contract_id: 'c1',
    });
    const generated = store.generateWeeklyPayments(mockContracts, '2025-03-10');
    expect(generated).toHaveLength(2);
    expect(generated.map(p => p.contract_id)).not.toContain('c1');
  });

  it('sets correct reference_week and due_date', () => {
    const store = new PaymentStore('locador-1');
    const generated = store.generateWeeklyPayments(mockContracts, '2025-04-07');
    generated.forEach(p => {
      expect(p.reference_week).toBe('2025-04-07');
      expect(p.due_date).toBe('2025-04-07');
    });
  });

  it('throws when no contracts provided', () => {
    const store = new PaymentStore('locador-1');
    expect(() => store.generateWeeklyPayments([], '2025-03-03'))
      .toThrow('Cobranças já geradas para esta semana');
  });
});

describe('Locador Payment Flow: Update', () => {
  it('updates amount of pending payment', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    const updated = store.update(created.id, { amount: 900 });
    expect(updated.amount).toBe(900);
  });

  it('updates notes of pending payment', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    const updated = store.update(created.id, { notes: 'Desconto aplicado' });
    expect(updated.notes).toBe('Desconto aplicado');
  });

  it('rejects update of cancelled payment', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.cancel(created.id);
    expect(() => store.update(created.id, { amount: 900 })).toThrow('Não pode atualizar pagamento cancelado');
  });

  it('rejects reverting paid to pending', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.markAsPaid(created.id, 'pix');
    expect(() => store.update(created.id, { status: 'pending' })).toThrow('Não pode reverter pagamento confirmado');
  });
});

describe('Locador Payment Flow: Queries & Summary', () => {
  it('lists payments sorted by due_date descending', () => {
    const store = new PaymentStore('locador-1');
    store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-15', reference_week: '2025-03-10' });
    store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-08', reference_week: '2025-03-03' });

    const all = store.getAll();
    expect(all[0].due_date).toBe('2025-03-15');
    expect(all[2].due_date).toBe('2025-03-01');
  });

  it('filters by driver', () => {
    const store = new PaymentStore('locador-1');
    store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.create({ driver_id: 'd2', amount: 650, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-08', reference_week: '2025-03-03' });

    expect(store.getByDriver('d1')).toHaveLength(2);
    expect(store.getByDriver('d2')).toHaveLength(1);
  });

  it('filters by contract', () => {
    const store = new PaymentStore('locador-1');
    store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24', contract_id: 'c1' });
    store.create({ driver_id: 'd2', amount: 650, due_date: '2025-03-01', reference_week: '2025-02-24', contract_id: 'c2' });

    expect(store.getByContract('c1')).toHaveLength(1);
    expect(store.getByContract('c999')).toHaveLength(0);
  });

  it('calculates summary correctly', () => {
    const store = new PaymentStore('locador-1');
    const p1 = store.create({ driver_id: 'd1', amount: 800, due_date: '2030-03-01', reference_week: '2030-02-24' });
    const p2 = store.create({ driver_id: 'd1', amount: 800, due_date: '2030-03-08', reference_week: '2030-03-03' });
    const p3 = store.create({ driver_id: 'd1', amount: 800, due_date: '2020-01-01', reference_week: '2020-01-01' }); // overdue
    const p4 = store.create({ driver_id: 'd1', amount: 650, due_date: '2030-03-15', reference_week: '2030-03-10' });

    store.markAsPaid(p1.id, 'pix');
    store.cancel(p4.id);

    const summary = store.getSummary();
    expect(summary.total).toBe(4);
    expect(summary.paid).toBe(1);
    expect(summary.pending).toBe(1); // p2 (future)
    expect(summary.overdue).toBe(1); // p3 (past due)
    expect(summary.cancelled).toBe(1); // p4
    expect(summary.totalReceived).toBe(800);
  });
});

describe('Locador Payment Flow: Full Lifecycle', () => {
  it('create → confirm → verify paid state', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    expect(created.status).toBe('pending');

    const paid = store.markAsPaid(created.id, 'pix');
    expect(paid.status).toBe('paid');
    expect(paid.paid_at).not.toBeNull();

    const fetched = store.getById(created.id)!;
    expect(fetched.status).toBe('paid');
  });

  it('create → cancel → verify cancelled state', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.cancel(created.id);

    const fetched = store.getById(created.id)!;
    expect(fetched.status).toBe('cancelled');
  });

  it('create → delete → verify removed', () => {
    const store = new PaymentStore('locador-1');
    const created = store.create({ driver_id: 'd1', amount: 800, due_date: '2025-03-01', reference_week: '2025-02-24' });
    store.delete(created.id);
    expect(store.getById(created.id)).toBeUndefined();
    expect(store.getAll()).toHaveLength(0);
  });

  it('generate weekly → confirm all → verify summary', () => {
    const store = new PaymentStore('locador-1');
    const generated = store.generateWeeklyPayments(mockContracts, '2025-03-03');

    generated.forEach(p => store.markAsPaid(p.id, 'pix'));

    const summary = store.getSummary();
    expect(summary.paid).toBe(3);
    expect(summary.pending).toBe(0);
    expect(summary.totalReceived).toBe(800 + 650 + 900);
  });

  it('generate weekly → cancel one → confirm others', () => {
    const store = new PaymentStore('locador-1');
    const generated = store.generateWeeklyPayments(mockContracts, '2025-04-07');

    store.cancel(generated[0].id);
    store.markAsPaid(generated[1].id, 'transferência');
    store.markAsPaid(generated[2].id, 'pix');

    const summary = store.getSummary();
    expect(summary.paid).toBe(2);
    expect(summary.cancelled).toBe(1);
    expect(summary.totalReceived).toBe(650 + 900);
  });
});
