import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateAuthError } from '@/components/auth/authErrors';

describe('translateAuthError', () => {
  it('traduz credenciais inválidas', () => {
    expect(translateAuthError({ message: 'Invalid login credentials' }, 'login')).toMatch(/senha incorretos/i);
  });

  it('traduz limite de envios de e-mail', () => {
    expect(translateAuthError({ message: 'Email rate limit exceeded' }, 'reset')).toMatch(/muitas solicitações/i);
  });

  it('traduz e-mail inválido', () => {
    expect(translateAuthError({ message: 'Unable to validate email address: invalid format' }, 'reset')).toBe(
      'Digite um e-mail válido.',
    );
  });

  it('traduz falha de rede', () => {
    expect(translateAuthError({ message: 'Failed to fetch' }, 'login')).toMatch(/verifique sua internet/i);
  });

  it('traduz link expirado', () => {
    expect(translateAuthError('otp_expired', 'update')).toMatch(/expirou/i);
  });

  it('traduz senha vazada (HIBP)', () => {
    expect(translateAuthError({ message: 'weak_password: password is known to be pwned' }, 'update')).toMatch(
      /vazamentos/i,
    );
  });

  it('traduz nova senha igual à anterior', () => {
    expect(
      translateAuthError({ message: 'New password should be different from the old password.' }, 'update'),
    ).toMatch(/diferente da senha atual/i);
  });

  it('traduz provedor não habilitado', () => {
    expect(translateAuthError({ message: 'Unsupported provider: provider is not enabled' }, 'oauth')).toMatch(
      /temporariamente indisponível/i,
    );
  });

  it('traduz e-mail já cadastrado', () => {
    expect(translateAuthError({ message: 'User already registered' }, 'signup')).toMatch(/já existe uma conta/i);
  });

  it('usa fallback genérico por contexto', () => {
    expect(translateAuthError({ message: 'something totally unknown' }, 'signup')).toMatch(/criar a conta/i);
    expect(translateAuthError(null, 'oauth')).toMatch(/entrar com o google/i);
  });
});

const signInWithOAuth = vi.fn();
const toastError = vi.fn();

vi.mock('@/integrations/lovable/index', () => ({
  lovable: { auth: { signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args) } },
}));
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

describe('signInWithGoogle', () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    toastError.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('retorna "redirected" quando o navegador é redirecionado', async () => {
    const { signInWithGoogle } = await import('@/components/auth/useGoogleSignIn');
    signInWithOAuth.mockResolvedValue({ redirected: true });
    await expect(signInWithGoogle()).resolves.toBe('redirected');
    expect(toastError).not.toHaveBeenCalled();
  });

  it('retorna "session" quando a sessão é criada', async () => {
    const { signInWithGoogle } = await import('@/components/auth/useGoogleSignIn');
    signInWithOAuth.mockResolvedValue({ tokens: { access_token: 'x' } });
    await expect(signInWithGoogle()).resolves.toBe('session');
    expect(toastError).not.toHaveBeenCalled();
  });

  it('mostra mensagem em português quando há erro', async () => {
    const { signInWithGoogle } = await import('@/components/auth/useGoogleSignIn');
    signInWithOAuth.mockResolvedValue({ error: new Error('Unsupported provider') });
    await expect(signInWithGoogle()).resolves.toBe('error');
    expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/temporariamente indisponível/i));
  });

  it('captura exceções inesperadas', async () => {
    const { signInWithGoogle } = await import('@/components/auth/useGoogleSignIn');
    signInWithOAuth.mockRejectedValue(new Error('Failed to fetch'));
    await expect(signInWithGoogle()).resolves.toBe('error');
    expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/internet/i));
  });
});
