import { describe, it, expect } from 'vitest';
import {
  validateCPF,
  validateCNPJ,
  validateDocument,
  validateCNH,
  formatCPF,
  formatCNPJ,
  formatDocument,
  formatCNH,
} from '@/lib/documentValidation';

describe('validateCPF', () => {
  it('validates known valid CPFs', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
    expect(validateCPF('52998224725')).toBe(true);
  });

  it('rejects all-same-digit CPFs', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
    expect(validateCPF('00000000000')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(validateCPF('1234')).toBe(false);
    expect(validateCPF('123456789012')).toBe(false);
  });

  it('rejects invalid check digits', () => {
    expect(validateCPF('52998224726')).toBe(false);
  });
});

describe('validateCNPJ', () => {
  it('validates known valid CNPJ', () => {
    expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
    expect(validateCNPJ('11222333000181')).toBe(true);
  });

  it('rejects all-same-digit CNPJs', () => {
    expect(validateCNPJ('11111111111111')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(validateCNPJ('1234')).toBe(false);
  });
});

describe('validateDocument', () => {
  it('detects CPF by length', () => {
    const result = validateDocument('52998224725');
    expect(result.type).toBe('cpf');
    expect(result.isValid).toBe(true);
  });

  it('detects CNPJ by length', () => {
    const result = validateDocument('11222333000181');
    expect(result.type).toBe('cnpj');
    expect(result.isValid).toBe(true);
  });

  it('returns error for empty', () => {
    const result = validateDocument('');
    expect(result.isValid).toBe(false);
    expect(result.type).toBeNull();
  });

  it('returns error for wrong length', () => {
    const result = validateDocument('12345');
    expect(result.isValid).toBe(false);
    expect(result.type).toBeNull();
  });
});

describe('validateCNH', () => {
  it('rejects all-same-digit', () => {
    expect(validateCNH('11111111111')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(validateCNH('123')).toBe(false);
    expect(validateCNH('1234567890123')).toBe(false);
  });
});

describe('formatting', () => {
  it('formatCPF applies mask', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });

  it('formatCNPJ applies mask', () => {
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('formatDocument auto-detects type', () => {
    expect(formatDocument('52998224725')).toBe('529.982.247-25');
    expect(formatDocument('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('formatCNH applies mask', () => {
    expect(formatCNH('12345678901')).toBe('123 4567 8901');
  });
});
