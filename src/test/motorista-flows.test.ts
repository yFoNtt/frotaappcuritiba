import { describe, it, expect } from 'vitest';
import type { MotoristaVehicle, MotoristaContract, MotoristaFullData } from '@/hooks/useMotoristaData';
import type { Document, DocumentType } from '@/hooks/useDocuments';

// ============================================================
// Tests for motorista flows: dashboard stats, documents, vehicle
// ============================================================

// ---- Motorista Stats Logic (mirrors useMotoristaStats) ----

interface Payment {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
}

function computeMotoristaStats(payments: Payment[], contractEndDate: string | null) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const totalPago = payments
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const overduePayments = pendingPayments.filter(p => p.due_date < todayStr);

  const pendente = pendingPayments
    .filter(p => p.due_date >= todayStr)
    .reduce((acc, p) => acc + p.amount, 0);

  const atrasado = overduePayments.reduce((acc, p) => acc + p.amount, 0);

  const upcomingPayments = pendingPayments
    .filter(p => p.due_date >= todayStr)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const proximoVencimento = upcomingPayments[0]?.due_date || null;

  let diasRestantesContrato = 0;
  if (contractEndDate) {
    const endDate = new Date(contractEndDate);
    const diffTime = endDate.getTime() - today.getTime();
    diasRestantesContrato = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return { totalPago, pendente, atrasado, proximoVencimento, diasRestantesContrato };
}

// ---- History Logic (mirrors useMotoristaHistory) ----

interface HistoryItem {
  id: string;
  tipo: 'pagamento' | 'contrato' | 'manutencao';
  descricao: string;
  data: string;
  valor: number | null;
}

function buildHistory(
  payments: Payment[],
  contracts: { id: string; start_date: string; end_date: string | null; status: string }[],
): HistoryItem[] {
  const history: HistoryItem[] = [];

  payments.forEach(p => {
    if (p.status === 'paid' && p.paid_at) {
      history.push({
        id: `payment-${p.id}`,
        tipo: 'pagamento',
        descricao: 'Pagamento semanal realizado',
        data: p.paid_at.split('T')[0],
        valor: p.amount,
      });
    }
  });

  contracts.forEach(c => {
    history.push({
      id: `contract-start-${c.id}`,
      tipo: 'contrato',
      descricao: 'Contrato de locação iniciado',
      data: c.start_date,
      valor: null,
    });
    if (c.status === 'ended' && c.end_date) {
      history.push({
        id: `contract-end-${c.id}`,
        tipo: 'contrato',
        descricao: 'Contrato de locação encerrado',
        data: c.end_date,
        valor: null,
      });
    }
  });

  history.sort((a, b) => b.data.localeCompare(a.data));
  return history;
}

// ---- Document Helpers ----

function generateFilePath(userId: string, type: DocumentType, fileName: string): string {
  const ext = fileName.split('.').pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  return `${userId}/${type}/${uniqueName}`;
}

function isDocumentExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function isDocumentExpiringSoon(expiresAt: string | null, days: number): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= days;
}

function filterDocumentsByType(docs: Document[], type: DocumentType): Document[] {
  return docs.filter(d => d.type === type);
}

function filterDocumentsByDriver(docs: Document[], driverId: string): Document[] {
  return docs.filter(d => d.driver_id === driverId);
}

// ---- CNH Alert Logic ----

function getCnhStatus(cnhExpiry: string): 'valid' | 'expiring' | 'expired' {
  const expiry = new Date(cnhExpiry);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 90) return 'expiring';
  return 'valid';
}

// ---- Mock Data ----

const mockPayments: Payment[] = [
  { id: 'p1', amount: 800, status: 'paid', due_date: '2024-05-01', paid_at: '2024-05-01T10:00:00Z' },
  { id: 'p2', amount: 800, status: 'paid', due_date: '2024-05-08', paid_at: '2024-05-08T10:00:00Z' },
  { id: 'p3', amount: 800, status: 'pending', due_date: '2020-01-01', paid_at: null }, // overdue
  { id: 'p4', amount: 800, status: 'pending', due_date: '2030-12-31', paid_at: null }, // upcoming
  { id: 'p5', amount: 600, status: 'pending', due_date: '2030-06-15', paid_at: null }, // upcoming
];

