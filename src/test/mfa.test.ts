import { describe, it, expect, beforeEach } from 'vitest';
import {
  isMfaMandatory,
  isMfaRequired,
  isValidMfaCode,
  isMfaVerified,
  setMfaVerified,
  clearMfaVerified,
} from '@/lib/mfa';

describe('MFA - obrigatoriedade por role', () => {
  it('é obrigatória para admin e locador', () => {
    expect(isMfaMandatory('admin')).toBe(true);
    expect(isMfaMandatory('locador')).toBe(true);
  });

  it('não é obrigatória para motorista nem sem role', () => {
    expect(isMfaMandatory('motorista')).toBe(false);
    expect(isMfaMandatory(null)).toBe(false);
  });

  it('motorista só exige MFA quando ativou nas configurações', () => {
    expect(isMfaRequired('motorista', false)).toBe(false);
    expect(isMfaRequired('motorista', true)).toBe(true);
  });

  it('admin exige MFA mesmo com flag desativada', () => {
    expect(isMfaRequired('admin', false)).toBe(true);
  });
});

describe('MFA - validação de código', () => {
  it('aceita 6 dígitos', () => {
    expect(isValidMfaCode('123456')).toBe(true);
    expect(isValidMfaCode(' 123456 ')).toBe(true);
  });

  it('rejeita códigos inválidos', () => {
    expect(isValidMfaCode('12345')).toBe(false);
    expect(isValidMfaCode('1234567')).toBe(false);
    expect(isValidMfaCode('abcdef')).toBe(false);
    expect(isValidMfaCode('')).toBe(false);
  });
});

describe('MFA - estado de verificação por sessão', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('começa não verificado', () => {
    expect(isMfaVerified('u1')).toBe(false);
  });

  it('marca e limpa a verificação do usuário', () => {
    setMfaVerified('u1');
    expect(isMfaVerified('u1')).toBe(true);
    expect(isMfaVerified('u2')).toBe(false);
    clearMfaVerified('u1');
    expect(isMfaVerified('u1')).toBe(false);
  });

  it('retorna false sem userId', () => {
    expect(isMfaVerified(null)).toBe(false);
  });
});
