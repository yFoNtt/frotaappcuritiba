import { describe, it, expect } from 'vitest';
import {
  maskCPF,
  maskCNH,
  maskPhone,
  maskEmail,
  maskPlate,
  sanitizeContextForAI,
} from '@/lib/piiSanitizer';

describe('piiSanitizer', () => {
  describe('maskCPF', () => {
    it('masks all digits except the last two', () => {
      const masked = maskCPF('12345678909');
      expect(masked).toMatch(/^[X.]+09$/);
      expect(masked.endsWith('09')).toBe(true);
      expect(masked.includes('1')).toBe(false);
    });
    it('returns input when invalid length', () => {
      expect(maskCPF('123')).toBe('123');
    });
    it('handles formatted CPF', () => {
      const masked = maskCPF('123.456.789-09');
      expect(masked.endsWith('09')).toBe(true);
    });
  });

  describe('maskCNH', () => {
    it('keeps first 5 digits, masks rest', () => {
      expect(maskCNH('12345678901')).toBe('12345******');
    });
    it('returns input when too short', () => {
      expect(maskCNH('123')).toBe('123');
    });
  });

  describe('maskPhone', () => {
    it('masks middle of 11-digit phone, keeps DDD and last 4', () => {
      expect(maskPhone('41999998888')).toBe('(41) XXXXX-8888');
    });
    it('masks 10-digit phone', () => {
      expect(maskPhone('4133334444')).toBe('(41) XXXXX-4444');
    });
    it('returns input when too short', () => {
      expect(maskPhone('1234')).toBe('1234');
    });
  });

  describe('maskEmail', () => {
    it('keeps first 2 chars of local part', () => {
      expect(maskEmail('joao.silva@exemplo.com')).toBe('jo****@exemplo.com');
    });
    it('returns input when no @', () => {
      expect(maskEmail('invalido')).toBe('invalido');
    });
  });

  describe('maskPlate', () => {
    it('masks last 4 chars of Mercosul plate', () => {
      expect(maskPlate('ABC1D23')).toBe('ABC-****');
    });
    it('masks last 4 chars of legacy plate', () => {
      expect(maskPlate('ABC1234')).toBe('ABC-****');
    });
    it('returns input when too short', () => {
      expect(maskPlate('AB')).toBe('AB');
    });
  });

  describe('sanitizeContextForAI', () => {
    it('masks all PII fields, preserves others', () => {
      const out = sanitizeContextForAI({
        cpf: '12345678909',
        cnh: '12345678901',
        phone: '41999998888',
        email: 'test@x.com',
        plate: 'ABC1D23',
        nome: 'Joao',
      });
      expect(out.nome).toBe('Joao');
      expect(out.email).toBe('te****@x.com');
      expect(out.plate).toBe('ABC-****');
      expect(out.cpf).not.toContain('1234');
    });
  });
});