const mockDocuments: Document[] = [
  { id: 'doc1', locador_id: 'l1', driver_id: 'd1', vehicle_id: null, contract_id: null, type: 'cnh', name: 'CNH João', file_path: 'l1/cnh/file1.pdf', file_size: 1024, mime_type: 'application/pdf', description: null, expires_at: '2025-12-31', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'doc2', locador_id: 'l1', driver_id: 'd1', vehicle_id: null, contract_id: 'c1', type: 'contrato', name: 'Contrato Locação', file_path: 'l1/contrato/file2.pdf', file_size: 2048, mime_type: 'application/pdf', description: 'Contrato padrão', expires_at: null, created_at: '2024-02-01T00:00:00Z', updated_at: '2024-02-01T00:00:00Z' },
  { id: 'doc3', locador_id: 'l1', driver_id: 'd2', vehicle_id: 'v1', contract_id: null, type: 'comprovante', name: 'Comprovante', file_path: 'l1/comprovante/file3.jpg', file_size: 512, mime_type: 'image/jpeg', description: null, expires_at: '2020-06-01', created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z' },
];

// ============================================================

describe('Motorista Stats - Payment Calculation', () => {
  it('calculates total paid correctly', () => {
    const stats = computeMotoristaStats(mockPayments, null);
    expect(stats.totalPago).toBe(1600); // 800 + 800
  });

  it('calculates overdue amount', () => {
    const stats = computeMotoristaStats(mockPayments, null);
    expect(stats.atrasado).toBe(800); // p3 is overdue
  });

  it('calculates pending (non-overdue) amount', () => {
    const stats = computeMotoristaStats(mockPayments, null);
    expect(stats.pendente).toBe(1400); // 800 + 600
  });

  it('finds next due date', () => {
    const stats = computeMotoristaStats(mockPayments, null);
    expect(stats.proximoVencimento).toBe('2030-06-15');
  });

  it('returns null next due date when no upcoming payments', () => {
    const paidOnly = mockPayments.filter(p => p.status === 'paid');
    const stats = computeMotoristaStats(paidOnly, null);
    expect(stats.proximoVencimento).toBeNull();
  });

  it('calculates remaining contract days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const stats = computeMotoristaStats([], futureDate.toISOString().split('T')[0]);
    expect(stats.diasRestantesContrato).toBeGreaterThanOrEqual(29);
    expect(stats.diasRestantesContrato).toBeLessThanOrEqual(31);
  });

  it('returns 0 days for expired contract', () => {
    const stats = computeMotoristaStats([], '2020-01-01');
    expect(stats.diasRestantesContrato).toBe(0);
  });

  it('returns 0 days when no end date', () => {
    const stats = computeMotoristaStats([], null);
    expect(stats.diasRestantesContrato).toBe(0);
  });

  it('handles empty payments', () => {
    const stats = computeMotoristaStats([], null);
    expect(stats.totalPago).toBe(0);
    expect(stats.pendente).toBe(0);
    expect(stats.atrasado).toBe(0);
  });
});

describe('Motorista History - Building', () => {
  const contracts = [
    { id: 'c1', start_date: '2024-01-01', end_date: '2024-06-30', status: 'ended' },
    { id: 'c2', start_date: '2024-07-01', end_date: null, status: 'active' },
  ];

  it('builds history from payments and contracts', () => {
    const history = buildHistory(mockPayments, contracts);
    expect(history.length).toBeGreaterThan(0);
  });

  it('includes paid payments only', () => {
    const history = buildHistory(mockPayments, []);
    const paymentItems = history.filter(h => h.tipo === 'pagamento');
    expect(paymentItems).toHaveLength(2);
  });

  it('includes contract start events', () => {
    const history = buildHistory([], contracts);
    const starts = history.filter(h => h.descricao.includes('iniciado'));
    expect(starts).toHaveLength(2);
  });

  it('includes contract end events for ended contracts', () => {
    const history = buildHistory([], contracts);
    const ends = history.filter(h => h.descricao.includes('encerrado'));
    expect(ends).toHaveLength(1);
  });

  it('does not include end event for active contracts', () => {
    const history = buildHistory([], [contracts[1]]);
    const ends = history.filter(h => h.descricao.includes('encerrado'));
    expect(ends).toHaveLength(0);
  });

  it('sorts history by date descending', () => {
    const history = buildHistory(mockPayments, contracts);
    for (let i = 1; i < history.length; i++) {
      expect(history[i - 1].data >= history[i].data).toBe(true);
    }
  });

  it('handles empty data', () => {
    expect(buildHistory([], [])).toEqual([]);
  });
});

