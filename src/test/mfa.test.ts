import { describe, it, expect, beforeEach } from 'vitest';
import {
  isMfaMandatory,
  isMfaRequired,
  isValidMfaCode,
  isMfaVerified,
  setMfaVerified,
  clearMfaVerified,
  isMagicLinkReturn,
  parseMagicLinkError,
  magicLinkErrorMessage,
} from '@/lib/mfa';

describe('MFA - retorno pelo link do e-mail', () => {
  it('reconhece o hash do link mágico', () => {
    expect(isMagicLinkReturn('#access_token=abc&type=magiclink')).toBe(true);
    expect(isMagicLinkReturn('#type=magiclink')).toBe(true);
  });

  it('reconhece o fluxo PKCE com ?code=', () => {
    expect(isMagicLinkReturn('', '?code=xyz')).toBe(true);
  });

  it('reconhece o retorno com erro do provedor', () => {
    expect(isMagicLinkReturn('#error=access_denied&error_code=otp_expired')).toBe(true);
    expect(isMagicLinkReturn('', '?error_code=otp_expired')).toBe(true);
  });

  it('ignora URLs comuns', () => {
    expect(isMagicLinkReturn('')).toBe(false);
    expect(isMagicLinkReturn('#top', '?ref=email')).toBe(false);
  });
});

describe('MFA - erros do link', () => {
  it('extrai o código do erro do hash e da query', () => {
    expect(parseMagicLinkError('#error=access_denied&error_code=otp_expired')).toBe('otp_expired');
    expect(parseMagicLinkError('', '?error=access_denied')).toBe('access_denied');
    expect(parseMagicLinkError('#access_token=abc')).toBeNull();
  });

  it('traduz a mensagem para pt-BR', () => {
    expect(magicLinkErrorMessage('otp_expired')).toMatch(/expirou/i);
    expect(magicLinkErrorMessage('outro')).toMatch(/Reenviar e-mail/i);
  });
});



describe('MFA - obrigatoriedade por role', () => {
  it('não é obrigatória para nenhuma role (sempre opcional)', () => {
    expect(isMfaMandatory('admin')).toBe(false);
    expect(isMfaMandatory('locador')).toBe(false);
    expect(isMfaMandatory('motorista')).toBe(false);
    expect(isMfaMandatory(null)).toBe(false);
  });

  it('só exige verificação quando o usuário ativou nas Configurações', () => {
    expect(isMfaRequired('admin', false)).toBe(false);
    expect(isMfaRequired('locador', false)).toBe(false);
    expect(isMfaRequired('motorista', false)).toBe(false);
    expect(isMfaRequired('admin', true)).toBe(true);
    expect(isMfaRequired('locador', true)).toBe(true);
    expect(isMfaRequired('motorista', true)).toBe(true);
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
    window.localStorage.clear();
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
