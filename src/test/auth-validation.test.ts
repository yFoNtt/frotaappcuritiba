import { describe, it, expect } from 'vitest';

// Test the same validation logic used in useAuth.signUp
function validateSignUpInputs(email: string, password: string, role: string) {
  const errors: string[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) errors.push('Email inválido');

  if (password.length < 8) errors.push('Senha deve ter pelo menos 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Senha deve conter pelo menos uma letra maiúscula');
  if (!/[0-9]/.test(password)) errors.push('Senha deve conter pelo menos um número');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Senha deve conter pelo menos um caractere especial');

  if (role === 'admin') errors.push('Não é possível se cadastrar como administrador');

  return errors;
}

describe('Sign-up validation logic', () => {
  it('accepts valid inputs', () => {
    expect(validateSignUpInputs('user@test.com', 'Senha@123', 'locador')).toEqual([]);
  });

  it('rejects invalid email formats', () => {
    expect(validateSignUpInputs('notanemail', 'Senha@123', 'locador')).toContain('Email inválido');
    expect(validateSignUpInputs('', 'Senha@123', 'locador')).toContain('Email inválido');
    expect(validateSignUpInputs('user@', 'Senha@123', 'locador')).toContain('Email inválido');
  });

  it('rejects short passwords', () => {
    expect(validateSignUpInputs('u@t.com', 'Ab1!', 'locador')).toContain('Senha deve ter pelo menos 8 caracteres');
  });

  it('rejects password without uppercase', () => {
    expect(validateSignUpInputs('u@t.com', 'senha@123', 'locador')).toContain('Senha deve conter pelo menos uma letra maiúscula');
  });

  it('rejects password without number', () => {
    expect(validateSignUpInputs('u@t.com', 'Senha@abc', 'locador')).toContain('Senha deve conter pelo menos um número');
  });

  it('rejects password without special char', () => {
    expect(validateSignUpInputs('u@t.com', 'Senha1234', 'locador')).toContain('Senha deve conter pelo menos um caractere especial');
  });

  it('blocks admin self-registration', () => {
    expect(validateSignUpInputs('u@t.com', 'Senha@123', 'admin')).toContain('Não é possível se cadastrar como administrador');
  });

  it('allows locador and motorista roles', () => {
    expect(validateSignUpInputs('u@t.com', 'Senha@123', 'locador')).toEqual([]);
    expect(validateSignUpInputs('u@t.com', 'Senha@123', 'motorista')).toEqual([]);
  });
});
