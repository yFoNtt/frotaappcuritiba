import { describe, it, expect } from 'vitest';
import { isProfileComplete, type Profile } from '@/hooks/useProfile';

const base = { document_type: null, document_number: null, cnh_number: null, cnh_expiry: null } as unknown as Profile;

describe('isProfileComplete com is_test_account', () => {
  it('locador de teste sem CPF/CNPJ é considerado completo', () => {
    expect(isProfileComplete({ ...base, is_test_account: true }, 'locador')).toBe(true);
  });
  it('locador comum sem CPF/CNPJ continua incompleto', () => {
    expect(isProfileComplete({ ...base, is_test_account: false }, 'locador')).toBe(false);
  });
  it('motorista de teste ainda precisa de CNH', () => {
    expect(isProfileComplete({ ...base, is_test_account: true }, 'motorista')).toBe(false);
  });
});