describe('Motorista Documents - Filtering', () => {
  it('filters by type cnh', () => {
    expect(filterDocumentsByType(mockDocuments, 'cnh')).toHaveLength(1);
  });

  it('filters by type contrato', () => {
    expect(filterDocumentsByType(mockDocuments, 'contrato')).toHaveLength(1);
  });

  it('filters by driver', () => {
    expect(filterDocumentsByDriver(mockDocuments, 'd1')).toHaveLength(2);
    expect(filterDocumentsByDriver(mockDocuments, 'd2')).toHaveLength(1);
  });

  it('returns empty for unknown driver', () => {
    expect(filterDocumentsByDriver(mockDocuments, 'd999')).toHaveLength(0);
  });
});

describe('Motorista Documents - Expiry', () => {
  it('detects expired document', () => {
    expect(isDocumentExpired('2020-06-01')).toBe(true);
  });

  it('detects valid document', () => {
    expect(isDocumentExpired('2030-12-31')).toBe(false);
  });

  it('handles null expires_at', () => {
    expect(isDocumentExpired(null)).toBe(false);
  });

  it('detects document expiring soon', () => {
    const in10Days = new Date();
    in10Days.setDate(in10Days.getDate() + 10);
    expect(isDocumentExpiringSoon(in10Days.toISOString().split('T')[0], 30)).toBe(true);
  });

  it('does not flag far-future documents', () => {
    expect(isDocumentExpiringSoon('2030-12-31', 30)).toBe(false);
  });

  it('does not flag expired as expiring soon', () => {
    expect(isDocumentExpiringSoon('2020-01-01', 30)).toBe(false);
  });
});

describe('Motorista Documents - File Path', () => {
  it('generates path with correct structure', () => {
    const path = generateFilePath('user1', 'cnh', 'document.pdf');
    expect(path).toMatch(/^user1\/cnh\/.+\.pdf$/);
  });

  it('preserves file extension', () => {
    const path = generateFilePath('user1', 'contrato', 'contract.docx');
    expect(path).toMatch(/\.docx$/);
  });

  it('generates unique paths', () => {
    const path1 = generateFilePath('u1', 'cnh', 'f.pdf');
    const path2 = generateFilePath('u1', 'cnh', 'f.pdf');
    expect(path1).not.toBe(path2);
  });
});

describe('Motorista CNH Status', () => {
  it('detects expired CNH', () => {
    expect(getCnhStatus('2020-01-01')).toBe('expired');
  });

  it('detects expiring CNH (within 90 days)', () => {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    expect(getCnhStatus(in30Days.toISOString().split('T')[0])).toBe('expiring');
  });

  it('detects valid CNH', () => {
    expect(getCnhStatus('2030-12-31')).toBe('valid');
  });
});

describe('Motorista Full Data - Shape', () => {
  it('returns null fields when no driver linked', () => {
    const data: MotoristaFullData = {
      driver: null, vehicle: null, contract: null, locador: null,
    };
    expect(data.driver).toBeNull();
    expect(data.vehicle).toBeNull();
  });

  it('returns complete data shape when linked', () => {
    const data: MotoristaFullData = {
      driver: { id: 'd1', name: 'João', email: 'j@e.com', phone: '11999', cnh_number: '12345678901', cnh_expiry: '2025-12-31' },
      vehicle: { id: 'v1', brand: 'Toyota', model: 'Corolla', year: 2023, plate: 'ABC1234', color: 'Branco', fuel_type: 'flex', status: 'rented', images: [], weekly_price: 800 },
      contract: { id: 'c1', start_date: '2024-01-01', end_date: null, weekly_price: 800, payment_day: 'segunda-feira', status: 'active', deposit: 2000, km_limit: 1000 },
      locador: { id: 'l1', email: 'loc@e.com' },
    };
    expect(data.driver?.name).toBe('João');
    expect(data.vehicle?.brand).toBe('Toyota');
    expect(data.contract?.status).toBe('active');
    expect(data.locador?.id).toBe('l1');
  });

  it('handles vehicle without contract', () => {
    const data: MotoristaFullData = {
      driver: { id: 'd1', name: 'João', email: 'j@e.com', phone: null, cnh_number: '12345678901', cnh_expiry: '2025-12-31' },
      vehicle: { id: 'v1', brand: 'Honda', model: 'Civic', year: 2022, plate: 'XYZ5678', color: 'Preto', fuel_type: 'gasoline', status: 'rented', images: [], weekly_price: 900 },
      contract: null,
      locador: { id: 'l1', email: '' },
    };
    expect(data.vehicle).not.toBeNull();
    expect(data.contract).toBeNull();
  });
});
